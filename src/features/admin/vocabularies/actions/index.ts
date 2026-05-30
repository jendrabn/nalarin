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
  buildVocabularyWrongOptions,
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

  const wrongOptions = buildVocabularyWrongOptions({
    wrongOption1: validated.data.wrongOption1,
    wrongOption2: validated.data.wrongOption2,
    wrongOption3: validated.data.wrongOption3,
  })

  if (wrongOptions.length < 1) {
    return {
      success: false as const,
      message: "Please provide at least one wrong option.",
      fieldErrors: {
        wrongOption1: ["Provide at least one wrong option."],
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
      wrongOptions,
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
  const user = await requireAdmin()
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
        wrongOptions: parsed.data.wrongOptions,
        exampleSentence: parsed.data.exampleSentence,
        status: parsed.data.status,
        createdBy: user.id,
      })
      .$returningId()

    revalidateVocabularyRoutes(created.id)

    return {
      success: true,
      data: { id: created.id },
    }
  } catch {
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
        wrongOptions: parsed.data.wrongOptions,
        exampleSentence: parsed.data.exampleSentence,
        status: parsed.data.status,
      })
      .where(eq(schema.vocabularies.id, vocabularyId))

    revalidateVocabularyRoutes(vocabularyId)

    return {
      success: true,
      data: { id: vocabularyId },
    }
  } catch {
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

  if (existingVocabulary.status !== "draft") {
    return {
      success: false,
      message: "Only draft vocabularies can be deleted.",
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
      status: schema.vocabularies.status,
    })
    .from(schema.vocabularies)
    .where(inArray(schema.vocabularies.id, uniqueVocabularyIds))

  if (
    existingVocabularies.length !== uniqueVocabularyIds.length ||
    existingVocabularies.some((vocabulary) => vocabulary.status !== "draft")
  ) {
    return {
      success: false,
      message: "One or more selected vocabularies cannot be deleted because they are not draft.",
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
  const user = await requireAdmin()

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
        wrongOptions: buildVocabularyWrongOptions({
          wrongOption1: row.wrongOption1,
          wrongOption2: row.wrongOption2,
          wrongOption3: row.wrongOption3,
        }),
        exampleSentence: normalizeNullableText(row.exampleSentence),
        status: row.status,
        createdBy: user.id,
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
  } catch {
    return {
      success: false,
      message: "Failed to import vocabularies.",
    }
  }
}
