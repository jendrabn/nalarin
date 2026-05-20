"use server"

import "server-only"

import { asc, eq, sql } from "drizzle-orm"

import { db, schema } from "@/db"

import type { PracticeMode } from "@/features/practices/types"

import { getPracticeById, type PracticeDetails } from "./index"

export type PracticeSessionInsightStatus =
  | "pending"
  | "in_progress"
  | "submitted"
  | "grading"
  | "graded"
  | "cancelled"

export type PracticeInsightSessionRow = {
  sessionId: number
  userId: number
  userName: string
  mode: PracticeMode
  status: PracticeSessionInsightStatus
  attemptNumber: number
  totalQuestions: number
  totalCorrect: number
  totalWrong: number
  totalUnanswered: number
  totalScore: number
  totalMaxScore: number
  durationSeconds: number
  startedAt: string
  submittedAt: string | null
  gradedAt: string | null
  lastSavedAt: string | null
}

export type PracticeInsightParticipantRow = {
  rank: number
  userId: number
  userName: string
  sessionCount: number
  gradedSessionCount: number
  bestScore: number
  averageScore: number
  medianScore: number
  averageAccuracy: number
  totalCorrect: number
  totalWrong: number
  totalUnanswered: number
  averageDurationSeconds: number
  latestStatus: PracticeSessionInsightStatus
  latestStartedAt: string
  attempts: PracticeInsightSessionRow[]
}

export type PracticeScoreBucket = {
  label: string
  min: number
  max: number
  count: number
}

export type PracticeAttemptBucket = {
  label: string
  min: number
  max: number | null
  count: number
}

export type PracticeInsightMetrics = {
  totalSessions: number
  uniqueParticipants: number
  gradedSessions: number
  completionRate: number
  averageScore: number
  medianScore: number
  topScore: number
  bottomScore: number
  averageDurationSeconds: number
  averageAccuracy: number
  averageMaxScore: number
  averageAttemptsPerParticipant: number
}

export type PracticeInsightData = {
  practice: PracticeDetails
  sessions: PracticeInsightSessionRow[]
  participants: PracticeInsightParticipantRow[]
  statusCounts: Record<PracticeSessionInsightStatus, number>
  scoreBuckets: PracticeScoreBucket[]
  attemptBuckets: PracticeAttemptBucket[]
  metrics: PracticeInsightMetrics
}

export async function getAdminPracticeInsightData(
  practiceId: number,
): Promise<PracticeInsightData | null> {
  const practice = await getPracticeById(practiceId)

  if (!practice) {
    return null
  }

  const [sessionRows, statusRows] = await Promise.all([
    db
      .select({
        sessionId: schema.practiceSessions.id,
        userId: schema.practiceSessions.userId,
        userName: schema.users.name,
        mode: schema.practiceSessions.mode,
        status: schema.practiceSessions.status,
        totalQuestions: schema.practiceSessions.totalQuestions,
        totalCorrect: schema.practiceSessions.totalCorrect,
        totalWrong: schema.practiceSessions.totalWrong,
        totalUnanswered: schema.practiceSessions.totalUnanswered,
        totalScore: schema.practiceSessions.totalScore,
        totalMaxScore: schema.practiceSessions.totalMaxScore,
        durationMinutes: schema.practiceSessions.durationMinutes,
        startedAt: schema.practiceSessions.startedAt,
        submittedAt: schema.practiceSessions.submittedAt,
        gradedAt: schema.practiceSessions.gradedAt,
        lastSavedAt: schema.practiceSessions.lastSavedAt,
      })
      .from(schema.practiceSessions)
      .innerJoin(schema.users, eq(schema.practiceSessions.userId, schema.users.id))
      .where(eq(schema.practiceSessions.practiceId, practiceId))
      .orderBy(asc(schema.practiceSessions.userId), asc(schema.practiceSessions.startedAt), asc(schema.practiceSessions.id)),
    db
      .select({
        status: schema.practiceSessions.status,
        count: sql<number>`count(${schema.practiceSessions.id})`,
      })
      .from(schema.practiceSessions)
      .where(eq(schema.practiceSessions.practiceId, practiceId))
      .groupBy(schema.practiceSessions.status),
  ])

  const sessions = sessionRows.map<PracticeInsightSessionRow>((row, index, rows) => {
    const previous = rows
      .slice(0, index)
      .filter((item) => item.userId === row.userId)
      .length

    return {
      sessionId: row.sessionId,
      userId: row.userId,
      userName: row.userName,
      mode: row.mode as PracticeMode,
      status: row.status as PracticeSessionInsightStatus,
      attemptNumber: previous + 1,
      totalQuestions: row.totalQuestions,
      totalCorrect: row.totalCorrect,
      totalWrong: row.totalWrong,
      totalUnanswered: row.totalUnanswered,
      totalScore: Number(row.totalScore ?? 0),
      totalMaxScore: Number(row.totalMaxScore ?? 0),
      durationSeconds: getDurationSeconds(row.startedAt, row.submittedAt, row.gradedAt, row.lastSavedAt),
      startedAt: row.startedAt.toISOString(),
      submittedAt: row.submittedAt?.toISOString() ?? null,
      gradedAt: row.gradedAt?.toISOString() ?? null,
      lastSavedAt: row.lastSavedAt?.toISOString() ?? null,
    }
  })

  const statusCounts: Record<PracticeSessionInsightStatus, number> = {
    pending: 0,
    in_progress: 0,
    submitted: 0,
    grading: 0,
    graded: 0,
    cancelled: 0,
  }

  for (const row of statusRows) {
    statusCounts[row.status as PracticeSessionInsightStatus] = Number(row.count)
  }

  const sessionsByUser = new Map<number, PracticeInsightSessionRow[]>()

  for (const session of sessions) {
    const current = sessionsByUser.get(session.userId) ?? []
    current.push(session)
    sessionsByUser.set(session.userId, current)
  }

  const participants = Array.from(sessionsByUser.values())
    .map<PracticeInsightParticipantRow>((attempts) => {
      const gradedAttempts = attempts.filter((item) => item.status === "graded")
      const scores = gradedAttempts.map((item) => item.totalScore)
      const accuracies = gradedAttempts.map((item) =>
        item.totalMaxScore > 0 ? (item.totalScore / item.totalMaxScore) * 100 : 0,
      )
      const durations = attempts.map((item) => item.durationSeconds)
      const totalCorrect = attempts.reduce((sum, item) => sum + item.totalCorrect, 0)
      const totalWrong = attempts.reduce((sum, item) => sum + item.totalWrong, 0)
      const totalUnanswered = attempts.reduce((sum, item) => sum + item.totalUnanswered, 0)
      const averageScore = scores.length > 0 ? getAverage(scores) : 0
      const medianScore = scores.length > 0 ? getMedian(scores) : 0
      const bestScore = scores.length > 0 ? Math.max(...scores) : 0
      const averageAccuracy = accuracies.length > 0 ? getAverage(accuracies) : 0
      const averageDurationSeconds = durations.length > 0 ? getAverage(durations) : 0
      const latest = attempts[attempts.length - 1]

      return {
        rank: 0,
        userId: attempts[0]?.userId ?? 0,
        userName: attempts[0]?.userName ?? "-",
        sessionCount: attempts.length,
        gradedSessionCount: gradedAttempts.length,
        bestScore,
        averageScore,
        medianScore,
        averageAccuracy,
        totalCorrect,
        totalWrong,
        totalUnanswered,
        averageDurationSeconds,
        latestStatus: latest?.status ?? "pending",
        latestStartedAt: latest?.startedAt ?? "",
        attempts: attempts.slice().sort((left, right) => right.attemptNumber - left.attemptNumber),
      }
    })
    .sort(
      (left, right) =>
        right.bestScore - left.bestScore ||
        right.averageScore - left.averageScore ||
        right.gradedSessionCount - left.gradedSessionCount ||
        right.sessionCount - left.sessionCount ||
        right.latestStartedAt.localeCompare(left.latestStartedAt) ||
        left.userName.localeCompare(right.userName),
    )
    .map((participant, index) => ({
      ...participant,
      rank: index + 1,
    }))

  const gradedSessions = sessions.filter((session) => session.status === "graded")
  const scoreBuckets = buildScoreBuckets(gradedSessions)
  const attemptBuckets = buildAttemptBuckets(participants)
  const metrics = getInsightMetrics(sessions, participants, gradedSessions)

  return {
    practice,
    sessions,
    participants,
    statusCounts,
    scoreBuckets,
    attemptBuckets,
    metrics,
  }
}

function getDurationSeconds(
  startedAt: Date,
  submittedAt: Date | null,
  gradedAt: Date | null,
  lastSavedAt: Date | null,
) {
  const endTime = submittedAt ?? gradedAt ?? lastSavedAt ?? new Date()

  return Math.max(0, Math.floor((endTime.getTime() - startedAt.getTime()) / 1000))
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

function buildScoreBuckets(sessions: PracticeInsightSessionRow[]): PracticeScoreBucket[] {
  const buckets = [
    { label: "0 - 20", min: 0, max: 20, count: 0 },
    { label: "21 - 40", min: 21, max: 40, count: 0 },
    { label: "41 - 60", min: 41, max: 60, count: 0 },
    { label: "61 - 80", min: 61, max: 80, count: 0 },
    { label: "81 - 100", min: 81, max: 100, count: 0 },
  ] satisfies PracticeScoreBucket[]

  for (const session of sessions) {
    const percentage = getPercentage(session.totalScore, session.totalMaxScore)
    const bucket =
      buckets.find((item) => percentage >= item.min && percentage <= item.max) ?? buckets[0]
    bucket.count += 1
  }

  return buckets
}

function buildAttemptBuckets(participants: PracticeInsightParticipantRow[]): PracticeAttemptBucket[] {
  const buckets = [
    { label: "1", min: 1, max: 1, count: 0 },
    { label: "2", min: 2, max: 2, count: 0 },
    { label: "3", min: 3, max: 3, count: 0 },
    { label: "4", min: 4, max: 4, count: 0 },
    { label: "5+", min: 5, max: null, count: 0 },
  ] satisfies PracticeAttemptBucket[]

  for (const participant of participants) {
    const attemptCount = participant.sessionCount
    const bucket =
      buckets.find((item) =>
        item.max === null ? attemptCount >= item.min : attemptCount >= item.min && attemptCount <= item.max,
      ) ?? buckets[0]
    bucket.count += 1
  }

  return buckets
}

function getInsightMetrics(
  sessions: PracticeInsightSessionRow[],
  participants: PracticeInsightParticipantRow[],
  gradedSessions: PracticeInsightSessionRow[],
): PracticeInsightMetrics {
  const scores = gradedSessions.map((session) => session.totalScore)
  const totalDuration = gradedSessions.reduce((sum, session) => sum + session.durationSeconds, 0)
  const totalCorrect = gradedSessions.reduce((sum, session) => sum + session.totalCorrect, 0)
  const totalWrong = gradedSessions.reduce((sum, session) => sum + session.totalWrong, 0)
  const totalMaxScore = gradedSessions.reduce((sum, session) => sum + session.totalMaxScore, 0)
  const averageAttemptsPerParticipant =
    participants.length > 0
      ? sessions.length / participants.length
      : 0

  return {
    totalSessions: sessions.length,
    uniqueParticipants: participants.length,
    gradedSessions: gradedSessions.length,
    completionRate: sessions.length > 0 ? (gradedSessions.length / sessions.length) * 100 : 0,
    averageScore: getAverage(scores),
    medianScore: getMedian(scores),
    topScore: scores.length > 0 ? Math.max(...scores) : 0,
    bottomScore: scores.length > 0 ? Math.min(...scores) : 0,
    averageDurationSeconds: gradedSessions.length > 0 ? totalDuration / gradedSessions.length : 0,
    averageAccuracy:
      totalCorrect + totalWrong > 0 ? (totalCorrect / (totalCorrect + totalWrong)) * 100 : 0,
    averageMaxScore: gradedSessions.length > 0 ? totalMaxScore / gradedSessions.length : 0,
    averageAttemptsPerParticipant,
  }
}
