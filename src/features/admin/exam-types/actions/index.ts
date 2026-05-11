"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

import { db, schema } from "@/db"
import { requireAdmin } from "@/features/auth/services/session"
import {
  ActionResult,
  buildUniqueSlug,
  flattenZodError,
  isDuplicateEntryError,
} from "@/lib/actions"
import { normalizeNullableText, slugify } from "@/lib/utils"

import { getExamTypeById } from "../queries"
import { examTypeFormSchema, type ExamTypeFormValues } from "../schemas"

function parseExamTypeValues(values: ExamTypeFormValues) {
  const validated = examTypeFormSchema.safeParse(values)

  if (!validated.success) {
    return {
      success: false as const,
      message: "Please fix the highlighted fields.",
      fieldErrors: flattenZodError(validated.error),
    }
  }

  return {
    success: true as const,
    data: {
      name: validated.data.name.trim(),
      description: normalizeNullableText(validated.data.description),
    },
  }
}

function revalidateExamTypeRoutes() {
  revalidatePath("/admin/exam-types")
  revalidatePath("/admin/subjects")
  revalidatePath("/admin/subjects/create")
  revalidatePath("/admin/topics")
  revalidatePath("/admin/topics/create")
  revalidatePath("/admin/questions")
  revalidatePath("/admin/questions/create")
  revalidatePath("/admin/questions/ai-generate")
}

async function examTypeSlugExists(slug: string, excludedId?: number) {
  const row = await db.query.examTypes.findFirst({
    where: eq(schema.examTypes.slug, slug),
    columns: { id: true },
  })

  return Boolean(row && (excludedId === undefined || row.id !== excludedId))
}

export type ExamTypeActionResult<FormValues, T = unknown> = ActionResult<FormValues, T>

export async function updateExamTypeAction(
  examTypeId: number,
  values: ExamTypeFormValues,
): Promise<ExamTypeActionResult<ExamTypeFormValues, { id: number }>> {
  await requireAdmin()

  const parsed = parseExamTypeValues(values)

  if (!parsed.success) {
    return parsed
  }

  const existingExamType = await getExamTypeById(examTypeId)

  if (!existingExamType) {
    return {
      success: false,
      message: "Exam type not found.",
    }
  }

  const slug = await buildUniqueSlug(slugify(parsed.data.name), async (candidate) =>
    examTypeSlugExists(candidate, examTypeId),
  )

  try {
    await db
      .update(schema.examTypes)
      .set({
        name: parsed.data.name,
        slug,
        description: parsed.data.description,
      })
      .where(eq(schema.examTypes.id, examTypeId))

    revalidateExamTypeRoutes()
    revalidatePath(`/admin/exam-types/${examTypeId}/edit`)

    return {
      success: true,
      data: { id: examTypeId },
    }
  } catch (error) {
    return {
      success: false,
      message:
        isDuplicateEntryError(error)
          ? "Another exam type already uses the same slug."
          : "Failed to update the exam type.",
    }
  }
}
