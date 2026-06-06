"use server"

import { eq, inArray } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"

import { db, schema } from "@/db"
import { requireAdmin } from "@/features/auth/services/session"
import { flattenZodError } from "@/lib/actions"

import type { VocabularyImportRowValues } from "../schemas"
import { vocabularyFormSchema, type VocabularyFormValues } from "../schemas"
import {
  normalizeVocabularyWrongOption,
  normalizeNullableText,
} from "../utils/vocabulary"
import { getVocabularyById } from "../queries"

type VocabularyActionError = {
  success: false
  message: string
  fieldErrors?: Partial<Record<keyof VocabularyFormValues, string[]>>
}

type VocabularyActionSuccess<T = unknown> = {
  success: true
  data: T
}

export type VocabularyActionResult<T = unknown> =
  | VocabularyActionError
  | VocabularyActionSuccess<T>

function flattenVocabularyZodError(error: z.ZodError<VocabularyFormValues>) {
  return flattenZodError(error)
}

function parseVocabularyValues(values: VocabularyFormValues) {
  const validated = vocabularyFormSchema.safeParse(values)

  if (!validated.success) {
    return {
      success: false as const,
      message: "Please fix the highlighted fields.",
      fieldErrors: flattenVocabularyZodError(validated.error),
    }
  }

  const wrongOption = normalizeVocabularyWrongOption(validated.data.wrongOption)

  if (wrongOption.length < 1) {
    return {
      success: false as const,
      message: "Please provide at least one wrong option.",
      fieldErrors: {
        wrongOption: ["Provide a wrong option."],
      },
    }
  }

  return {
    success: true as const,
    data: {
      word: validated.data.word.trim(),
      language: validated.data.language,
      difficulty: validated.data.difficulty,
      type: validated.data.type,
      correctMeaning: validated.data.correctMeaning.trim(),
      wrongOption,
      exampleSentence: normalizeNullableText(validated.data.exampleSentence),
      status: validated.data.status,
    },
  }
}

function revalidateVocabularyRoutes(vocabularyId?: number) {
  revalidatePath("/admin/vocabularies")
  revalidatePath("/admin/vocabularies/create")
  revalidatePath("/admin/vocabularies/import")
  revalidatePath("/admin/vocabularies/import/preview")

  if (vocabularyId) {
    revalidatePath(`/admin/vocabularies/${vocabularyId}`)
    revalidatePath(`/admin/vocabularies/${vocabularyId}/edit`)
  }
}

export async function createVocabularyAction(
  values: VocabularyFormValues,
): Promise<VocabularyActionResult<{ id: number }>> {
  await requireAdmin()
  const parsed = parseVocabularyValues(values)

  if (!parsed.success) {
    return parsed
  }

  try {
    const [created] = await db
      .insert(schema.vocabularies)
      .values({
        word: parsed.data.word,
        language: parsed.data.language,
        difficulty: parsed.data.difficulty,
        type: parsed.data.type,
        correctMeaning: parsed.data.correctMeaning,
        wrongOption: parsed.data.wrongOption,
        exampleSentence: parsed.data.exampleSentence,
        status: parsed.data.status,
      })
      .$returningId()

    revalidateVocabularyRoutes(created.id)

    return {
      success: true,
      data: { id: created.id },
    }
  } catch (error) {
    console.error("Failed to create vocabulary:", error)

    return {
      success: false,
      message: "Failed to create the vocabulary.",
    }
  }
}

export async function updateVocabularyAction(
  vocabularyId: number,
  values: VocabularyFormValues,
): Promise<VocabularyActionResult<{ id: number }>> {
  await requireAdmin()

  const existingVocabulary = await getVocabularyById(vocabularyId)

  if (!existingVocabulary) {
    return {
      success: false,
      message: "Vocabulary not found.",
    }
  }

  const parsed = parseVocabularyValues(values)

  if (!parsed.success) {
    return parsed
  }

  try {
    await db
      .update(schema.vocabularies)
      .set({
        word: parsed.data.word,
        language: parsed.data.language,
        difficulty: parsed.data.difficulty,
        type: parsed.data.type,
        correctMeaning: parsed.data.correctMeaning,
        wrongOption: parsed.data.wrongOption,
        exampleSentence: parsed.data.exampleSentence,
        status: parsed.data.status,
      })
      .where(eq(schema.vocabularies.id, vocabularyId))

    revalidateVocabularyRoutes(vocabularyId)

    return {
      success: true,
      data: { id: vocabularyId },
    }
  } catch (error) {
    console.error("Failed to update vocabulary:", error)

    return {
      success: false,
      message: "Failed to update the vocabulary.",
    }
  }
}

export async function deleteVocabularyAction(
  vocabularyId: number,
): Promise<VocabularyActionResult<{ id: number }>> {
  await requireAdmin()

  const existingVocabulary = await getVocabularyById(vocabularyId)

  if (!existingVocabulary) {
    return {
      success: false,
      message: "Vocabulary not found.",
    }
  }

  await db.delete(schema.vocabularies).where(eq(schema.vocabularies.id, vocabularyId))

  revalidateVocabularyRoutes(vocabularyId)

  return {
    success: true,
    data: { id: vocabularyId },
  }
}

export async function deleteVocabulariesAction(
  vocabularyIds: number[],
): Promise<VocabularyActionResult<{ deletedCount: number }>> {
  await requireAdmin()

  const uniqueVocabularyIds = [...new Set(vocabularyIds)].filter(
    (id) => Number.isInteger(id) && id > 0,
  )

  if (uniqueVocabularyIds.length === 0) {
    return {
      success: false,
      message: "No vocabularies were selected.",
    }
  }

  const existingVocabularies = await db
    .select({
      id: schema.vocabularies.id,
    })
    .from(schema.vocabularies)
    .where(inArray(schema.vocabularies.id, uniqueVocabularyIds))

  if (existingVocabularies.length !== uniqueVocabularyIds.length) {
    return {
      success: false,
      message: "One or more selected vocabularies could not be found.",
    }
  }

  await db.delete(schema.vocabularies).where(inArray(schema.vocabularies.id, uniqueVocabularyIds))

  revalidateVocabularyRoutes()

  return {
    success: true,
    data: { deletedCount: uniqueVocabularyIds.length },
  }
}

type ImportVocabularyActionError = {
  success: false
  message: string
}

type ImportVocabularyActionSuccess = {
  success: true
  message: string
  data: {
    importedCount: number
  }
}

type ImportVocabularyActionResult =
  | ImportVocabularyActionError
  | ImportVocabularyActionSuccess

export async function importVocabularyRowsAction(
  rows: VocabularyImportRowValues[],
): Promise<ImportVocabularyActionResult> {
  await requireAdmin()

  if (rows.length === 0) {
    return {
      success: false,
      message: "No valid rows to import.",
    }
  }

  try {
    await db.insert(schema.vocabularies).values(
      rows.map((row) => ({
        word: row.word.trim(),
        language: row.language,
        difficulty: row.difficulty,
        type: row.type,
        correctMeaning: row.correctMeaning.trim(),
        wrongOption: normalizeVocabularyWrongOption(row.wrongOption),
        exampleSentence: normalizeNullableText(row.exampleSentence),
        status: row.status,
      })),
    )

    revalidateVocabularyRoutes()

    return {
      success: true,
      message: "Vocabulary imported.",
      data: {
        importedCount: rows.length,
      },
    }
  } catch (error) {
    console.error("Failed to import vocabularies:", error)

    return {
      success: false,
      message: "Failed to import vocabularies.",
    }
  }
}
