"use server"

import "server-only"

import { and, asc, desc, eq, inArray, sql } from "drizzle-orm"

import { db, schema } from "@/db"

import {
  getIrtSectionScoreMapForSessions,
  getIrtSessionScoreMap,
} from "@/features/tryouts/services/irt-score-queries"
import type { TryoutSessionStatus } from "@/features/tryouts/types"
import { IRT_SCORE_MAX } from "@/features/tryouts/utils/irt-scoring"

import { getTryoutById } from "./index"

type TryoutMetricSessionRow = {
  sessionId: number
  userId: number
  userName: string
  userAvatarUrl: string | null
  status: TryoutSessionStatus
  totalQuestions: number
  totalCorrect: number
  totalWrong: number
  totalUnanswered: number
  totalScore: number
  totalMaxScore: number
  totalSectionsStarted: number
  durationUsedSeconds: number
  autoSubmitted: boolean
  startedAt: string
  submittedAt: string | null
  gradedAt: string | null
}

export type AdminTryoutLeaderboardSectionRow = {
  sessionId: number
  sectionSessionId: number
  sectionId: number
  sectionTitle: string
  subjectName: string
  orderIndex: number
  durationMinutes: number
  totalQuestions: number
  correctCount: number
  wrongCount: number
  unansweredCount: number
  score: number
  maxScore: number
  durationUsedSeconds: number
  startedAt: string | null
  submittedAt: string | null
}

export type AdminTryoutLeaderboardRow = TryoutMetricSessionRow & {
  rank: number
  sections: AdminTryoutLeaderboardSectionRow[]
}

export type AdminTryoutScoreBucket = {
  label: string
  min: number
  max: number
  count: number
}

export type AdminTryoutSectionAnalyticsRow = {
  sectionId: number
  sectionTitle: string
  subjectName: string
  orderIndex: number
  sessionCount: number
  averageScore: number
  medianScore: number
  averagePercentage: number
  averageCorrect: number
  averageWrong: number
  averageUnanswered: number
  averageDurationSeconds: number
  highestScore: number
  lowestScore: number
}

export type AdminTryoutInsightMetrics = {
  totalSessions: number
  gradedSessions: number
  completionRate: number
  averageScore: number
  medianScore: number
  topScore: number
  bottomScore: number
  averageDurationSeconds: number
  averageAccuracy: number
  averageMaxScore: number
}

export type AdminTryoutInsightData = {
  tryout: NonNullable<Awaited<ReturnType<typeof getTryoutById>>>
  sessions: TryoutMetricSessionRow[]
  leaderboard: AdminTryoutLeaderboardRow[]
  statusCounts: Record<TryoutSessionStatus, number>
  scoreBuckets: AdminTryoutScoreBucket[]
  sectionAnalytics: AdminTryoutSectionAnalyticsRow[]
  metrics: AdminTryoutInsightMetrics
}

export async function getAdminTryoutInsightData(
  tryoutId: number,
): Promise<AdminTryoutInsightData | null> {
  const tryout = await getTryoutById(tryoutId)

  if (!tryout) {
    return null
  }

  const sessionColumns = {
    sessionId: schema.tryoutSessions.id,
    userId: schema.tryoutSessions.userId,
    userName: schema.users.name,
    userAvatarUrl: schema.users.avatarUrl,
    status: schema.tryoutSessions.status,
    totalQuestions: schema.tryoutSessions.totalQuestions,
    totalCorrect: schema.tryoutSessions.totalCorrect,
    totalWrong: schema.tryoutSessions.totalWrong,
    totalUnanswered: schema.tryoutSessions.totalUnanswered,
    totalScore: schema.tryoutSessions.totalScore,
    totalMaxScore: schema.tryoutSessions.totalMaxScore,
    totalSectionsStarted: schema.tryoutSessions.totalSectionsStarted,
    durationUsedSeconds: schema.tryoutSessions.durationUsedSeconds,
    autoSubmitted: schema.tryoutSessions.autoSubmitted,
    startedAt: schema.tryoutSessions.startedAt,
    submittedAt: schema.tryoutSessions.submittedAt,
    gradedAt: schema.tryoutSessions.gradedAt,
  } as const

  const [sessionRows, statusRows, leaderboardRows] = await Promise.all([
    db
      .select(sessionColumns)
      .from(schema.tryoutSessions)
      .innerJoin(schema.users, eq(schema.tryoutSessions.userId, schema.users.id))
      .where(eq(schema.tryoutSessions.tryoutId, tryoutId))
      .orderBy(desc(schema.tryoutSessions.createdAt)),
    db
      .select({
        status: schema.tryoutSessions.status,
        count: sql<number>`count(${schema.tryoutSessions.id})`,
      })
      .from(schema.tryoutSessions)
      .where(eq(schema.tryoutSessions.tryoutId, tryoutId))
      .groupBy(schema.tryoutSessions.status),
    db
      .select(sessionColumns)
      .from(schema.tryoutSessions)
      .innerJoin(schema.users, eq(schema.tryoutSessions.userId, schema.users.id))
      .where(
        and(
          eq(schema.tryoutSessions.tryoutId, tryoutId),
          eq(schema.tryoutSessions.status, "graded"),
        ),
      )
      .orderBy(
        desc(schema.tryoutSessions.totalScore),
        desc(schema.tryoutSessions.totalSectionsStarted),
        desc(schema.tryoutSessions.totalCorrect),
        asc(schema.tryoutSessions.durationUsedSeconds),
        asc(schema.tryoutSessions.submittedAt),
      ),
  ])

  let sessions = sessionRows.map<TryoutMetricSessionRow>((row) => normalizeSessionRow(row))

  const statusCounts: Record<TryoutSessionStatus, number> = {
    pending: 0,
    in_progress: 0,
    submitted: 0,
    grading: 0,
    graded: 0,
    cancelled: 0,
  }

  for (const row of statusRows) {
    statusCounts[row.status as TryoutSessionStatus] = Number(row.count)
  }

  let leaderboardBase = leaderboardRows.map<AdminTryoutLeaderboardRow>((row, index) => ({
    ...normalizeSessionRow(row),
    rank: index + 1,
    sections: [],
  }))

  if (tryout.scoringMethod === "irt_3pl") {
    const irtScoreMap = await getIrtSessionScoreMap(leaderboardBase.map((row) => row.sessionId))

    sessions = sessions.map((row) => {
      const irtScore = irtScoreMap.get(row.sessionId)

      if (row.status !== "graded" || irtScore === undefined) {
        return row
      }

      return {
        ...row,
        totalScore: irtScore,
        totalMaxScore: IRT_SCORE_MAX,
      }
    })

    leaderboardBase = leaderboardBase
      .map((row) => ({
        ...row,
        totalScore: irtScoreMap.get(row.sessionId) ?? row.totalScore,
        totalMaxScore: IRT_SCORE_MAX,
      }))
      .sort(
        (left, right) =>
          right.totalScore - left.totalScore ||
          right.totalSectionsStarted - left.totalSectionsStarted ||
          right.totalCorrect - left.totalCorrect ||
          left.durationUsedSeconds - right.durationUsedSeconds ||
          (new Date(left.submittedAt ?? 0).getTime() -
            new Date(right.submittedAt ?? 0).getTime()),
      )
      .map((row, index) => ({
        ...row,
        rank: index + 1,
      }))
  }

  const metrics = getInsightMetrics(sessions, leaderboardBase)
  const scoreBuckets = getScoreBuckets(leaderboardBase, tryout.scoringMethod)

  if (leaderboardBase.length === 0) {
    return {
      tryout,
      sessions,
      leaderboard: leaderboardBase,
      statusCounts,
      scoreBuckets,
      sectionAnalytics: [],
      metrics,
    }
  }

  const leaderboardSessionIds = leaderboardBase.map((row) => row.sessionId)

  const sectionRows = await db
    .select({
      sessionId: schema.tryoutSectionSessions.tryoutSessionId,
      sectionSessionId: schema.tryoutSectionSessions.id,
      sectionId: schema.tryoutSections.id,
      sectionTitle: schema.tryoutSections.title,
      subjectName: schema.subjects.name,
      orderIndex: schema.tryoutSections.orderIndex,
      durationMinutes: schema.tryoutSectionSessions.durationMinutes,
      totalQuestions: schema.tryoutSectionSessions.totalQuestions,
      correctCount: schema.tryoutSectionSessions.correctCount,
      wrongCount: schema.tryoutSectionSessions.wrongCount,
      unansweredCount: schema.tryoutSectionSessions.unansweredCount,
      score: schema.tryoutSectionSessions.score,
      maxScore: sql<string>`coalesce(sum(${schema.tryoutSessionQuestions.points}), 0)`,
      startedAt: schema.tryoutSectionSessions.startedAt,
      submittedAt: schema.tryoutSectionSessions.submittedAt,
    })
    .from(schema.tryoutSectionSessions)
    .innerJoin(
      schema.tryoutSections,
      eq(schema.tryoutSectionSessions.tryoutSectionId, schema.tryoutSections.id),
    )
    .innerJoin(schema.subjects, eq(schema.tryoutSections.subjectId, schema.subjects.id))
    .leftJoin(
      schema.tryoutSessionQuestions,
      eq(
        schema.tryoutSectionSessions.id,
        schema.tryoutSessionQuestions.tryoutSectionSessionId,
      ),
    )
    .where(inArray(schema.tryoutSectionSessions.tryoutSessionId, leaderboardSessionIds))
    .groupBy(
      schema.tryoutSectionSessions.tryoutSessionId,
      schema.tryoutSectionSessions.id,
      schema.tryoutSections.id,
      schema.tryoutSections.title,
      schema.subjects.name,
      schema.tryoutSections.orderIndex,
      schema.tryoutSectionSessions.durationMinutes,
      schema.tryoutSectionSessions.totalQuestions,
      schema.tryoutSectionSessions.correctCount,
      schema.tryoutSectionSessions.wrongCount,
      schema.tryoutSectionSessions.unansweredCount,
      schema.tryoutSectionSessions.score,
      schema.tryoutSectionSessions.startedAt,
      schema.tryoutSectionSessions.submittedAt,
    )
    .orderBy(schema.tryoutSectionSessions.tryoutSessionId, asc(schema.tryoutSections.orderIndex))

  const sectionsBySession = new Map<number, AdminTryoutLeaderboardSectionRow[]>()
  const sectionAggregation = new Map<number, SectionAnalyticsAccumulator>()
  const irtSectionScoreMap =
    tryout.scoringMethod === "irt_3pl"
      ? await getIrtSectionScoreMapForSessions(leaderboardSessionIds)
      : new Map<number, number>()

  for (const row of sectionRows) {
    const section = normalizeLeaderboardSectionRow(row, tryout.scoringMethod, irtSectionScoreMap)
    const current = sectionsBySession.get(section.sessionId) ?? []
    current.push(section)
    sectionsBySession.set(section.sessionId, current)

    const aggregate = sectionAggregation.get(section.sectionId) ?? {
      sectionId: section.sectionId,
      sectionTitle: section.sectionTitle,
      subjectName: section.subjectName,
      orderIndex: section.orderIndex,
      scores: [] as number[],
      percentages: [] as number[],
      correctCounts: [] as number[],
      wrongCounts: [] as number[],
      unansweredCounts: [] as number[],
      durationSeconds: [] as number[],
    }

    aggregate.scores.push(section.score)
    aggregate.percentages.push(getPercentage(section.score, section.maxScore))
    aggregate.correctCounts.push(section.correctCount)
    aggregate.wrongCounts.push(section.wrongCount)
    aggregate.unansweredCounts.push(section.unansweredCount)
    aggregate.durationSeconds.push(section.durationUsedSeconds)
    sectionAggregation.set(section.sectionId, aggregate)
  }

  const sectionAnalytics = Array.from(sectionAggregation.values())
    .map<AdminTryoutSectionAnalyticsRow>((section) => ({
      sectionId: section.sectionId,
      sectionTitle: section.sectionTitle,
      subjectName: section.subjectName,
      orderIndex: section.orderIndex,
      sessionCount: section.scores.length,
      averageScore: getAverage(section.scores),
      medianScore: getMedian(section.scores),
      averagePercentage: getAverage(section.percentages),
      averageCorrect: getAverage(section.correctCounts),
      averageWrong: getAverage(section.wrongCounts),
      averageUnanswered: getAverage(section.unansweredCounts),
      averageDurationSeconds: getAverage(section.durationSeconds),
      highestScore: Math.max(...section.scores),
      lowestScore: Math.min(...section.scores),
    }))
    .sort((left, right) => left.orderIndex - right.orderIndex)

  return {
    tryout,
    sessions,
    leaderboard: leaderboardBase.map((row) => ({
      ...row,
      sections: sectionsBySession.get(row.sessionId) ?? [],
    })),
    statusCounts,
    scoreBuckets,
    sectionAnalytics,
    metrics,
  }
}

function normalizeSessionRow(row: {
  sessionId: number
  userId: number
  userName: string
  userAvatarUrl: string | null
  status: TryoutSessionStatus
  totalQuestions: number
  totalCorrect: number
  totalWrong: number
  totalUnanswered: number
  totalScore: string | number
  totalMaxScore: string | number
  totalSectionsStarted: number
  durationUsedSeconds: number
  autoSubmitted: boolean
  startedAt: Date
  submittedAt: Date | null
  gradedAt: Date | null
}): TryoutMetricSessionRow {
  return {
    sessionId: row.sessionId,
    userId: row.userId,
    userName: row.userName,
    userAvatarUrl: row.userAvatarUrl ?? null,
    status: row.status,
    totalQuestions: row.totalQuestions,
    totalCorrect: row.totalCorrect,
    totalWrong: row.totalWrong,
    totalUnanswered: row.totalUnanswered,
    totalScore: Number(row.totalScore ?? 0),
    totalMaxScore: Number(row.totalMaxScore ?? 0),
    totalSectionsStarted: row.totalSectionsStarted,
    durationUsedSeconds: row.durationUsedSeconds,
    autoSubmitted: row.autoSubmitted,
    startedAt: row.startedAt.toISOString(),
    submittedAt: row.submittedAt?.toISOString() ?? null,
    gradedAt: row.gradedAt?.toISOString() ?? null,
  }
}

function normalizeLeaderboardSectionRow(
  row: {
    sessionId: number
    sectionSessionId: number
    sectionId: number
    sectionTitle: string
    subjectName: string
    orderIndex: number
    durationMinutes: number
    totalQuestions: number
    correctCount: number
    wrongCount: number
    unansweredCount: number
    score: string | number
    maxScore: string | number
    startedAt: Date | null
    submittedAt: Date | null
  },
  scoringMethod: string,
  irtSectionScoreMap: Map<number, number>,
): AdminTryoutLeaderboardSectionRow {
  const irtScore = irtSectionScoreMap.get(row.sectionSessionId)

  return {
    sessionId: row.sessionId,
    sectionSessionId: row.sectionSessionId,
    sectionId: row.sectionId,
    sectionTitle: row.sectionTitle,
    subjectName: row.subjectName,
    orderIndex: row.orderIndex,
    durationMinutes: row.durationMinutes,
    totalQuestions: row.totalQuestions,
    correctCount: row.correctCount,
    wrongCount: row.wrongCount,
    unansweredCount: row.unansweredCount,
    score: scoringMethod === "irt_3pl" ? (irtScore ?? Number(row.score ?? 0)) : Number(row.score ?? 0),
    maxScore: scoringMethod === "irt_3pl" ? IRT_SCORE_MAX : Number(row.maxScore ?? 0),
    durationUsedSeconds: getDurationSeconds(row.startedAt, row.submittedAt),
    startedAt: row.startedAt?.toISOString() ?? null,
    submittedAt: row.submittedAt?.toISOString() ?? null,
  }
}

type SectionAnalyticsAccumulator = {
  sectionId: number
  sectionTitle: string
  subjectName: string
  orderIndex: number
  scores: number[]
  percentages: number[]
  correctCounts: number[]
  wrongCounts: number[]
  unansweredCounts: number[]
  durationSeconds: number[]
}

function getInsightMetrics(
  sessions: TryoutMetricSessionRow[],
  leaderboard: AdminTryoutLeaderboardRow[],
): AdminTryoutInsightMetrics {
  const gradedSessions = leaderboard.length
  const scores = leaderboard.map((row) => row.totalScore)
  const totalCorrect = leaderboard.reduce((sum, row) => sum + row.totalCorrect, 0)
  const totalWrong = leaderboard.reduce((sum, row) => sum + row.totalWrong, 0)
  const totalDuration = leaderboard.reduce((sum, row) => sum + row.durationUsedSeconds, 0)
  const totalMaxScore = leaderboard.reduce((sum, row) => sum + row.totalMaxScore, 0)

  return {
    totalSessions: sessions.length,
    gradedSessions,
    completionRate: sessions.length > 0 ? (gradedSessions / sessions.length) * 100 : 0,
    averageScore: getAverage(scores),
    medianScore: getMedian(scores),
    topScore: scores.length > 0 ? Math.max(...scores) : 0,
    bottomScore: scores.length > 0 ? Math.min(...scores) : 0,
    averageDurationSeconds: gradedSessions > 0 ? totalDuration / gradedSessions : 0,
    averageAccuracy:
      totalCorrect + totalWrong > 0 ? (totalCorrect / (totalCorrect + totalWrong)) * 100 : 0,
    averageMaxScore: gradedSessions > 0 ? totalMaxScore / gradedSessions : 0,
  }
}

function getScoreBuckets(
  leaderboard: AdminTryoutLeaderboardRow[],
  scoringMethod: string,
): AdminTryoutScoreBucket[] {
  const buckets =
    scoringMethod === "irt_3pl"
      ? ([
          { label: "200 - 400", min: 200, max: 400, count: 0 },
          { label: "401 - 500", min: 401, max: 500, count: 0 },
          { label: "501 - 600", min: 501, max: 600, count: 0 },
          { label: "601 - 700", min: 601, max: 700, count: 0 },
          { label: "701 - 1000", min: 701, max: 1000, count: 0 },
        ] satisfies AdminTryoutScoreBucket[])
      : ([
          { label: "0 - 20", min: 0, max: 20, count: 0 },
          { label: "21 - 40", min: 21, max: 40, count: 0 },
          { label: "41 - 60", min: 41, max: 60, count: 0 },
          { label: "61 - 80", min: 61, max: 80, count: 0 },
          { label: "81 - 100", min: 81, max: 100, count: 0 },
        ] satisfies AdminTryoutScoreBucket[])

  for (const row of leaderboard) {
    const value =
      scoringMethod === "irt_3pl" ? row.totalScore : getPercentage(row.totalScore, row.totalMaxScore)
    const bucket =
      buckets.find((item) => value >= item.min && value <= item.max) ?? buckets[0]
    bucket.count += 1
  }

  return buckets
}

function getAverage(values: number[]) {
  if (values.length === 0) {
    return 0
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function getMedian(values: number[]) {
  if (values.length === 0) {
    return 0
  }

  const sorted = [...values].sort((left, right) => left - right)
  const middle = Math.floor(sorted.length / 2)

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2
  }

  return sorted[middle]
}

function getPercentage(score: number, maxScore: number) {
  if (maxScore <= 0) {
    return 0
  }

  return (score / maxScore) * 100
}

function getDurationSeconds(startedAt: Date | null, submittedAt: Date | null) {
  if (!startedAt || !submittedAt) {
    return 0
  }

  return Math.max(0, Math.floor((submittedAt.getTime() - startedAt.getTime()) / 1000))
}
