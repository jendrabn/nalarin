"use server"

import "server-only"

import { desc, eq, sql } from "drizzle-orm"

import { db, schema } from "@/db"

import type {
  QuestionDifficulty,
  QuestionStatus,
  QuestionType,
  QuestionScoringRule,
} from "../constants"

export type QuestionOptionRow = {
  id: number
  label: string
  content: string
  imageUrl: string | null
  isCorrect: boolean
  createdAt: Date
  updatedAt: Date
}

export type QuestionRow = {
  id: number
  examTypeId: number
  examTypeName: string
  subjectId: number
  subjectName: string
  topicId: number | null
  topicName: string | null
  type: QuestionType
  difficulty: QuestionDifficulty
  scoringRule: QuestionScoringRule | null
  title: string | null
  content: string
  imageUrl: string | null
  correctAnswerText: string | null
  gradingRubric: string | null
  manualExplanation: string | null
  aiExplanation: string | null
  year: number | null
  points: number
  status: QuestionStatus
  optionCount: number
  createdAt: Date
  updatedAt: Date
}

export type QuestionDetails = QuestionRow & {
  createdBy: number | null
  options: QuestionOptionRow[]
}

export type QuestionLookupOption = {
  id: number
  name: string
  slug: string
}

export type SubjectLookupOption = {
  id: number
  examTypeId: number
  name: string
  slug: string
}

export type TopicLookupOption = {
  id: number
  subjectId: number
  name: string
  slug: string
}

function selectQuestionColumns() {
  return {
    id: schema.questions.id,
    examTypeId: schema.examTypes.id,
    examTypeName: schema.examTypes.name,
    subjectId: schema.questions.subjectId,
    subjectName: schema.subjects.name,
    topicId: schema.questions.topicId,
    topicName: schema.topics.name,
    type: schema.questions.type,
    difficulty: schema.questions.difficulty,
    scoringRule: schema.questions.scoringRule,
    title: schema.questions.title,
    content: schema.questions.content,
    imageUrl: schema.questions.imageUrl,
    correctAnswerText: schema.questions.correctAnswerText,
    gradingRubric: schema.questions.gradingRubric,
    manualExplanation: schema.questions.manualExplanation,
    aiExplanation: schema.questions.aiExplanation,
    year: schema.questions.year,
    points: schema.questions.points,
    status: schema.questions.status,
    createdAt: schema.questions.createdAt,
    updatedAt: schema.questions.updatedAt,
  } as const
}

function normalizeQuestionRow(
  row: {
    id: number
    examTypeId: number
    examTypeName: string
    subjectId: number
    subjectName: string
    topicId: number | null
    topicName: string | null
    type: QuestionType
    difficulty: QuestionDifficulty
    scoringRule: QuestionScoringRule | null
    title: string | null
    content: string
    imageUrl: string | null
    correctAnswerText: string | null
    gradingRubric: string | null
    manualExplanation: string | null
    aiExplanation: string | null
    year: number | null
    points: number
    status: QuestionStatus
    createdAt: Date
    updatedAt: Date
  },
  optionCount: number,
): QuestionRow {
  return {
    ...row,
    topicName: row.topicName ?? null,
    imageUrl: row.imageUrl ?? null,
    correctAnswerText: row.correctAnswerText ?? null,
    gradingRubric: row.gradingRubric ?? null,
    manualExplanation: row.manualExplanation ?? null,
    aiExplanation: row.aiExplanation ?? null,
    year: row.year ?? null,
    optionCount,
  }
}

export async function getQuestions() {
  const [rows, optionCounts] = await Promise.all([
    db
      .select(selectQuestionColumns())
      .from(schema.questions)
      .innerJoin(schema.subjects, eq(schema.questions.subjectId, schema.subjects.id))
      .innerJoin(schema.examTypes, eq(schema.subjects.examTypeId, schema.examTypes.id))
      .leftJoin(schema.topics, eq(schema.questions.topicId, schema.topics.id))
      .orderBy(desc(schema.questions.createdAt)),
    db
      .select({
        questionId: schema.questionOptions.questionId,
        optionCount: sql<number>`count(${schema.questionOptions.id})`,
      })
      .from(schema.questionOptions)
      .groupBy(schema.questionOptions.questionId),
  ])

  const optionCountMap = new Map<number, number>(
    optionCounts.map((row) => [row.questionId, Number(row.optionCount ?? 0)]),
  )

  return rows.map<QuestionRow>((row) =>
    normalizeQuestionRow(row, optionCountMap.get(row.id) ?? 0),
  )
}

export async function getQuestionById(id: number) {
  const row = await db
    .select({
      ...selectQuestionColumns(),
      createdBy: schema.questions.createdBy,
    })
    .from(schema.questions)
    .innerJoin(schema.subjects, eq(schema.questions.subjectId, schema.subjects.id))
    .innerJoin(schema.examTypes, eq(schema.subjects.examTypeId, schema.examTypes.id))
    .leftJoin(schema.topics, eq(schema.questions.topicId, schema.topics.id))
    .where(eq(schema.questions.id, id))
    .limit(1)

  const question = row[0]

  if (!question) {
    return null
  }

  const options = await db
    .select({
      id: schema.questionOptions.id,
      label: schema.questionOptions.label,
      content: schema.questionOptions.content,
      imageUrl: schema.questionOptions.imageUrl,
      isCorrect: schema.questionOptions.isCorrect,
      createdAt: schema.questionOptions.createdAt,
      updatedAt: schema.questionOptions.updatedAt,
    })
    .from(schema.questionOptions)
    .where(eq(schema.questionOptions.questionId, id))
    .orderBy(schema.questionOptions.id)

  return {
    ...normalizeQuestionRow(question, options.length),
    createdBy: question.createdBy ?? null,
    options: options.map((option) => ({
      ...option,
      imageUrl: option.imageUrl ?? null,
    })),
  } satisfies QuestionDetails
}

export async function getAdminQuestionLookups() {
  const [examTypes, subjects, topics] = await Promise.all([
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
        subjectId: schema.topics.subjectId,
        name: schema.topics.name,
        slug: schema.topics.slug,
      })
      .from(schema.topics)
      .orderBy(schema.topics.name),
  ])

  return {
    examTypes: examTypes as QuestionLookupOption[],
    subjects: subjects as SubjectLookupOption[],
    topics: topics as TopicLookupOption[],
  }
}

export async function getQuestionRelationByExamTypeAndSubject(
  examTypeId: number,
  subjectId: number,
) {
  const subject = await db.query.subjects.findFirst({
    where: eq(schema.subjects.id, subjectId),
    columns: {
      id: true,
      examTypeId: true,
    },
  })

  if (!subject || subject.examTypeId !== examTypeId) {
    return null
  }

  return subject
}

