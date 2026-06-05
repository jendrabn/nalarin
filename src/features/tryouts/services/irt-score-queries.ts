import "server-only"

import { and, eq, inArray } from "drizzle-orm"

import { db, schema } from "@/db"
import type { PracticeQuestionType } from "@/features/practices/types"

import {
  calculateIrtScore,
  getDefaultIrtItemParameters,
  getIrtOptionCount,
  getIrtGuessingValue,
  type IrtItemParameters,
  type IrtItemResponse,
} from "../utils/irt-scoring"

const MIN_CALIBRATION_RESPONSES = 5
const MIN_DISCRIMINATION_RESPONSES = 8

export async function getIrtSectionScoreMap(sessionId: number) {
  return getIrtSectionScoreMapForSessions([sessionId])
}

export async function getIrtSectionScoreMapForSessions(sessionIds: number[]) {
  if (sessionIds.length === 0) {
    return new Map<number, number>()
  }

  const rows = await db
    .select({
      tryoutId: schema.tryoutSessions.tryoutId,
      sessionId: schema.tryoutSessionQuestions.tryoutSessionId,
      sectionSessionId: schema.tryoutSessionQuestions.tryoutSectionSessionId,
      tryoutQuestionId: schema.tryoutSessionQuestions.tryoutQuestionId,
      questionSnapshot: schema.tryoutSessionQuestions.questionSnapshot,
      optionSnapshot: schema.tryoutSessionQuestions.optionSnapshot,
      isCorrect: schema.tryoutAnswers.isCorrect,
    })
    .from(schema.tryoutSessionQuestions)
    .innerJoin(
      schema.tryoutSessions,
      eq(schema.tryoutSessionQuestions.tryoutSessionId, schema.tryoutSessions.id),
    )
    .leftJoin(
      schema.tryoutAnswers,
      eq(schema.tryoutSessionQuestions.id, schema.tryoutAnswers.tryoutSessionQuestionId),
    )
    .where(inArray(schema.tryoutSessionQuestions.tryoutSessionId, sessionIds))

  const itemParameterMap = await getCalibratedIrtItemParameterMap(
    getUniqueIds(rows.map((row) => row.tryoutId)),
  )
  const itemsBySection = new Map<number, IrtItemResponse[]>()

  for (const row of rows) {
    const items = itemsBySection.get(row.sectionSessionId) ?? []

    items.push(toIrtItemResponse(row, itemParameterMap))
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
      tryoutId: schema.tryoutSessions.tryoutId,
      sessionId: schema.tryoutSessionQuestions.tryoutSessionId,
      sectionSessionId: schema.tryoutSessionQuestions.tryoutSectionSessionId,
      tryoutQuestionId: schema.tryoutSessionQuestions.tryoutQuestionId,
      questionSnapshot: schema.tryoutSessionQuestions.questionSnapshot,
      optionSnapshot: schema.tryoutSessionQuestions.optionSnapshot,
      isCorrect: schema.tryoutAnswers.isCorrect,
    })
    .from(schema.tryoutSessionQuestions)
    .innerJoin(
      schema.tryoutSessions,
      eq(schema.tryoutSessionQuestions.tryoutSessionId, schema.tryoutSessions.id),
    )
    .leftJoin(
      schema.tryoutAnswers,
      eq(schema.tryoutSessionQuestions.id, schema.tryoutAnswers.tryoutSessionQuestionId),
    )
    .where(inArray(schema.tryoutSessionQuestions.tryoutSessionId, sessionIds))

  const itemParameterMap = await getCalibratedIrtItemParameterMap(
    getUniqueIds(rows.map((row) => row.tryoutId)),
  )
  const itemsBySessionSection = new Map<string, IrtItemResponse[]>()

  for (const row of rows) {
    const key = `${row.sessionId}:${row.sectionSessionId}`
    const items = itemsBySessionSection.get(key) ?? []

    items.push(toIrtItemResponse(row, itemParameterMap))
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

async function getCalibratedIrtItemParameterMap(tryoutIds: number[]) {
  if (tryoutIds.length === 0) {
    return new Map<number, IrtItemParameters>()
  }

  const rows = await db
    .select({
      tryoutId: schema.tryoutSessions.tryoutId,
      sessionId: schema.tryoutSessionQuestions.tryoutSessionId,
      tryoutQuestionId: schema.tryoutSessionQuestions.tryoutQuestionId,
      questionSnapshot: schema.tryoutSessionQuestions.questionSnapshot,
      optionSnapshot: schema.tryoutSessionQuestions.optionSnapshot,
      isCorrect: schema.tryoutAnswers.isCorrect,
    })
    .from(schema.tryoutSessionQuestions)
    .innerJoin(
      schema.tryoutSessions,
      eq(schema.tryoutSessionQuestions.tryoutSessionId, schema.tryoutSessions.id),
    )
    .innerJoin(
      schema.tryoutSectionSessions,
      eq(
        schema.tryoutSessionQuestions.tryoutSectionSessionId,
        schema.tryoutSectionSessions.id,
      ),
    )
    .leftJoin(
      schema.tryoutAnswers,
      eq(schema.tryoutSessionQuestions.id, schema.tryoutAnswers.tryoutSessionQuestionId),
    )
    .where(
      and(
        inArray(schema.tryoutSessions.tryoutId, tryoutIds),
        eq(schema.tryoutSectionSessions.status, "graded"),
      ),
    )

  return calibrateIrtItemParameters(
    rows.map((row) => {
      const question = normalizeIrtQuestionSnapshot(row.questionSnapshot)

      return {
        tryoutId: row.tryoutId,
        sessionId: row.sessionId,
        tryoutQuestionId: row.tryoutQuestionId,
        isCorrect: row.isCorrect === true,
        questionType: question.type,
        optionCount: getIrtOptionCount(row.optionSnapshot),
      }
    }),
  )
}

function calibrateIrtItemParameters(
  rows: Array<{
    tryoutId: number
    sessionId: number
    tryoutQuestionId: number
    isCorrect: boolean
    questionType: PracticeQuestionType
    optionCount: number
  }>,
) {
  const rawScoresByTryoutSession = new Map<string, number>()

  for (const row of rows) {
    const key = getTryoutSessionKey(row.tryoutId, row.sessionId)
    rawScoresByTryoutSession.set(
      key,
      (rawScoresByTryoutSession.get(key) ?? 0) + (row.isCorrect ? 1 : 0),
    )
  }

  const abilityByTryoutSession = getAbilityProxyMap(rawScoresByTryoutSession)
  const responsesByItem = new Map<
    number,
    Array<{
      isCorrect: boolean
      ability: number
      questionType: PracticeQuestionType
      optionCount: number
    }>
  >()

  for (const row of rows) {
    const responses = responsesByItem.get(row.tryoutQuestionId) ?? []

    responses.push({
      isCorrect: row.isCorrect,
      ability: abilityByTryoutSession.get(getTryoutSessionKey(row.tryoutId, row.sessionId)) ?? 0,
      questionType: row.questionType,
      optionCount: row.optionCount,
    })
    responsesByItem.set(row.tryoutQuestionId, responses)
  }

  return new Map(
    Array.from(responsesByItem.entries()).map(([tryoutQuestionId, responses]) => [
      tryoutQuestionId,
      estimateIrtItemParameters(responses),
    ]),
  )
}

function estimateIrtItemParameters(
  responses: Array<{
    isCorrect: boolean
    ability: number
    questionType: PracticeQuestionType
    optionCount: number
  }>,
): IrtItemParameters {
  const itemIdentity = responses[0] ?? { questionType: "multiple_choice", optionCount: 0 }
  const defaultParameters = getDefaultIrtItemParameters(itemIdentity)

  if (responses.length < MIN_CALIBRATION_RESPONSES) {
    return defaultParameters
  }

  const correctCount = responses.filter((response) => response.isCorrect).length
  const smoothedCorrectRate = (correctCount + 0.5) / (responses.length + 1)
  const guessing = getIrtGuessingValue(itemIdentity)
  const adjustedCorrectRate = clamp(
    (smoothedCorrectRate - guessing) / Math.max(0.0001, 1 - guessing),
    0.01,
    0.99,
  )
  const difficulty = clamp(-logit(adjustedCorrectRate), -4, 4)

  return {
    discrimination: estimateIrtDiscrimination(responses),
    difficulty,
    guessing,
  }
}

function estimateIrtDiscrimination(
  responses: Array<{ isCorrect: boolean; ability: number }>,
) {
  const correctResponses = responses.filter((response) => response.isCorrect)
  const wrongResponses = responses.filter((response) => !response.isCorrect)

  if (
    responses.length < MIN_DISCRIMINATION_RESPONSES ||
    correctResponses.length === 0 ||
    wrongResponses.length === 0
  ) {
    return 1
  }

  const p = correctResponses.length / responses.length
  const q = 1 - p
  const abilityStandardDeviation = getStandardDeviation(
    responses.map((response) => response.ability),
  )

  if (abilityStandardDeviation <= 0) {
    return 1
  }

  const pointBiserial =
    ((getAverage(correctResponses.map((response) => response.ability)) -
      getAverage(wrongResponses.map((response) => response.ability))) /
      abilityStandardDeviation) *
    Math.sqrt(p * q)

  return clamp(0.7 + 2.2 * Math.max(0, pointBiserial), 0.5, 2.5)
}

function toIrtItemResponse(row: {
  tryoutQuestionId: number
  questionSnapshot: unknown
  optionSnapshot: unknown
  isCorrect: boolean | null
}, itemParameterMap: Map<number, IrtItemParameters>): IrtItemResponse {
  const question = normalizeIrtQuestionSnapshot(row.questionSnapshot)
  const optionCount = getIrtOptionCount(row.optionSnapshot)

  return {
    isCorrect: row.isCorrect === true,
    questionType: question.type,
    optionCount,
    parameters:
      itemParameterMap.get(row.tryoutQuestionId) ??
      getDefaultIrtItemParameters({
        questionType: question.type,
        optionCount,
      }),
  }
}

function normalizeIrtQuestionSnapshot(value: unknown): {
  type: PracticeQuestionType
} {
  const snapshot = value as Partial<{
    type: unknown
  }>

  return {
    type: isPracticeQuestionType(snapshot.type) ? snapshot.type : "multiple_choice",
  }
}

function isPracticeQuestionType(value: unknown): value is PracticeQuestionType {
  return (
    value === "multiple_choice" ||
    value === "multiple_answer" ||
    value === "true_false" ||
    value === "short_answer"
  )
}

function getAbilityProxyMap(rawScoresByTryoutSession: Map<string, number>) {
  const scoresByTryout = new Map<number, number[]>()

  for (const [key, score] of rawScoresByTryoutSession.entries()) {
    const tryoutId = Number(key.split(":")[0])
    const scores = scoresByTryout.get(tryoutId) ?? []

    scores.push(score)
    scoresByTryout.set(tryoutId, scores)
  }

  const statsByTryout = new Map(
    Array.from(scoresByTryout.entries()).map(([tryoutId, scores]) => [
      tryoutId,
      {
        mean: getAverage(scores),
        standardDeviation: getStandardDeviation(scores),
      },
    ]),
  )

  return new Map(
    Array.from(rawScoresByTryoutSession.entries()).map(([key, score]) => {
      const tryoutId = Number(key.split(":")[0])
      const stats = statsByTryout.get(tryoutId)
      const ability =
        stats && stats.standardDeviation > 0
          ? (score - stats.mean) / stats.standardDeviation
          : 0

      return [key, ability]
    }),
  )
}

function getTryoutSessionKey(tryoutId: number, sessionId: number) {
  return `${tryoutId}:${sessionId}`
}

function getUniqueIds(ids: number[]) {
  return Array.from(new Set(ids))
}

function getAverage(values: number[]) {
  if (values.length === 0) {
    return 0
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function getStandardDeviation(values: number[]) {
  if (values.length <= 1) {
    return 0
  }

  const average = getAverage(values)
  const variance =
    values.reduce((sum, value) => sum + (value - average) ** 2, 0) / values.length

  return Math.sqrt(variance)
}

function logit(value: number) {
  return Math.log(value / (1 - value))
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}
