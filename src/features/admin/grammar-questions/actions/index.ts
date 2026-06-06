"use server"

import { eq, inArray } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"

import { db, schema } from "@/db"
import { requireAdmin } from "@/features/auth/services/session"
import { flattenZodError } from "@/lib/actions"

import {
  grammarQuestionFormSchema,
  type GrammarQuestionFormValues,
  grammarQuestionImportRowSchema,
  type GrammarQuestionImportRowValues,
} from "../schemas"
import {
  buildGrammarQuestionAnswers,
  buildGrammarQuestionDistractors,
  normalizeGrammarNullableText,
} from "../utils/grammar-question"
import { extractGrammarPlaceholderOrders } from "@/features/grammar-game/utils"
import { getGrammarQuestionById } from "../queries"

type GrammarQuestionActionError = {
  success: false
  message: string
  fieldErrors?: Partial<Record<keyof GrammarQuestionFormValues, string[]>>
}

type GrammarQuestionActionSuccess<T = unknown> = {
  success: true
  data: T
}

export type GrammarQuestionActionResult<T = unknown> =
  | GrammarQuestionActionError
  | GrammarQuestionActionSuccess<T>

function flattenGrammarQuestionZodError(error: z.ZodError<GrammarQuestionFormValues>) {
  return flattenZodError(error)
}

function parseGrammarQuestionValues(values: GrammarQuestionFormValues) {
  const validated = grammarQuestionFormSchema.safeParse(values)

  if (!validated.success) {
    return {
      success: false as const,
      message: "Please fix the highlighted fields.",
      fieldErrors: flattenGrammarQuestionZodError(validated.error),
    }
  }

  const placeholderOrders = extractGrammarPlaceholderOrders(validated.data.sentenceTemplate)

  return {
    success: true as const,
    data: {
      sentenceTemplate: validated.data.sentenceTemplate.trim(),
      language: validated.data.language,
      difficulty: validated.data.difficulty,
      category: normalizeGrammarNullableText(validated.data.category),
      answers: buildGrammarQuestionAnswers(placeholderOrders, validated.data),
      distractors: buildGrammarQuestionDistractors(validated.data),
      status: validated.data.status,
    },
  }
}

function revalidateGrammarRoutes(questionId?: number) {
  revalidatePath("/admin/grammar")
  revalidatePath("/admin/grammar/create")
  revalidatePath("/admin/grammar/import")
  revalidatePath("/admin/grammar/import/preview")
  revalidatePath("/grammar")
  revalidatePath("/grammar/play")

  if (questionId) {
    revalidatePath(`/admin/grammar/${questionId}`)
    revalidatePath(`/admin/grammar/${questionId}/edit`)
  }
}

export async function createGrammarQuestionAction(
  values: GrammarQuestionFormValues,
): Promise<GrammarQuestionActionResult<{ id: number }>> {
  await requireAdmin()
  const parsed = parseGrammarQuestionValues(values)

  if (!parsed.success) {
    return parsed
  }

  try {
    const [created] = await db
      .insert(schema.grammarQuestions)
      .values({
        language: parsed.data.language,
        difficulty: parsed.data.difficulty,
        category: parsed.data.category,
        sentenceTemplate: parsed.data.sentenceTemplate,
        answers: parsed.data.answers,
        distractors: parsed.data.distractors,
        status: parsed.data.status,
      })
      .$returningId()

    revalidateGrammarRoutes(created.id)

    return {
      success: true,
      data: { id: created.id },
    }
  } catch {
    return {
      success: false,
      message: "Failed to create the grammar question.",
    }
  }
}

export async function updateGrammarQuestionAction(
  questionId: number,
  values: GrammarQuestionFormValues,
): Promise<GrammarQuestionActionResult<{ id: number }>> {
  await requireAdmin()

  const existingQuestion = await getGrammarQuestionById(questionId)

  if (!existingQuestion) {
    return {
      success: false,
      message: "Grammar question not found.",
    }
  }

  const parsed = parseGrammarQuestionValues(values)

  if (!parsed.success) {
    return parsed
  }

  try {
    await db
      .update(schema.grammarQuestions)
      .set({
        language: parsed.data.language,
        difficulty: parsed.data.difficulty,
        category: parsed.data.category,
        sentenceTemplate: parsed.data.sentenceTemplate,
        answers: parsed.data.answers,
        distractors: parsed.data.distractors,
        status: parsed.data.status,
      })
      .where(eq(schema.grammarQuestions.id, questionId))

    revalidateGrammarRoutes(questionId)

    return {
      success: true,
      data: { id: questionId },
    }
  } catch {
    return {
      success: false,
      message: "Failed to update the grammar question.",
    }
  }
}

export async function deleteGrammarQuestionAction(
  questionId: number,
): Promise<GrammarQuestionActionResult<{ id: number }>> {
  await requireAdmin()

  const existingQuestion = await getGrammarQuestionById(questionId)

  if (!existingQuestion) {
    return {
      success: false,
      message: "Grammar question not found.",
    }
  }

  await db.delete(schema.grammarQuestions).where(eq(schema.grammarQuestions.id, questionId))

  revalidateGrammarRoutes(questionId)

  return {
    success: true,
    data: { id: questionId },
  }
}

export async function deleteGrammarQuestionsAction(
  questionIds: number[],
): Promise<GrammarQuestionActionResult<{ deletedCount: number }>> {
  await requireAdmin()

  const uniqueQuestionIds = [...new Set(questionIds)].filter(
    (id) => Number.isInteger(id) && id > 0,
  )

  if (uniqueQuestionIds.length === 0) {
    return {
      success: false,
      message: "No grammar questions were selected.",
    }
  }

  const existingQuestions = await db
    .select({
      id: schema.grammarQuestions.id,
    })
    .from(schema.grammarQuestions)
    .where(inArray(schema.grammarQuestions.id, uniqueQuestionIds))

  if (existingQuestions.length !== uniqueQuestionIds.length) {
    return {
      success: false,
      message: "One or more selected grammar questions could not be found.",
    }
  }

  await db.delete(schema.grammarQuestions).where(inArray(schema.grammarQuestions.id, uniqueQuestionIds))

  revalidateGrammarRoutes()

  return {
    success: true,
    data: { deletedCount: uniqueQuestionIds.length },
  }
}

type ImportGrammarQuestionActionError = {
  success: false
  message: string
}

type ImportGrammarQuestionActionSuccess = {
  success: true
  message: string
  data: {
    importedCount: number
  }
}

type ImportGrammarQuestionActionResult =
  | ImportGrammarQuestionActionError
  | ImportGrammarQuestionActionSuccess

function parseGrammarQuestionImportRow(values: GrammarQuestionImportRowValues) {
  const validated = grammarQuestionImportRowSchema.safeParse(values)

  if (!validated.success) {
    return null
  }

  const placeholderOrders = extractGrammarPlaceholderOrders(validated.data.sentenceTemplate)

  return {
    success: true as const,
    data: {
      sentenceTemplate: validated.data.sentenceTemplate.trim(),
      language: validated.data.language,
      difficulty: validated.data.difficulty,
      category: normalizeGrammarNullableText(validated.data.category),
      answers: buildGrammarQuestionAnswers(placeholderOrders, validated.data),
      distractors: buildGrammarQuestionDistractors(validated.data),
      status: validated.data.status,
    },
  }
}

export async function importGrammarQuestionRowsAction(
  rows: GrammarQuestionImportRowValues[],
): Promise<ImportGrammarQuestionActionResult> {
  await requireAdmin()

  if (rows.length === 0) {
    return {
      success: false,
      message: "No valid rows to import.",
    }
  }

  const parsedRows = rows
    .map((row) => parseGrammarQuestionImportRow(row))
    .filter((row): row is NonNullable<ReturnType<typeof parseGrammarQuestionImportRow>> => row !== null)

  if (parsedRows.length !== rows.length) {
    return {
      success: false,
      message: "One or more rows are invalid.",
    }
  }

  try {
    await db.insert(schema.grammarQuestions).values(
      parsedRows.map((row) => ({
        language: row.data.language,
        difficulty: row.data.difficulty,
        category: row.data.category,
        sentenceTemplate: row.data.sentenceTemplate,
        answers: row.data.answers,
        distractors: row.data.distractors,
        status: row.data.status,
      })),
    )

    revalidateGrammarRoutes()

    return {
      success: true,
      message: "Grammar questions imported.",
      data: {
        importedCount: rows.length,
      },
    }
  } catch {
    return {
      success: false,
      message: "Failed to import grammar questions.",
    }
  }
}
