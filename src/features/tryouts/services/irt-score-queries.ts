import "server-only"

import { eq, inArray } from "drizzle-orm"

import { db, schema } from "@/db"
import type { PracticeQuestionType } from "@/features/practices/types"

import {
  calculateIrtScore,
  getIrtDifficulty,
  getIrtOptionCount,
  type IrtItemResponse,
} from "../utils/irt-scoring"

export async function getIrtSectionScoreMap(sessionId: number) {
  return getIrtSectionScoreMapForSessions([sessionId])
}

export async function getIrtSectionScoreMapForSessions(sessionIds: number[]) {
  if (sessionIds.length === 0) {
    return new Map<number, number>()
  }

  const rows = await db
    .select({
      sectionSessionId: schema.tryoutSessionQuestions.tryoutSectionSessionId,
      questionSnapshot: schema.tryoutSessionQuestions.questionSnapshot,
      optionSnapshot: schema.tryoutSessionQuestions.optionSnapshot,
      isCorrect: schema.tryoutAnswers.isCorrect,
    })
    .from(schema.tryoutSessionQuestions)
    .leftJoin(
      schema.tryoutAnswers,
      eq(schema.tryoutSessionQuestions.id, schema.tryoutAnswers.tryoutSessionQuestionId),
    )
    .where(inArray(schema.tryoutSessionQuestions.tryoutSessionId, sessionIds))

  const itemsBySection = new Map<number, IrtItemResponse[]>()

  for (const row of rows) {
    const items = itemsBySection.get(row.sectionSessionId) ?? []

    items.push(toIrtItemResponse(row))
    itemsBySection.set(row.sectionSessionId, items)
  }

  return new Map(
    Array.from(itemsBySection.entries()).map(([sectionSessionId, items]) => [
      sectionSessionId,
      calculateIrtScore(items),
    ]),
  )
}

export async function getIrtSessionScoreMap(sessionIds: number[]) {
  if (sessionIds.length === 0) {
    return new Map<number, number>()
  }

  const rows = await db
    .select({
      sessionId: schema.tryoutSessionQuestions.tryoutSessionId,
      sectionSessionId: schema.tryoutSessionQuestions.tryoutSectionSessionId,
      questionSnapshot: schema.tryoutSessionQuestions.questionSnapshot,
      optionSnapshot: schema.tryoutSessionQuestions.optionSnapshot,
      isCorrect: schema.tryoutAnswers.isCorrect,
    })
    .from(schema.tryoutSessionQuestions)
    .leftJoin(
      schema.tryoutAnswers,
      eq(schema.tryoutSessionQuestions.id, schema.tryoutAnswers.tryoutSessionQuestionId),
    )
    .where(inArray(schema.tryoutSessionQuestions.tryoutSessionId, sessionIds))

  const itemsBySessionSection = new Map<string, IrtItemResponse[]>()

  for (const row of rows) {
    const key = `${row.sessionId}:${row.sectionSessionId}`
    const items = itemsBySessionSection.get(key) ?? []

    items.push(toIrtItemResponse(row))
    itemsBySessionSection.set(key, items)
  }

  const sectionScoresBySession = new Map<number, number[]>()

  for (const [key, items] of itemsBySessionSection.entries()) {
    const sessionId = Number(key.split(":")[0])
    const scores = sectionScoresBySession.get(sessionId) ?? []

    scores.push(calculateIrtScore(items))
    sectionScoresBySession.set(sessionId, scores)
  }

  return new Map(
    Array.from(sectionScoresBySession.entries()).map(([sessionId, scores]) => [
      sessionId,
      scores.reduce((total, score) => total + score, 0) / scores.length,
    ]),
  )
}

function toIrtItemResponse(row: {
  questionSnapshot: unknown
  optionSnapshot: unknown
  isCorrect: boolean | null
}): IrtItemResponse {
  const question = normalizeIrtQuestionSnapshot(row.questionSnapshot)

  return {
    isCorrect: row.isCorrect === true,
    difficulty: getIrtDifficulty(question.difficulty),
    questionType: question.type,
    optionCount: getIrtOptionCount(row.optionSnapshot),
  }
}

function normalizeIrtQuestionSnapshot(value: unknown): {
  type: PracticeQuestionType
  difficulty: unknown
} {
  const snapshot = value as Partial<{
    type: unknown
    difficulty: unknown
  }>

  return {
    type: isPracticeQuestionType(snapshot.type) ? snapshot.type : "multiple_choice",
    difficulty: snapshot.difficulty,
  }
}

function isPracticeQuestionType(value: unknown): value is PracticeQuestionType {
  return (
    value === "multiple_choice" ||
    value === "multiple_select" ||
    value === "true_false" ||
    value === "short_answer" ||
    value === "essay"
  )
}
