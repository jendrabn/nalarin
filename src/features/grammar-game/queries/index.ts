import "server-only"

import { desc, eq } from "drizzle-orm"

import { db, schema } from "@/db"

import {
  shuffleArray,
  normalizeGrammarText,
  parseGrammarSentenceTemplate,
} from "../utils"
import type {
  GrammarGameChip,
  GrammarGameConfig,
  GrammarGameQuestion,
  GrammarGameSession,
} from "../types"

type GrammarQuestionRow = {
  id: number
  language: (typeof schema.vocabularyLanguageValues)[number]
  difficulty: (typeof schema.questionDifficultyValues)[number]
  category: string | null
  sentenceTemplate: string
  answers: { order: number; answer: string }[]
  distractors: string[]
  status: (typeof schema.contentStatusValues)[number]
}

function matchesConfig(row: GrammarQuestionRow, config: GrammarGameConfig) {
  if (config.language !== "all" && row.language !== config.language) {
    return false
  }

  if (config.difficulty !== "all" && row.difficulty !== config.difficulty) {
    return false
  }

  if (
    config.category !== "all" &&
    normalizeGrammarText(row.category ?? "") !== normalizeGrammarText(config.category)
  ) {
    return false
  }

  return row.answers.length > 0 && row.distractors.length > 0
}

function getGrammarQuestionDedupeKey(row: GrammarQuestionRow) {
  return [
    row.sentenceTemplate.trim().toLowerCase(),
    row.language,
    row.difficulty,
    normalizeGrammarText(row.category ?? ""),
  ].join("|")
}

function buildChips(row: GrammarQuestionRow): GrammarGameChip[] {
  const answerChips = row.answers
    .filter((entry) => entry.answer.trim().length > 0)
    .map((entry) => ({
      id: `q${row.id}-a${entry.order}`,
      text: entry.answer.trim(),
    }))

  const distractorChips = row.distractors
    .map((distractor, index) => ({
      id: `q${row.id}-d${index + 1}`,
      text: distractor.trim(),
    }))
    .filter((chip) => chip.text.length > 0)

  return shuffleArray([...answerChips, ...distractorChips])
}

function buildGameQuestion(row: GrammarQuestionRow): GrammarGameQuestion | null {
  const template = parseGrammarSentenceTemplate(row.sentenceTemplate)
  const answers = [...row.answers]
    .filter((entry) => Number.isInteger(entry.order) && entry.order > 0)
    .sort((left, right) => left.order - right.order)
    .map((entry) => ({
      order: entry.order,
      answer: entry.answer.trim(),
    }))

  const distractors = row.distractors.map((item) => item.trim()).filter((item) => item.length > 0)

  if (template.errors.length > 0 || answers.length === 0 || distractors.length === 0) {
    return null
  }

  return {
    id: row.id,
    sentenceTemplate: row.sentenceTemplate,
    language: row.language,
    difficulty: row.difficulty,
    category: row.category,
    chips: buildChips({
      ...row,
      answers,
      distractors,
    }),
  }
}

export async function getGrammarGameDiscoveryData() {
  const rows = await db
    .select({
      category: schema.grammarQuestions.category,
    })
    .from(schema.grammarQuestions)
    .where(eq(schema.grammarQuestions.status, "published"))
    .orderBy(desc(schema.grammarQuestions.createdAt))

  const categories = Array.from(
    new Set(
      rows
        .map((row) => row.category?.trim() ?? "")
        .filter((category) => category.length > 0),
    ),
  )

  return {
    categories,
  }
}

export async function getGrammarGameSession(
  config: GrammarGameConfig,
): Promise<GrammarGameSession> {
  const rows = await db
    .select({
      id: schema.grammarQuestions.id,
      language: schema.grammarQuestions.language,
      difficulty: schema.grammarQuestions.difficulty,
      category: schema.grammarQuestions.category,
      sentenceTemplate: schema.grammarQuestions.sentenceTemplate,
      answers: schema.grammarQuestions.answers,
      distractors: schema.grammarQuestions.distractors,
      status: schema.grammarQuestions.status,
    })
    .from(schema.grammarQuestions)
    .where(eq(schema.grammarQuestions.status, "published"))
    .orderBy(desc(schema.grammarQuestions.createdAt))

  const filteredRows = rows.filter((row) => matchesConfig(row, config))
  const uniqueRows = Array.from(
    new Map(filteredRows.map((row) => [getGrammarQuestionDedupeKey(row), row])).values(),
  )
  const shuffledRows = shuffleArray(uniqueRows)
  const selectedRows = shuffledRows.slice(0, Math.min(config.count, shuffledRows.length))
  const questions = selectedRows
    .map(buildGameQuestion)
    .filter((question): question is GrammarGameQuestion => question !== null)

  return {
    config,
    availableCount: filteredRows.length,
    requestedCount: config.count,
    totalQuestions: questions.length,
    questions,
    availableCategories: Array.from(
      new Set(
        rows
          .map((row) => row.category?.trim() ?? "")
          .filter((category) => category.length > 0),
      ),
    ),
  }
}

export async function getGrammarQuestionForGrading(questionId: number) {
  const rows = await db
    .select({
      id: schema.grammarQuestions.id,
      answers: schema.grammarQuestions.answers,
      distractors: schema.grammarQuestions.distractors,
      sentenceTemplate: schema.grammarQuestions.sentenceTemplate,
      status: schema.grammarQuestions.status,
    })
    .from(schema.grammarQuestions)
    .where(eq(schema.grammarQuestions.id, questionId))
    .limit(1)

  const question = rows[0]

  if (!question || question.status !== "published") {
    return null
  }

  const template = parseGrammarSentenceTemplate(question.sentenceTemplate)

  if (template.errors.length > 0) {
    return null
  }

  return question
}
