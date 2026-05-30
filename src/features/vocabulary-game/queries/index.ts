import "server-only"

import { desc, eq, sql } from "drizzle-orm"

import { db, schema } from "@/db"

import {
  shuffleArray,
  pickRandom,
} from "../utils"
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
  wrongOptions: string[]
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

  return row.wrongOptions.length > 0
}

function buildGameQuestion(row: VocabularyRow): VocabularyGameQuestion | null {
  const correctMeaning = row.correctMeaning.trim()
  const normalizedWrongOptions = row.wrongOptions
    .map((option) => option.trim())
    .filter((option) => option.length > 0)

  if (normalizedWrongOptions.length === 0) {
    return null
  }

  const filteredWrongOptions = normalizedWrongOptions.filter(
    (option) => option.toLowerCase() !== correctMeaning.toLowerCase(),
  )

  if (filteredWrongOptions.length === 0) {
    return null
  }

  const wrongMeaning = pickRandom(filteredWrongOptions)

  if (!wrongMeaning) {
    return null
  }

  const correctSide = Math.random() < 0.5 ? "left" : "right"

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
      wrongOptions: schema.vocabularies.wrongOptions,
      status: schema.vocabularies.status,
    })
    .from(schema.vocabularies)
    .where(eq(schema.vocabularies.status, "published"))
    .orderBy(desc(schema.vocabularies.createdAt))

  const filteredRows = rows.filter((row) => matchesConfig(row, config))
  const shuffledRows = shuffleArray(filteredRows)
  const selectedRows = shuffledRows.slice(0, Math.min(config.count, shuffledRows.length))
  const questions = selectedRows
    .map(buildGameQuestion)
    .filter((question): question is VocabularyGameQuestion => question !== null)

  return {
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
