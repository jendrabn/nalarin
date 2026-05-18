import "server-only"

import { and, desc, eq, gte, sql } from "drizzle-orm"

import { db, schema } from "@/db"
import { isFeatureReleased } from "@/features/tryouts/utils/status"

import type {
  ProgressActivityItem,
  ProgressExamType,
  ProgressPageData,
  ProgressPeriod,
  ProgressSubject,
  ProgressSummary,
  ProgressStreak,
  ProgressTopicSnapshot,
} from "../types"
import { getProgressPeriodStart } from "../utils/period"
import { syncUserProgressSnapshots } from "../services/sync-progress"

type ProgressQueryInput = {
  userId: number
  period: ProgressPeriod
  examTypeSlug?: string
  subjectSlug?: string
}

export async function getProgressPageData(input: ProgressQueryInput): Promise<ProgressPageData | null> {
  await syncUserProgressSnapshots(input.userId)

  const examTypes = await getExamTypes()
  const activeExamType = input.examTypeSlug
    ? examTypes.find((examType) => examType.slug === input.examTypeSlug) ?? null
    : null

  if (input.examTypeSlug && !activeExamType) {
    return null
  }

  const subjects = activeExamType ? await getSubjects(activeExamType.id) : []
  const activeSubject =
    activeExamType && input.subjectSlug
      ? subjects.find((subject) => subject.slug === input.subjectSlug) ?? null
      : null

  if (input.subjectSlug && !activeSubject) {
    return null
  }

  const summary = await getProgressSummary({
    userId: input.userId,
    examTypeId: activeExamType?.id ?? 0,
    subjectId: activeSubject?.id ?? 0,
  })
  const activityInput = {
    userId: input.userId,
    period: input.period,
    examTypeId: activeExamType?.id ?? null,
    subjectId: activeSubject?.id ?? null,
  }
  const [activities, streak] = await Promise.all([
    getProgressActivities(activityInput),
    getProgressStreak(activityInput),
  ])

  return {
    activePeriod: input.period,
    examTypes,
    subjects,
    activeExamType,
    activeSubject,
    summary,
    streak,
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

async function getSubjects(examTypeId: number): Promise<ProgressSubject[]> {
  return db
    .select({
      id: schema.subjects.id,
      name: schema.subjects.name,
      slug: schema.subjects.slug,
    })
    .from(schema.subjects)
    .where(eq(schema.subjects.examTypeId, examTypeId))
    .orderBy(schema.subjects.name)
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
  period: ProgressPeriod
  examTypeId: number | null
  subjectId: number | null
}) {
  const periodStart = getProgressPeriodStart(input.period)
  const [practiceRows, tryoutRows] = await Promise.all([
    getPracticeActivities(input, periodStart),
    getTryoutActivities(input, periodStart),
  ])

  return [...practiceRows, ...tryoutRows]
    .sort((a, b) => {
      const left = a.completedAt ? new Date(a.completedAt).getTime() : 0
      const right = b.completedAt ? new Date(b.completedAt).getTime() : 0

      return right - left
    })
    .slice(0, 30)
}

async function getProgressStreak(input: {
  userId: number
  period: ProgressPeriod
  examTypeId: number | null
  subjectId: number | null
}): Promise<ProgressStreak> {
  const end = new Date()
  end.setHours(0, 0, 0, 0)

  const start = new Date(end)
  start.setDate(start.getDate() - 83)

  const [practiceRows, tryoutRows] = await Promise.all([
    getPracticeDailyActivity(input, start),
    getTryoutDailyActivity(input, start),
  ])
  const countByDate = new Map<string, number>()

  for (const row of [...practiceRows, ...tryoutRows]) {
    countByDate.set(row.date, (countByDate.get(row.date) ?? 0) + row.count)
  }

  const days = Array.from({ length: 84 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    const dateKey = toDateKey(date)
    const count = countByDate.get(dateKey) ?? 0

    return {
      date: dateKey,
      count,
      level: getActivityLevel(count),
    }
  })

  return {
    days,
    currentStreak: getCurrentStreak(days),
    longestStreak: getLongestStreak(days),
    activeDays: days.filter((day) => day.count > 0).length,
    totalSessions: days.reduce((total, day) => total + day.count, 0),
  }
}

async function getPracticeActivities(
  input: {
    userId: number
    period: ProgressPeriod
    examTypeId: number | null
    subjectId: number | null
  },
  periodStart: Date | null,
): Promise<ProgressActivityItem[]> {
  const filters = [
    eq(schema.practiceSessions.userId, input.userId),
    eq(schema.practiceSessions.status, "graded"),
  ]

  if (periodStart) {
    filters.push(gte(schema.practiceSessions.gradedAt, periodStart))
  }

  if (input.examTypeId) {
    filters.push(eq(schema.practices.examTypeId, input.examTypeId))
  }

  if (input.subjectId) {
    filters.push(eq(schema.practices.subjectId, input.subjectId))
  }

  const rows = await db
    .select({
      id: schema.practiceSessions.id,
      title: schema.practices.title,
      examTypeName: schema.examTypes.name,
      subjectName: schema.subjects.name,
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
    .innerJoin(schema.subjects, eq(schema.practices.subjectId, schema.subjects.id))
    .where(and(...filters))
    .orderBy(desc(schema.practiceSessions.gradedAt))
    .limit(30)

  return rows.map((row) => ({
    id: row.id,
    type: "practice",
    title: row.title,
    examTypeName: row.examTypeName,
    subjectName: row.subjectName,
    completedAt: row.completedAt?.toISOString() ?? null,
    score: Number(row.score ?? 0),
    maxScore: Number(row.maxScore ?? 0),
    correct: row.correct,
    wrong: row.wrong,
    unanswered: row.unanswered,
    reviewHref: `/practice-sessions/${row.id}/review`,
  }))
}

async function getPracticeDailyActivity(
  input: {
    userId: number
    examTypeId: number | null
    subjectId: number | null
  },
  start: Date,
) {
  const filters = [
    eq(schema.practiceSessions.userId, input.userId),
    eq(schema.practiceSessions.status, "graded"),
    gte(schema.practiceSessions.gradedAt, start),
  ]

  if (input.examTypeId) {
    filters.push(eq(schema.practices.examTypeId, input.examTypeId))
  }

  if (input.subjectId) {
    filters.push(eq(schema.practices.subjectId, input.subjectId))
  }

  return db
    .select({
      date: sql<string>`date(${schema.practiceSessions.gradedAt})`,
      count: sql<number>`count(*)`,
    })
    .from(schema.practiceSessions)
    .innerJoin(schema.practices, eq(schema.practiceSessions.practiceId, schema.practices.id))
    .where(and(...filters))
    .groupBy(sql`date(${schema.practiceSessions.gradedAt})`)
}

async function getTryoutActivities(
  input: {
    userId: number
    period: ProgressPeriod
    examTypeId: number | null
    subjectId: number | null
  },
  periodStart: Date | null,
): Promise<ProgressActivityItem[]> {
  const filters = [
    eq(schema.tryoutSessions.userId, input.userId),
    eq(schema.tryoutSessions.status, "graded"),
  ]

  if (periodStart) {
    filters.push(gte(schema.tryoutSessions.gradedAt, periodStart))
  }

  if (input.examTypeId) {
    filters.push(eq(schema.tryouts.examTypeId, input.examTypeId))
  }

  if (input.subjectId) {
    filters.push(
      sql`exists (
        select 1 from tryout_section_sessions tss
        inner join tryout_sections ts on tss.tryout_section_id = ts.id
        where tss.tryout_session_id = ${schema.tryoutSessions.id}
          and ts.subject_id = ${input.subjectId}
      )`,
    )
  }

  const rows = await db
    .select({
      id: schema.tryoutSessions.id,
      title: schema.tryouts.title,
      examTypeName: schema.examTypes.name,
      completedAt: schema.tryoutSessions.gradedAt,
      score: schema.tryoutSessions.totalScore,
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

  return rows.map((row) => {
    const resultAvailable = isFeatureReleased({
      enabled: row.showResultAfterSubmit,
      releaseAt: row.resultReleaseAt?.toISOString() ?? null,
    })
    const reviewHref = resultAvailable ? `/tryout-sessions/${row.id}/review` : null

    return {
      id: row.id,
      type: "tryout",
      title: row.title,
      examTypeName: row.examTypeName,
      subjectName: null,
      completedAt: row.completedAt?.toISOString() ?? null,
      score: Number(row.score ?? 0),
      maxScore: Number(row.maxScore ?? 0),
      correct: row.correct,
      wrong: row.wrong,
      unanswered: row.unanswered,
      reviewHref,
    }
  })
}

async function getTryoutDailyActivity(
  input: {
    userId: number
    examTypeId: number | null
    subjectId: number | null
  },
  start: Date,
) {
  const filters = [
    eq(schema.tryoutSessions.userId, input.userId),
    eq(schema.tryoutSessions.status, "graded"),
    gte(schema.tryoutSessions.gradedAt, start),
  ]

  if (input.examTypeId) {
    filters.push(eq(schema.tryouts.examTypeId, input.examTypeId))
  }

  if (input.subjectId) {
    filters.push(
      sql`exists (
        select 1 from tryout_section_sessions tss
        inner join tryout_sections ts on tss.tryout_section_id = ts.id
        where tss.tryout_session_id = ${schema.tryoutSessions.id}
          and ts.subject_id = ${input.subjectId}
      )`,
    )
  }

  return db
    .select({
      date: sql<string>`date(${schema.tryoutSessions.gradedAt})`,
      count: sql<number>`count(*)`,
    })
    .from(schema.tryoutSessions)
    .innerJoin(schema.tryouts, eq(schema.tryoutSessions.tryoutId, schema.tryouts.id))
    .where(and(...filters))
    .groupBy(sql`date(${schema.tryoutSessions.gradedAt})`)
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

function getActivityLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) {
    return 0
  }

  if (count === 1) {
    return 1
  }

  if (count === 2) {
    return 2
  }

  if (count <= 4) {
    return 3
  }

  return 4
}

function getCurrentStreak(days: ProgressStreak["days"]) {
  let streak = 0

  for (let index = days.length - 1; index >= 0; index -= 1) {
    if (days[index]?.count === 0) {
      break
    }

    streak += 1
  }

  return streak
}

function getLongestStreak(days: ProgressStreak["days"]) {
  let longest = 0
  let current = 0

  for (const day of days) {
    if (day.count > 0) {
      current += 1
      longest = Math.max(longest, current)
      continue
    }

    current = 0
  }

  return longest
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10)
}
