"use server"

import "server-only"

import { desc, eq, sql } from "drizzle-orm"

import { db, schema } from "@/db"

import type {
  PracticeStatus,
  PracticeQuestionType,
} from "../constants"
import type { ModelEnumValue } from "@/lib/model-enums"

export type PracticeRow = {
  id: number
  examTypeId: number
  examTypeName: string
  subjectId: number
  subjectName: string
  topicId: number | null
  topicName: string | null
  title: string
  slug: string
  description: string | null
  isFree: boolean
  quizDurationMinutes: number | null
  status: PracticeStatus
  publishedAt: Date | null
  createdBy: number | null
  questionCount: number
  sessionCount: number
  createdAt: Date
  updatedAt: Date
}

export type PracticeQuestionDetails = {
  id: number
  practiceId: number
  questionId: number
  orderIndex: number
  points: number | null
  questionTitle: string | null
  questionContent: string
  questionType: PracticeQuestionType
  questionStatus: PracticeStatus
  subjectId: number
  subjectName: string
  topicName: string | null
  basePoints: number
  year: number | null
}

export type PracticeDetails = PracticeRow & {
  questions: PracticeQuestionDetails[]
}

export type PracticeLookupOption = {
  id: number
  name: string
  slug: string
}

export type PracticeSubjectLookupOption = {
  id: number
  examTypeId: number
  name: string
  slug: string
}

export type PracticeTopicLookupOption = {
  id: number
  examTypeId: number
  subjectId: number
  name: string
  slug: string
}

export type PracticeQuestionLookupOption = {
  id: number
  examTypeId: number
  subjectId: number
  subjectName: string
  topicId: number | null
  topicName: string | null
  title: string | null
  content: string
  type: PracticeQuestionType
  difficulty: ModelEnumValue<"questionDifficulty">
  status: PracticeStatus
  year: number | null
  points: number
}

function selectPracticeColumns() {
  return {
    id: schema.practices.id,
    examTypeId: schema.practices.examTypeId,
    examTypeName: schema.examTypes.name,
    subjectId: schema.practices.subjectId,
    subjectName: schema.subjects.name,
    topicId: schema.practices.topicId,
    topicName: schema.topics.name,
    title: schema.practices.title,
    slug: schema.practices.slug,
    description: schema.practices.description,
    isFree: schema.practices.isFree,
    quizDurationMinutes: schema.practices.quizDurationMinutes,
    status: schema.practices.status,
    publishedAt: schema.practices.publishedAt,
    createdBy: schema.practices.createdBy,
    createdAt: schema.practices.createdAt,
    updatedAt: schema.practices.updatedAt,
  } as const
}

function normalizePracticeRow(
  row: Omit<PracticeRow, "questionCount" | "sessionCount">,
  counts: { questionCount?: number; sessionCount?: number } = {},
): PracticeRow {
  return {
    ...row,
    description: row.description ?? null,
    topicId: row.topicId ?? null,
    topicName: row.topicName ?? null,
    quizDurationMinutes: row.quizDurationMinutes ?? null,
    publishedAt: row.publishedAt ?? null,
    createdBy: row.createdBy ?? null,
    questionCount: counts.questionCount ?? 0,
    sessionCount: counts.sessionCount ?? 0,
  }
}

export async function getPractices() {
  const [rows, questionCounts, sessionCounts] = await Promise.all([
    db
      .select(selectPracticeColumns())
      .from(schema.practices)
      .innerJoin(schema.examTypes, eq(schema.practices.examTypeId, schema.examTypes.id))
      .innerJoin(schema.subjects, eq(schema.practices.subjectId, schema.subjects.id))
      .leftJoin(schema.topics, eq(schema.practices.topicId, schema.topics.id))
      .orderBy(desc(schema.practices.createdAt)),
    db
      .select({
        practiceId: schema.practiceQuestions.practiceId,
        count: sql<number>`count(${schema.practiceQuestions.id})`,
      })
      .from(schema.practiceQuestions)
      .groupBy(schema.practiceQuestions.practiceId),
    db
      .select({
        practiceId: schema.practiceSessions.practiceId,
        count: sql<number>`count(${schema.practiceSessions.id})`,
      })
      .from(schema.practiceSessions)
      .groupBy(schema.practiceSessions.practiceId),
  ])

  const questionMap = new Map(questionCounts.map((row) => [row.practiceId, Number(row.count)]))
  const sessionMap = new Map(sessionCounts.map((row) => [row.practiceId, Number(row.count)]))

  return rows.map((row) =>
    normalizePracticeRow(row, {
      questionCount: questionMap.get(row.id),
      sessionCount: sessionMap.get(row.id),
    }),
  )
}

export async function getPracticeById(id: number) {
  const rows = await db
    .select(selectPracticeColumns())
    .from(schema.practices)
    .innerJoin(schema.examTypes, eq(schema.practices.examTypeId, schema.examTypes.id))
    .innerJoin(schema.subjects, eq(schema.practices.subjectId, schema.subjects.id))
    .leftJoin(schema.topics, eq(schema.practices.topicId, schema.topics.id))
    .where(eq(schema.practices.id, id))
    .limit(1)

  const practice = rows[0]

  if (!practice) {
    return null
  }

  const [questions, sessionCountRows] = await Promise.all([
    db
      .select({
        id: schema.practiceQuestions.id,
        practiceId: schema.practiceQuestions.practiceId,
        questionId: schema.practiceQuestions.questionId,
        orderIndex: schema.practiceQuestions.orderIndex,
        points: schema.practiceQuestions.points,
        questionTitle: schema.questions.title,
        questionContent: schema.questions.content,
        questionType: schema.questions.type,
        questionStatus: schema.questions.status,
        subjectId: schema.questions.subjectId,
        subjectName: schema.subjects.name,
        topicName: schema.topics.name,
        basePoints: schema.questions.points,
        year: schema.questions.year,
      })
      .from(schema.practiceQuestions)
      .innerJoin(schema.questions, eq(schema.practiceQuestions.questionId, schema.questions.id))
      .innerJoin(schema.subjects, eq(schema.questions.subjectId, schema.subjects.id))
      .leftJoin(schema.topics, eq(schema.questions.topicId, schema.topics.id))
      .where(eq(schema.practiceQuestions.practiceId, id))
      .orderBy(schema.practiceQuestions.orderIndex),
    db
      .select({
        count: sql<number>`count(${schema.practiceSessions.id})`,
      })
      .from(schema.practiceSessions)
      .where(eq(schema.practiceSessions.practiceId, id)),
  ])

  return {
    ...normalizePracticeRow(practice, {
      questionCount: questions.length,
      sessionCount: Number(sessionCountRows[0]?.count ?? 0),
    }),
    questions: questions.map<PracticeQuestionDetails>((question) => ({
      ...question,
      points: question.points === null ? null : Number(question.points),
      questionTitle: question.questionTitle ?? null,
      questionType: question.questionType as PracticeQuestionType,
      topicName: question.topicName ?? null,
      basePoints: Number(question.basePoints),
      year: question.year ?? null,
    })),
  } satisfies PracticeDetails
}

export async function getAdminPracticeLookups() {
  const [examTypes, subjects, topics, questions] = await Promise.all([
    db
      .select({
        id: schema.examTypes.id,
        name: schema.examTypes.name,
        slug: schema.examTypes.slug,
      })
      .from(schema.examTypes)
      .orderBy(schema.examTypes.name),
    db
      .select({
        id: schema.subjects.id,
        examTypeId: schema.subjects.examTypeId,
        name: schema.subjects.name,
        slug: schema.subjects.slug,
      })
      .from(schema.subjects)
      .orderBy(schema.subjects.name),
    db
      .select({
        id: schema.topics.id,
        examTypeId: schema.subjects.examTypeId,
        subjectId: schema.topics.subjectId,
        name: schema.topics.name,
        slug: schema.topics.slug,
      })
      .from(schema.topics)
      .innerJoin(schema.subjects, eq(schema.topics.subjectId, schema.subjects.id))
      .orderBy(schema.topics.name),
    db
      .select({
        id: schema.questions.id,
        examTypeId: schema.subjects.examTypeId,
        subjectId: schema.questions.subjectId,
        subjectName: schema.subjects.name,
        topicId: schema.questions.topicId,
        topicName: schema.topics.name,
        title: schema.questions.title,
        content: schema.questions.content,
        type: schema.questions.type,
        difficulty: schema.questions.difficulty,
        status: schema.questions.status,
        year: schema.questions.year,
        points: schema.questions.points,
      })
      .from(schema.questions)
      .innerJoin(schema.subjects, eq(schema.questions.subjectId, schema.subjects.id))
      .leftJoin(schema.topics, eq(schema.questions.topicId, schema.topics.id))
      .orderBy(desc(schema.questions.updatedAt)),
  ])

  return {
    examTypes: examTypes as PracticeLookupOption[],
    subjects: subjects as PracticeSubjectLookupOption[],
    topics: topics as PracticeTopicLookupOption[],
    questions: questions.map<PracticeQuestionLookupOption>((question) => ({
      ...question,
      topicId: question.topicId ?? null,
      topicName: question.topicName ?? null,
      title: question.title ?? null,
      type: question.type as PracticeQuestionType,
      year: question.year ?? null,
      points: Number(question.points),
    })),
  }
}
