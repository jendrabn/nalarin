import "server-only"

import { desc, eq, sql } from "drizzle-orm"

import { db, schema } from "@/db"
import {
  createServerSessionId,
  randomBoolean,
  shuffleWithSecureRandom,
} from "@/lib/server-random"

import type {
  VocabularyGameConfig,
  VocabularyGameQuestion,
  VocabularyGameSession,
} from "../types"

type VocabularyRow = {
  id: number
  word: string
  language: (typeof schema.vocabularyLanguageValues)[number]
  difficulty: (typeof schema.questionDifficultyValues)[number]
  type: (typeof schema.vocabularyTypeValues)[number]
  correctMeaning: string
  wrongOption: string
  exampleSentence: string | null
  status: (typeof schema.contentStatusValues)[number]
}

function matchesConfig(row: VocabularyRow, config: VocabularyGameConfig) {
  if (config.language !== "all" && row.language !== config.language) {
    return false
  }

  if (config.difficulty !== "all" && row.difficulty !== config.difficulty) {
    return false
  }

  if (config.type !== "all" && row.type !== config.type) {
    return false
  }

  return row.wrongOption.trim().length > 0
}

function getQuestionDedupeKey(row: VocabularyRow) {
  return [
    row.word.trim().toLowerCase(),
    row.language,
    row.type,
  ].join("|")
}

function buildGameQuestion(row: VocabularyRow): VocabularyGameQuestion | null {
  const correctMeaning = row.correctMeaning.trim()
  const wrongMeaning = row.wrongOption.trim()

  if (wrongMeaning.length === 0) {
    return null
  }

  if (wrongMeaning.toLowerCase() === correctMeaning.toLowerCase()) {
    return null
  }

  const correctSide = randomBoolean() ? "left" : "right"

  return {
    vocabularyId: row.id,
    word: row.word,
    language: row.language,
    difficulty: row.difficulty,
    type: row.type,
    correctMeaning,
    wrongMeaning,
    leftOption: correctSide === "left" ? correctMeaning : wrongMeaning,
    rightOption: correctSide === "right" ? correctMeaning : wrongMeaning,
    correctSide,
    exampleSentence: row.exampleSentence,
  }
}

export async function getVocabularyGameSession(
  config: VocabularyGameConfig,
): Promise<VocabularyGameSession> {
  const rows = await db
    .select({
      id: schema.vocabularies.id,
      word: schema.vocabularies.word,
      language: schema.vocabularies.language,
      difficulty: schema.vocabularies.difficulty,
      type: schema.vocabularies.type,
      correctMeaning: schema.vocabularies.correctMeaning,
      wrongOption: schema.vocabularies.wrongOption,
      exampleSentence: schema.vocabularies.exampleSentence,
      status: schema.vocabularies.status,
    })
    .from(schema.vocabularies)
    .where(eq(schema.vocabularies.status, "published"))
    .orderBy(desc(schema.vocabularies.createdAt))

  const filteredRows = rows.filter((row) => matchesConfig(row, config))
  const uniqueRows = Array.from(
    new Map(
      shuffleWithSecureRandom(filteredRows).map((row) => [getQuestionDedupeKey(row), row]),
    ).values(),
  )
  const shuffledRows = shuffleWithSecureRandom(uniqueRows)
  const selectedRows = shuffledRows.slice(0, Math.min(config.count, shuffledRows.length))
  const questions = selectedRows
    .map(buildGameQuestion)
    .filter((question): question is VocabularyGameQuestion => question !== null)

  return {
    sessionId: createServerSessionId(),
    config,
    availableCount: filteredRows.length,
    requestedCount: config.count,
    totalQuestions: questions.length,
    questions,
  }
}

export async function getPublishedVocabularyCount() {
  const [row] = await db
    .select({
      count: sql<number>`count(${schema.vocabularies.id})`,
    })
    .from(schema.vocabularies)
    .where(eq(schema.vocabularies.status, "published"))

  return Number(row?.count ?? 0)
}
