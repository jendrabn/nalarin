"use server"

import "server-only"

import { desc, eq, sql } from "drizzle-orm"

import { db, schema } from "@/db"

import type {
  TryoutNavigationMode,
  TryoutQuestionDifficulty,
  TryoutQuestionType,
  TryoutStatus,
} from "../constants"

export type TryoutRow = {
  id: number
  examTypeId: number
  examTypeName: string
  title: string
  slug: string
  description: string | null
  isFree: boolean
  startsAt: Date | null
  endsAt: Date | null
  shuffleQuestions: boolean
  shuffleOptions: boolean
  allowReviewBeforeSubmit: boolean
  showResultAfterSubmit: boolean
  resultReleaseAt: Date | null
  showRankingAfterSubmit: boolean
  rankingReleaseAt: Date | null
  showExplanationAfterSubmit: boolean
  explanationReleaseAt: Date | null
  navigationMode: TryoutNavigationMode
  enforceEndTime: boolean
  wrongAnswerPenalty: number
  status: TryoutStatus
  publishedAt: Date | null
  createdBy: number | null
  sectionCount: number
  questionCount: number
  sessionCount: number
  createdAt: Date
  updatedAt: Date
}

export type TryoutSectionDetails = {
  id: number
  tryoutId: number
  subjectId: number
  subjectName: string
  title: string
  description: string | null
  durationMinutes: number
  orderIndex: number
  wrongAnswerPenalty: number | null
  questionCount: number
  createdAt: Date
  updatedAt: Date
  questions: TryoutQuestionDetails[]
}

export type TryoutQuestionDetails = {
  id: number
  tryoutSectionId: number
  questionId: number
  orderIndex: number
  points: number | null
  questionTitle: string | null
  questionContent: string
  questionType: TryoutQuestionType
  questionStatus: TryoutStatus
  subjectId: number
  subjectName: string
  basePoints: number
}

export type TryoutDetails = TryoutRow & {
  sections: TryoutSectionDetails[]
}

export type TryoutLookupOption = {
  id: number
  name: string
  slug: string
}

export type TryoutSubjectLookupOption = {
  id: number
  examTypeId: number
  name: string
  slug: string
}

export type TryoutQuestionLookupOption = {
  id: number
  examTypeId: number
  subjectId: number
  subjectName: string
  topicId: number | null
  topicName: string | null
  title: string | null
  content: string
  type: TryoutQuestionType
  difficulty: TryoutQuestionDifficulty
  status: TryoutStatus
  year: number | null
  points: number
}

function selectTryoutColumns() {
  return {
    id: schema.tryouts.id,
    examTypeId: schema.tryouts.examTypeId,
    examTypeName: schema.examTypes.name,
    title: schema.tryouts.title,
    slug: schema.tryouts.slug,
    description: schema.tryouts.description,
    isFree: schema.tryouts.isFree,
    startsAt: schema.tryouts.startsAt,
    endsAt: schema.tryouts.endsAt,
    shuffleQuestions: schema.tryouts.shuffleQuestions,
    shuffleOptions: schema.tryouts.shuffleOptions,
    allowReviewBeforeSubmit: schema.tryouts.allowReviewBeforeSubmit,
    showResultAfterSubmit: schema.tryouts.showResultAfterSubmit,
    resultReleaseAt: schema.tryouts.resultReleaseAt,
    showRankingAfterSubmit: schema.tryouts.showRankingAfterSubmit,
    rankingReleaseAt: schema.tryouts.rankingReleaseAt,
    showExplanationAfterSubmit: schema.tryouts.showExplanationAfterSubmit,
    explanationReleaseAt: schema.tryouts.explanationReleaseAt,
    navigationMode: schema.tryouts.navigationMode,
    enforceEndTime: schema.tryouts.enforceEndTime,
    wrongAnswerPenalty: schema.tryouts.wrongAnswerPenalty,
    status: schema.tryouts.status,
    publishedAt: schema.tryouts.publishedAt,
    createdBy: schema.tryouts.createdBy,
    createdAt: schema.tryouts.createdAt,
    updatedAt: schema.tryouts.updatedAt,
  } as const
}

function normalizeTryoutRow(
  row: Omit<TryoutRow, "sectionCount" | "questionCount" | "sessionCount" | "wrongAnswerPenalty"> & {
    wrongAnswerPenalty: string | number
  },
  counts: {
    sectionCount?: number
    questionCount?: number
    sessionCount?: number
  } = {},
): TryoutRow {
  return {
    ...row,
    description: row.description ?? null,
    startsAt: row.startsAt ?? null,
    endsAt: row.endsAt ?? null,
    resultReleaseAt: row.resultReleaseAt ?? null,
    rankingReleaseAt: row.rankingReleaseAt ?? null,
    explanationReleaseAt: row.explanationReleaseAt ?? null,
    wrongAnswerPenalty: Number(row.wrongAnswerPenalty),
    publishedAt: row.publishedAt ?? null,
    createdBy: row.createdBy ?? null,
    sectionCount: counts.sectionCount ?? 0,
    questionCount: counts.questionCount ?? 0,
    sessionCount: counts.sessionCount ?? 0,
  }
}

export async function getTryouts() {
  const [rows, sectionCounts, questionCounts, sessionCounts] = await Promise.all([
    db
      .select(selectTryoutColumns())
      .from(schema.tryouts)
      .innerJoin(schema.examTypes, eq(schema.tryouts.examTypeId, schema.examTypes.id))
      .orderBy(desc(schema.tryouts.createdAt)),
    db
      .select({
        tryoutId: schema.tryoutSections.tryoutId,
        count: sql<number>`count(${schema.tryoutSections.id})`,
      })
      .from(schema.tryoutSections)
      .groupBy(schema.tryoutSections.tryoutId),
    db
      .select({
        tryoutId: schema.tryoutSections.tryoutId,
        count: sql<number>`count(${schema.tryoutQuestions.id})`,
      })
      .from(schema.tryoutQuestions)
      .innerJoin(
        schema.tryoutSections,
        eq(schema.tryoutQuestions.tryoutSectionId, schema.tryoutSections.id),
      )
      .groupBy(schema.tryoutSections.tryoutId),
    db
      .select({
        tryoutId: schema.tryoutSessions.tryoutId,
        count: sql<number>`count(${schema.tryoutSessions.id})`,
      })
      .from(schema.tryoutSessions)
      .groupBy(schema.tryoutSessions.tryoutId),
  ])

  const sectionMap = new Map(sectionCounts.map((row) => [row.tryoutId, Number(row.count)]))
  const questionMap = new Map(questionCounts.map((row) => [row.tryoutId, Number(row.count)]))
  const sessionMap = new Map(sessionCounts.map((row) => [row.tryoutId, Number(row.count)]))

  return rows.map((row) =>
    normalizeTryoutRow(row, {
      sectionCount: sectionMap.get(row.id),
      questionCount: questionMap.get(row.id),
      sessionCount: sessionMap.get(row.id),
    }),
  )
}

export async function getTryoutById(id: number) {
  const rows = await db
    .select(selectTryoutColumns())
    .from(schema.tryouts)
    .innerJoin(schema.examTypes, eq(schema.tryouts.examTypeId, schema.examTypes.id))
    .where(eq(schema.tryouts.id, id))
    .limit(1)

  const tryout = rows[0]

  if (!tryout) {
    return null
  }

  const [sections, questions, sessionCountRows] = await Promise.all([
    db
      .select({
        id: schema.tryoutSections.id,
        tryoutId: schema.tryoutSections.tryoutId,
        subjectId: schema.tryoutSections.subjectId,
        subjectName: schema.subjects.name,
        title: schema.tryoutSections.title,
        description: schema.tryoutSections.description,
        durationMinutes: schema.tryoutSections.durationMinutes,
        orderIndex: schema.tryoutSections.orderIndex,
        wrongAnswerPenalty: schema.tryoutSections.wrongAnswerPenalty,
        createdAt: schema.tryoutSections.createdAt,
        updatedAt: schema.tryoutSections.updatedAt,
      })
      .from(schema.tryoutSections)
      .innerJoin(schema.subjects, eq(schema.tryoutSections.subjectId, schema.subjects.id))
      .where(eq(schema.tryoutSections.tryoutId, id))
      .orderBy(schema.tryoutSections.orderIndex),
    db
      .select({
        id: schema.tryoutQuestions.id,
        tryoutSectionId: schema.tryoutQuestions.tryoutSectionId,
        questionId: schema.tryoutQuestions.questionId,
        orderIndex: schema.tryoutQuestions.orderIndex,
        points: schema.tryoutQuestions.points,
        questionTitle: schema.questions.title,
        questionContent: schema.questions.content,
        questionType: schema.questions.type,
        questionStatus: schema.questions.status,
        subjectId: schema.questions.subjectId,
        subjectName: schema.subjects.name,
        basePoints: schema.questions.points,
      })
      .from(schema.tryoutQuestions)
      .innerJoin(schema.questions, eq(schema.tryoutQuestions.questionId, schema.questions.id))
      .innerJoin(schema.subjects, eq(schema.questions.subjectId, schema.subjects.id))
      .innerJoin(
        schema.tryoutSections,
        eq(schema.tryoutQuestions.tryoutSectionId, schema.tryoutSections.id),
      )
      .where(eq(schema.tryoutSections.tryoutId, id))
      .orderBy(schema.tryoutQuestions.orderIndex),
    db
      .select({
        count: sql<number>`count(${schema.tryoutSessions.id})`,
      })
      .from(schema.tryoutSessions)
      .where(eq(schema.tryoutSessions.tryoutId, id)),
  ])

  const questionsBySection = new Map<number, TryoutQuestionDetails[]>()
  questions.forEach((question) => {
    const current = questionsBySection.get(question.tryoutSectionId) ?? []
    current.push({
      ...question,
      points: question.points === null ? null : Number(question.points),
      basePoints: Number(question.basePoints),
      questionTitle: question.questionTitle ?? null,
    })
    questionsBySection.set(question.tryoutSectionId, current)
  })

  const sectionDetails = sections.map<TryoutSectionDetails>((section) => {
    const sectionQuestions = questionsBySection.get(section.id) ?? []

    return {
      ...section,
      description: section.description ?? null,
      wrongAnswerPenalty:
        section.wrongAnswerPenalty === null ? null : Number(section.wrongAnswerPenalty),
      questionCount: sectionQuestions.length,
      questions: sectionQuestions,
    }
  })

  return {
    ...normalizeTryoutRow(tryout, {
      sectionCount: sectionDetails.length,
      questionCount: questions.length,
      sessionCount: Number(sessionCountRows[0]?.count ?? 0),
    }),
    sections: sectionDetails,
  } satisfies TryoutDetails
}

export async function getAdminTryoutLookups() {
  const [examTypes, subjects, questions] = await Promise.all([
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
    examTypes: examTypes as TryoutLookupOption[],
    subjects: subjects as TryoutSubjectLookupOption[],
    questions: questions.map<TryoutQuestionLookupOption>((question) => ({
      ...question,
      title: question.title ?? null,
      topicId: question.topicId ?? null,
      topicName: question.topicName ?? null,
      year: question.year ?? null,
      points: Number(question.points),
    })),
  }
}
