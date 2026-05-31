import "server-only"

import { desc, eq } from "drizzle-orm"

import { db, schema } from "@/db"

import { getGrammarQuestionBlankCount } from "../utils/grammar-question"

export type GrammarQuestionRow = {
  id: number
  sentenceTemplate: string
  language: (typeof schema.vocabularyLanguageValues)[number]
  difficulty: (typeof schema.questionDifficultyValues)[number]
  category: string | null
  blankCount: number
  answers: { order: number; answer: string }[]
  distractors: string[]
  status: (typeof schema.contentStatusValues)[number]
  createdBy: number | null
  createdByName: string | null
  createdAt: Date
  updatedAt: Date
}

export type GrammarQuestionDetails = GrammarQuestionRow

function selectGrammarQuestionColumns() {
  return {
    id: schema.grammarQuestions.id,
    sentenceTemplate: schema.grammarQuestions.sentenceTemplate,
    language: schema.grammarQuestions.language,
    difficulty: schema.grammarQuestions.difficulty,
    category: schema.grammarQuestions.category,
    answers: schema.grammarQuestions.answers,
    distractors: schema.grammarQuestions.distractors,
    status: schema.grammarQuestions.status,
    createdBy: schema.grammarQuestions.createdBy,
    createdByName: schema.users.name,
    createdAt: schema.grammarQuestions.createdAt,
    updatedAt: schema.grammarQuestions.updatedAt,
  } as const
}

function normalizeGrammarQuestionRow(row: {
  id: number
  sentenceTemplate: string
  language: (typeof schema.vocabularyLanguageValues)[number]
  difficulty: (typeof schema.questionDifficultyValues)[number]
  category: string | null
  answers: { order: number; answer: string }[] | null
  distractors: string[] | null
  status: (typeof schema.contentStatusValues)[number]
  createdBy: number | null
  createdByName: string | null
  createdAt: Date
  updatedAt: Date
}): GrammarQuestionRow {
  return {
    ...row,
    blankCount: getGrammarQuestionBlankCount(row.sentenceTemplate),
    answers: row.answers ?? [],
    distractors: row.distractors ?? [],
    createdBy: row.createdBy ?? null,
    createdByName: row.createdByName ?? null,
    category: row.category ?? null,
  }
}

export async function getGrammarQuestions() {
  const rows = await db
    .select(selectGrammarQuestionColumns())
    .from(schema.grammarQuestions)
    .leftJoin(schema.users, eq(schema.grammarQuestions.createdBy, schema.users.id))
    .orderBy(desc(schema.grammarQuestions.createdAt))

  return rows.map(normalizeGrammarQuestionRow)
}

export async function getGrammarQuestionById(id: number) {
  const rows = await db
    .select(selectGrammarQuestionColumns())
    .from(schema.grammarQuestions)
    .leftJoin(schema.users, eq(schema.grammarQuestions.createdBy, schema.users.id))
    .where(eq(schema.grammarQuestions.id, id))
    .limit(1)

  const question = rows[0]

  return question ? normalizeGrammarQuestionRow(question) : null
}

