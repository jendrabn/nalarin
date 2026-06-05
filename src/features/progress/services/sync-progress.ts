import "server-only"

import { and, eq, sql } from "drizzle-orm"

import { db, schema } from "@/db"

import type { ProgressTopicSnapshot } from "../types"

type ScopeKey = `${number}:${number}`

type AggregateBucket = {
  userId: number
  examTypeId: number
  subjectId: number
  totalQuestionsAnswered: number
  totalCorrect: number
  totalWrong: number
  totalMaxScoreAggregate: number
  totalScoreAggregate: number
}

type TopicBucket = {
  topic_id: number
  topic_name: string
  correct: number
  wrong: number
}

export async function syncUserProgressSnapshots(userId: number) {
  const [practiceRows, tryoutSectionRows, practiceTopicRows, tryoutTopicRows] =
    await Promise.all([
      getPracticeAggregateRows(userId),
      getTryoutSectionAggregateRows(userId),
      getPracticeTopicRows(userId),
      getTryoutTopicRows(userId),
    ])

  const aggregateMap = new Map<ScopeKey, AggregateBucket>()

  for (const row of practiceRows) {
    addAggregate(aggregateMap, {
      userId,
      examTypeId: row.examTypeId,
      subjectId: row.subjectId,
      totalCorrect: row.totalCorrect,
      totalWrong: row.totalWrong,
      totalMaxScoreAggregate: Number(row.totalMaxScoreAggregate ?? 0),
      totalScoreAggregate: Number(row.totalScoreAggregate ?? 0),
    })
  }

  for (const row of tryoutSectionRows) {
    const isIrtScoring = row.scoringMethod === "irt_3pl"

    addAggregate(aggregateMap, {
      userId,
      examTypeId: row.examTypeId,
      subjectId: row.subjectId,
      totalCorrect: row.totalCorrect,
      totalWrong: row.totalWrong,
      totalMaxScoreAggregate: isIrtScoring ? 0 : Number(row.totalMaxScoreAggregate ?? 0),
      totalScoreAggregate: isIrtScoring
        ? 0
        : Number(row.totalScoreAggregate ?? 0),
    })
  }

  if (aggregateMap.size === 0) {
    return
  }

  const topicMap = buildTopicMap([...practiceTopicRows, ...tryoutTopicRows])
  const snapshotDate = new Date().toISOString().slice(0, 10)
  const now = new Date()

  const values = Array.from(aggregateMap.values()).map((bucket) => {
    const topics = topicMap.get(getScopeKey(bucket.examTypeId, bucket.subjectId)) ?? []
    const strongestTopics = getStrongestTopics(topics)
    const weakestTopics = getWeakestTopics(topics)
    const averageScore =
      bucket.totalMaxScoreAggregate > 0
        ? (bucket.totalScoreAggregate / bucket.totalMaxScoreAggregate) * 100
        : null

    return {
      userId: bucket.userId,
      examTypeId: bucket.examTypeId,
      subjectId: bucket.subjectId,
      totalQuestionsAnswered: bucket.totalQuestionsAnswered,
      totalCorrect: bucket.totalCorrect,
      totalWrong: bucket.totalWrong,
      totalMaxScoreAggregate: bucket.totalMaxScoreAggregate.toFixed(2),
      totalScoreAggregate: bucket.totalScoreAggregate.toFixed(2),
      averageScore: averageScore === null ? null : averageScore.toFixed(2),
      strongestTopics,
      weakestTopics,
      snapshotDate,
      updatedAt: now,
    }
  })

  await db
    .insert(schema.userProgressSnapshots)
    .values(values)
    .onDuplicateKeyUpdate({
      set: {
        totalQuestionsAnswered: sql`values(${schema.userProgressSnapshots.totalQuestionsAnswered})`,
        totalCorrect: sql`values(${schema.userProgressSnapshots.totalCorrect})`,
        totalWrong: sql`values(${schema.userProgressSnapshots.totalWrong})`,
        totalMaxScoreAggregate: sql`values(${schema.userProgressSnapshots.totalMaxScoreAggregate})`,
        totalScoreAggregate: sql`values(${schema.userProgressSnapshots.totalScoreAggregate})`,
        averageScore: sql`values(${schema.userProgressSnapshots.averageScore})`,
        strongestTopics: sql`values(${schema.userProgressSnapshots.strongestTopics})`,
        weakestTopics: sql`values(${schema.userProgressSnapshots.weakestTopics})`,
        snapshotDate: sql`values(${schema.userProgressSnapshots.snapshotDate})`,
        updatedAt: now,
      },
    })
}

async function getPracticeAggregateRows(userId: number) {
  return db
    .select({
      examTypeId: schema.practices.examTypeId,
      subjectId: schema.practices.subjectId,
      totalCorrect: schema.practiceSessions.totalCorrect,
      totalWrong: schema.practiceSessions.totalWrong,
      totalScoreAggregate: schema.practiceSessions.totalScore,
      totalMaxScoreAggregate: schema.practiceSessions.totalMaxScore,
    })
    .from(schema.practiceSessions)
    .innerJoin(schema.practices, eq(schema.practiceSessions.practiceId, schema.practices.id))
    .where(
      and(
        eq(schema.practiceSessions.userId, userId),
        eq(schema.practiceSessions.status, "graded"),
      ),
    )
}

async function getTryoutSectionAggregateRows(userId: number) {
  return db
    .select({
      examTypeId: schema.tryouts.examTypeId,
      tryoutSessionId: schema.tryoutSectionSessions.tryoutSessionId,
      sectionSessionId: schema.tryoutSectionSessions.id,
      subjectId: schema.tryoutSections.subjectId,
      scoringMethod: schema.tryouts.scoringMethod,
      totalCorrect: schema.tryoutSectionSessions.correctCount,
      totalWrong: schema.tryoutSectionSessions.wrongCount,
      totalScoreAggregate: schema.tryoutSectionSessions.score,
      totalMaxScoreAggregate: sql<string>`coalesce(sum(${schema.tryoutSessionQuestions.points}), 0)`,
    })
    .from(schema.tryoutSectionSessions)
    .innerJoin(
      schema.tryoutSessions,
      eq(schema.tryoutSectionSessions.tryoutSessionId, schema.tryoutSessions.id),
    )
    .innerJoin(schema.tryouts, eq(schema.tryoutSessions.tryoutId, schema.tryouts.id))
    .innerJoin(
      schema.tryoutSections,
      eq(schema.tryoutSectionSessions.tryoutSectionId, schema.tryoutSections.id),
    )
    .leftJoin(
      schema.tryoutSessionQuestions,
      eq(schema.tryoutSectionSessions.id, schema.tryoutSessionQuestions.tryoutSectionSessionId),
    )
    .where(
      and(
        eq(schema.tryoutSessions.userId, userId),
        eq(schema.tryoutSessions.status, "graded"),
        eq(schema.tryoutSectionSessions.status, "graded"),
      ),
    )
    .groupBy(
      schema.tryouts.examTypeId,
      schema.tryoutSectionSessions.tryoutSessionId,
      schema.tryoutSections.subjectId,
      schema.tryoutSectionSessions.id,
      schema.tryouts.scoringMethod,
      schema.tryoutSectionSessions.correctCount,
      schema.tryoutSectionSessions.wrongCount,
      schema.tryoutSectionSessions.score,
    )
}

async function getPracticeTopicRows(userId: number) {
  return db
    .select({
      examTypeId: schema.practices.examTypeId,
      subjectId: schema.questions.subjectId,
      topicId: schema.questions.topicId,
      topicName: schema.topics.name,
      correct: sql<number>`sum(case when ${schema.practiceAnswers.isCorrect} = true then 1 else 0 end)`,
      wrong: sql<number>`sum(case when ${schema.practiceAnswers.isCorrect} = false then 1 else 0 end)`,
    })
    .from(schema.practiceAnswers)
    .innerJoin(
      schema.practiceSessions,
      eq(schema.practiceAnswers.practiceSessionId, schema.practiceSessions.id),
    )
    .innerJoin(schema.practices, eq(schema.practiceSessions.practiceId, schema.practices.id))
    .innerJoin(
      schema.practiceSessionQuestions,
      eq(schema.practiceAnswers.practiceSessionQuestionId, schema.practiceSessionQuestions.id),
    )
    .innerJoin(schema.questions, eq(schema.practiceSessionQuestions.questionId, schema.questions.id))
    .innerJoin(schema.topics, eq(schema.questions.topicId, schema.topics.id))
    .where(
      and(
        eq(schema.practiceSessions.userId, userId),
        eq(schema.practiceSessions.status, "graded"),
      ),
    )
    .groupBy(schema.practices.examTypeId, schema.questions.subjectId, schema.questions.topicId, schema.topics.name)
}

async function getTryoutTopicRows(userId: number) {
  return db
    .select({
      examTypeId: schema.tryouts.examTypeId,
      subjectId: schema.questions.subjectId,
      topicId: schema.questions.topicId,
      topicName: schema.topics.name,
      correct: sql<number>`sum(case when ${schema.tryoutAnswers.isCorrect} = true then 1 else 0 end)`,
      wrong: sql<number>`sum(case when ${schema.tryoutAnswers.isCorrect} = false then 1 else 0 end)`,
    })
    .from(schema.tryoutAnswers)
    .innerJoin(
      schema.tryoutSessions,
      eq(schema.tryoutAnswers.tryoutSessionId, schema.tryoutSessions.id),
    )
    .innerJoin(schema.tryouts, eq(schema.tryoutSessions.tryoutId, schema.tryouts.id))
    .innerJoin(
      schema.tryoutSessionQuestions,
      eq(schema.tryoutAnswers.tryoutSessionQuestionId, schema.tryoutSessionQuestions.id),
    )
    .innerJoin(schema.questions, eq(schema.tryoutSessionQuestions.questionId, schema.questions.id))
    .innerJoin(schema.topics, eq(schema.questions.topicId, schema.topics.id))
    .where(
      and(
        eq(schema.tryoutSessions.userId, userId),
        eq(schema.tryoutSessions.status, "graded"),
      ),
    )
    .groupBy(schema.tryouts.examTypeId, schema.questions.subjectId, schema.questions.topicId, schema.topics.name)
}

function addAggregate(
  aggregateMap: Map<ScopeKey, AggregateBucket>,
  input: {
    userId: number
    examTypeId: number
    subjectId: number
    totalCorrect: number
    totalWrong: number
    totalMaxScoreAggregate: number
    totalScoreAggregate: number
  },
) {
  for (const scope of [
    { examTypeId: 0, subjectId: 0 },
    { examTypeId: input.examTypeId, subjectId: 0 },
    { examTypeId: input.examTypeId, subjectId: input.subjectId },
  ]) {
    const key = getScopeKey(scope.examTypeId, scope.subjectId)
    const bucket =
      aggregateMap.get(key) ??
      ({
        userId: input.userId,
        examTypeId: scope.examTypeId,
        subjectId: scope.subjectId,
        totalQuestionsAnswered: 0,
        totalCorrect: 0,
        totalWrong: 0,
        totalMaxScoreAggregate: 0,
        totalScoreAggregate: 0,
      } satisfies AggregateBucket)

    bucket.totalCorrect += input.totalCorrect
    bucket.totalWrong += input.totalWrong
    bucket.totalQuestionsAnswered += input.totalCorrect + input.totalWrong
    bucket.totalMaxScoreAggregate += input.totalMaxScoreAggregate
    bucket.totalScoreAggregate += input.totalScoreAggregate
    aggregateMap.set(key, bucket)
  }
}

function buildTopicMap(
  rows: Array<{
    examTypeId: number
    subjectId: number
    topicId: number | null
    topicName: string
    correct: number | string | null
    wrong: number | string | null
  }>,
) {
  const topicMap = new Map<ScopeKey, Map<number, TopicBucket>>()

  for (const row of rows) {
    if (!row.topicId) {
      continue
    }

    for (const scope of [
      { examTypeId: 0, subjectId: 0 },
      { examTypeId: row.examTypeId, subjectId: 0 },
      { examTypeId: row.examTypeId, subjectId: row.subjectId },
    ]) {
      const key = getScopeKey(scope.examTypeId, scope.subjectId)
      const scopedTopics = topicMap.get(key) ?? new Map<number, TopicBucket>()
      const topic =
        scopedTopics.get(row.topicId) ??
        ({
          topic_id: row.topicId,
          topic_name: row.topicName,
          correct: 0,
          wrong: 0,
        } satisfies TopicBucket)

      topic.correct += Number(row.correct ?? 0)
      topic.wrong += Number(row.wrong ?? 0)
      scopedTopics.set(row.topicId, topic)
      topicMap.set(key, scopedTopics)
    }
  }

  return new Map(
    Array.from(topicMap.entries()).map(([key, topics]) => [key, Array.from(topics.values())]),
  )
}

function getStrongestTopics(topics: TopicBucket[]): ProgressTopicSnapshot[] {
  return topics
    .filter((topic) => topic.correct + topic.wrong > 0)
    .map(toTopicSnapshot)
    .sort((a, b) => b.accuracy - a.accuracy || a.topic_name.localeCompare(b.topic_name))
    .slice(0, 5)
}

function getWeakestTopics(topics: TopicBucket[]): ProgressTopicSnapshot[] {
  return topics
    .filter((topic) => topic.correct + topic.wrong > 0)
    .map(toTopicSnapshot)
    .sort((a, b) => a.accuracy - b.accuracy || a.topic_name.localeCompare(b.topic_name))
    .slice(0, 5)
}

function toTopicSnapshot(topic: TopicBucket): ProgressTopicSnapshot {
  const answered = topic.correct + topic.wrong

  return {
    topic_id: topic.topic_id,
    topic_name: topic.topic_name,
    accuracy: answered > 0 ? Math.round((topic.correct / answered) * 100) : 0,
  }
}

function getScopeKey(examTypeId: number, subjectId: number): ScopeKey {
  return `${examTypeId}:${subjectId}`
}
