"use server"

import "server-only"

import { desc, eq } from "drizzle-orm"

import { db, schema } from "@/db"

export type VocabularyRow = {
  id: number
  word: string
  language: (typeof schema.vocabularyLanguageValues)[number]
  difficulty: (typeof schema.questionDifficultyValues)[number]
  type: (typeof schema.vocabularyTypeValues)[number]
  correctMeaning: string
  wrongOption: string
  exampleSentence: string | null
  status: (typeof schema.contentStatusValues)[number]
  createdBy: number | null
  createdByName: string | null
  createdAt: Date
  updatedAt: Date
}

export type VocabularyDetails = VocabularyRow

function selectVocabularyColumns() {
  return {
    id: schema.vocabularies.id,
    word: schema.vocabularies.word,
    language: schema.vocabularies.language,
    difficulty: schema.vocabularies.difficulty,
    type: schema.vocabularies.type,
    correctMeaning: schema.vocabularies.correctMeaning,
    wrongOption: schema.vocabularies.wrongOption,
    exampleSentence: schema.vocabularies.exampleSentence,
    status: schema.vocabularies.status,
    createdBy: schema.vocabularies.createdBy,
    createdByName: schema.users.name,
    createdAt: schema.vocabularies.createdAt,
    updatedAt: schema.vocabularies.updatedAt,
  } as const
}

function normalizeVocabularyRow(row: {
  id: number
  word: string
  language: (typeof schema.vocabularyLanguageValues)[number]
  difficulty: (typeof schema.questionDifficultyValues)[number]
  type: (typeof schema.vocabularyTypeValues)[number]
  correctMeaning: string
  wrongOption: string | null
  exampleSentence: string | null
  status: (typeof schema.contentStatusValues)[number]
  createdBy: number | null
  createdByName: string | null
  createdAt: Date
  updatedAt: Date
}): VocabularyRow {
  return {
    ...row,
    wrongOption: row.wrongOption ?? "",
    exampleSentence: row.exampleSentence ?? null,
    createdBy: row.createdBy ?? null,
    createdByName: row.createdByName ?? null,
  }
}

export async function getVocabularies() {
  const rows = await db
    .select(selectVocabularyColumns())
    .from(schema.vocabularies)
    .leftJoin(schema.users, eq(schema.vocabularies.createdBy, schema.users.id))
    .orderBy(desc(schema.vocabularies.createdAt))

  return rows.map(normalizeVocabularyRow)
}

export async function getVocabularyById(id: number) {
  const rows = await db
    .select(selectVocabularyColumns())
    .from(schema.vocabularies)
    .leftJoin(schema.users, eq(schema.vocabularies.createdBy, schema.users.id))
    .where(eq(schema.vocabularies.id, id))
    .limit(1)

  const vocabulary = rows[0]

  return vocabulary ? normalizeVocabularyRow(vocabulary) : null
}
