import "server-only"

import { and, desc, eq, sql } from "drizzle-orm"

import { db, schema } from "@/db"
import { getIrtSessionScoreMap } from "@/features/tryouts/services/irt-score-queries"
import { isFeatureReleased } from "@/features/tryouts/utils/status"

import type {
  ProgressActivityItem,
  ProgressExamType,
  ProgressPageData,
  ProgressSummary,
  ProgressTopicSnapshot,
} from "../types"
import { syncUserProgressSnapshots } from "../services/sync-progress"

type ProgressQueryInput = {
  userId: number
  examTypeSlug?: string
}

export async function getProgressPageData(
  input: ProgressQueryInput,
): Promise<ProgressPageData | null> {
  await syncUserProgressSnapshots(input.userId)

  const examTypes = await getExamTypes()
  const activeExamType = input.examTypeSlug
    ? examTypes.find((examType) => examType.slug === input.examTypeSlug) ?? null
    : null

  if (input.examTypeSlug && !activeExamType) {
    return null
  }

  const summary = await getProgressSummary({
    userId: input.userId,
    examTypeId: activeExamType?.id ?? 0,
    subjectId: 0,
  })
  const activities = await getProgressActivities({
    userId: input.userId,
    examTypeId: activeExamType?.id ?? null,
  })

  return {
    examTypes,
    activeExamType,
    summary,
    activities,
  }
}

async function getExamTypes(): Promise<ProgressExamType[]> {
  return db
    .select({
      id: schema.examTypes.id,
      name: schema.examTypes.name,
      slug: schema.examTypes.slug,
    })
    .from(schema.examTypes)
    .orderBy(schema.examTypes.name)
}

async function getProgressSummary(input: {
  userId: number
  examTypeId: number
  subjectId: number
}): Promise<ProgressSummary> {
  const [snapshot] = await db
    .select({
      totalQuestionsAnswered: schema.userProgressSnapshots.totalQuestionsAnswered,
      totalCorrect: schema.userProgressSnapshots.totalCorrect,
      totalWrong: schema.userProgressSnapshots.totalWrong,
      totalMaxScoreAggregate: schema.userProgressSnapshots.totalMaxScoreAggregate,
      totalScoreAggregate: schema.userProgressSnapshots.totalScoreAggregate,
      averageScore: schema.userProgressSnapshots.averageScore,
      strongestTopics: schema.userProgressSnapshots.strongestTopics,
      weakestTopics: schema.userProgressSnapshots.weakestTopics,
      snapshotDate: schema.userProgressSnapshots.snapshotDate,
    })
    .from(schema.userProgressSnapshots)
    .where(
      and(
        eq(schema.userProgressSnapshots.userId, input.userId),
        eq(schema.userProgressSnapshots.examTypeId, input.examTypeId),
        eq(schema.userProgressSnapshots.subjectId, input.subjectId),
      ),
    )
    .limit(1)

  if (!snapshot) {
    return {
      totalQuestionsAnswered: 0,
      totalCorrect: 0,
      totalWrong: 0,
      averageScore: null,
      accuracy: null,
      totalScoreAggregate: 0,
      totalMaxScoreAggregate: 0,
      strongestTopics: [],
      weakestTopics: [],
      snapshotDate: null,
    }
  }

  const totalQuestionsAnswered = snapshot.totalQuestionsAnswered

  return {
    totalQuestionsAnswered,
    totalCorrect: snapshot.totalCorrect,
    totalWrong: snapshot.totalWrong,
    averageScore: snapshot.averageScore === null ? null : Number(snapshot.averageScore),
    accuracy:
      totalQuestionsAnswered > 0
        ? Math.round((snapshot.totalCorrect / totalQuestionsAnswered) * 100)
        : null,
    totalScoreAggregate: Number(snapshot.totalScoreAggregate ?? 0),
    totalMaxScoreAggregate: Number(snapshot.totalMaxScoreAggregate ?? 0),
    strongestTopics: normalizeTopicSnapshots(snapshot.strongestTopics),
    weakestTopics: normalizeTopicSnapshots(snapshot.weakestTopics),
    snapshotDate: snapshot.snapshotDate,
  }
}

async function getProgressActivities(input: {
  userId: number
  examTypeId: number | null
}) {
  const [practiceRows, tryoutRows] = await Promise.all([
    getPracticeActivities(input),
    getTryoutActivities(input),
  ])

  return [...practiceRows, ...tryoutRows]
    .sort((a, b) => {
      const left = a.completedAt ? new Date(a.completedAt).getTime() : 0
      const right = b.completedAt ? new Date(b.completedAt).getTime() : 0

      return right - left
    })
    .slice(0, 30)
}

async function getPracticeActivities(input: {
  userId: number
  examTypeId: number | null
}): Promise<ProgressActivityItem[]> {
  const filters = [
    eq(schema.practiceSessions.userId, input.userId),
    eq(schema.practiceSessions.status, "graded"),
  ]

  if (input.examTypeId) {
    filters.push(eq(schema.practices.examTypeId, input.examTypeId))
  }

  const rows = await db
    .select({
      id: schema.practiceSessions.id,
      mode: schema.practiceSessions.mode,
      title: schema.practices.title,
      examTypeName: schema.examTypes.name,
      completedAt: schema.practiceSessions.gradedAt,
      score: schema.practiceSessions.totalScore,
      maxScore: schema.practiceSessions.totalMaxScore,
      correct: schema.practiceSessions.totalCorrect,
      wrong: schema.practiceSessions.totalWrong,
      unanswered: schema.practiceSessions.totalUnanswered,
    })
    .from(schema.practiceSessions)
    .innerJoin(schema.practices, eq(schema.practiceSessions.practiceId, schema.practices.id))
    .innerJoin(schema.examTypes, eq(schema.practices.examTypeId, schema.examTypes.id))
    .where(and(...filters))
    .orderBy(desc(schema.practiceSessions.gradedAt))
    .limit(30)

  return rows.map((row) => ({
    id: row.id,
    type: "practice",
    practiceMode: row.mode,
    title: row.title,
    examTypeName: row.examTypeName,
    completedAt: row.completedAt?.toISOString() ?? null,
    score: Number(row.score ?? 0),
    maxScore: Number(row.maxScore ?? 0),
    scoreDisplay: "ratio",
    correct: row.correct,
    wrong: row.wrong,
    unanswered: row.unanswered,
    reviewHref: `/practice-sessions/${row.id}/review`,
  }))
}

async function getTryoutActivities(input: {
  userId: number
  examTypeId: number | null
}): Promise<ProgressActivityItem[]> {
  const filters = [
    eq(schema.tryoutSessions.userId, input.userId),
    eq(schema.tryoutSessions.status, "graded"),
  ]

  if (input.examTypeId) {
    filters.push(eq(schema.tryouts.examTypeId, input.examTypeId))
  }

  const rows = await db
    .select({
      id: schema.tryoutSessions.id,
      title: schema.tryouts.title,
      examTypeName: schema.examTypes.name,
      completedAt: schema.tryoutSessions.gradedAt,
      score: schema.tryoutSessions.totalScore,
      scoringMethod: schema.tryouts.scoringMethod,
      maxScore: sql<string>`coalesce(nullif(${schema.tryoutSessions.totalMaxScore}, 0), (
        select coalesce(sum(tsq.points), 0)
        from tryout_session_questions tsq
        where tsq.tryout_session_id = ${schema.tryoutSessions.id}
      ))`,
      correct: schema.tryoutSessions.totalCorrect,
      wrong: schema.tryoutSessions.totalWrong,
      unanswered: schema.tryoutSessions.totalUnanswered,
      showResultAfterSubmit: schema.tryouts.showResultAfterSubmit,
      resultReleaseAt: schema.tryouts.resultReleaseAt,
    })
    .from(schema.tryoutSessions)
    .innerJoin(schema.tryouts, eq(schema.tryoutSessions.tryoutId, schema.tryouts.id))
    .innerJoin(schema.examTypes, eq(schema.tryouts.examTypeId, schema.examTypes.id))
    .where(and(...filters))
    .orderBy(desc(schema.tryoutSessions.gradedAt))
    .limit(30)

  const irtScoreMap = await getIrtSessionScoreMap(
    rows.filter((row) => row.scoringMethod === "irt_3pl").map((row) => row.id),
  )

  return rows.map((row) => {
    const resultAvailable = isFeatureReleased({
      enabled: row.showResultAfterSubmit,
      releaseAt: row.resultReleaseAt?.toISOString() ?? null,
    })
    const reviewHref = resultAvailable ? `/tryout-sessions/${row.id}/review` : null
    const isIrtScoring = row.scoringMethod === "irt_3pl"

    return {
      id: row.id,
      type: "tryout",
      title: row.title,
      examTypeName: row.examTypeName,
      completedAt: row.completedAt?.toISOString() ?? null,
      score: isIrtScoring ? (irtScoreMap.get(row.id) ?? Number(row.score ?? 0)) : Number(row.score ?? 0),
      maxScore: isIrtScoring ? 0 : Number(row.maxScore ?? 0),
      scoreDisplay: isIrtScoring ? "scaled" : "ratio",
      correct: row.correct,
      wrong: row.wrong,
      unanswered: row.unanswered,
      reviewHref,
    }
  })
}

function normalizeTopicSnapshots(value: unknown): ProgressTopicSnapshot[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => {
      const topic = item as Partial<ProgressTopicSnapshot>

      return {
        topic_id: Number(topic.topic_id ?? 0),
        topic_name: typeof topic.topic_name === "string" ? topic.topic_name : "Topik",
        accuracy: Number(topic.accuracy ?? 0),
      }
    })
    .filter((topic) => topic.topic_id > 0)
}
