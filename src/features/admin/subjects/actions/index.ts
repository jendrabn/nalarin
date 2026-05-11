"use server"

import { and, eq } from "drizzle-orm"
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

import { getExamTypeById } from "../../exam-types/queries"
import { getSubjectById } from "../queries"
import { subjectFormSchema, type SubjectFormValues } from "../schemas"

function parseSubjectValues(values: SubjectFormValues) {
  const validated = subjectFormSchema.safeParse(values)

  if (!validated.success) {
    return {
      success: false as const,
      message: "Please fix the highlighted fields.",
      fieldErrors: flattenZodError(validated.error),
    }
  }

  const examTypeId = Number(validated.data.examTypeId)

  if (!Number.isInteger(examTypeId) || examTypeId <= 0) {
    return {
      success: false as const,
      message: "Please fix the highlighted fields.",
      fieldErrors: {
        examTypeId: ["Select a valid exam type."],
      },
    }
  }

  return {
    success: true as const,
    data: {
      examTypeId,
      name: validated.data.name.trim(),
      description: normalizeNullableText(validated.data.description),
    },
  }
}

function revalidateSubjectRoutes() {
  revalidatePath("/admin/exam-types")
  revalidatePath("/admin/subjects")
  revalidatePath("/admin/subjects/create")
  revalidatePath("/admin/topics")
  revalidatePath("/admin/topics/create")
  revalidatePath("/admin/questions")
  revalidatePath("/admin/questions/create")
  revalidatePath("/admin/questions/ai-generate")
}

async function subjectSlugExists(examTypeId: number, slug: string, excludedId?: number) {
  const row = await db.query.subjects.findFirst({
    where: and(eq(schema.subjects.examTypeId, examTypeId), eq(schema.subjects.slug, slug)),
    columns: { id: true },
  })

  return Boolean(row && (excludedId === undefined || row.id !== excludedId))
}

export type SubjectActionResult<FormValues, T = unknown> = ActionResult<FormValues, T>

export async function createSubjectAction(
  values: SubjectFormValues,
): Promise<SubjectActionResult<SubjectFormValues, { id: number }>> {
  await requireAdmin()

  const parsed = parseSubjectValues(values)

  if (!parsed.success) {
    return parsed
  }

  const examType = await getExamTypeById(parsed.data.examTypeId)

  if (!examType) {
    return {
      success: false,
      message: "Selected exam type not found.",
      fieldErrors: {
        examTypeId: ["The selected exam type does not exist."],
      },
    }
  }

  const slug = await buildUniqueSlug(slugify(parsed.data.name), async (candidate) =>
    subjectSlugExists(parsed.data.examTypeId, candidate),
  )

  try {
    const [created] = await db
      .insert(schema.subjects)
      .values({
        examTypeId: parsed.data.examTypeId,
        name: parsed.data.name,
        slug,
        description: parsed.data.description,
      })
      .$returningId()

    revalidateSubjectRoutes()

    return {
      success: true,
      data: { id: created.id },
    }
  } catch (error) {
    return {
      success: false,
      message:
        isDuplicateEntryError(error)
          ? "Another subject already uses the same slug in this exam type."
          : "Failed to create the subject.",
    }
  }
}

export async function updateSubjectAction(
  subjectId: number,
  values: SubjectFormValues,
): Promise<SubjectActionResult<SubjectFormValues, { id: number }>> {
  await requireAdmin()

  const parsed = parseSubjectValues(values)

  if (!parsed.success) {
    return parsed
  }

  const existingSubject = await getSubjectById(subjectId)

  if (!existingSubject) {
    return {
      success: false,
      message: "Subject not found.",
    }
  }

  const examType = await getExamTypeById(parsed.data.examTypeId)

  if (!examType) {
    return {
      success: false,
      message: "Selected exam type not found.",
      fieldErrors: {
        examTypeId: ["The selected exam type does not exist."],
      },
    }
  }

  const slug = await buildUniqueSlug(slugify(parsed.data.name), async (candidate) =>
    subjectSlugExists(parsed.data.examTypeId, candidate, subjectId),
  )

  try {
    await db
      .update(schema.subjects)
      .set({
        examTypeId: parsed.data.examTypeId,
        name: parsed.data.name,
        slug,
        description: parsed.data.description,
      })
      .where(eq(schema.subjects.id, subjectId))

    revalidateSubjectRoutes()
    revalidatePath(`/admin/subjects/${subjectId}/edit`)

    return {
      success: true,
      data: { id: subjectId },
    }
  } catch (error) {
    return {
      success: false,
      message:
        isDuplicateEntryError(error)
          ? "Another subject already uses the same slug in this exam type."
          : "Failed to update the subject.",
    }
  }
}

export async function deleteSubjectAction(
  subjectId: number,
): Promise<SubjectActionResult<SubjectFormValues, { id: number }>> {
  await requireAdmin()

  const existingSubject = await getSubjectById(subjectId)

  if (!existingSubject) {
    return {
      success: false,
      message: "Subject not found.",
    }
  }

  const [topicUsage, questionUsage, practiceUsage, tryoutSectionUsage] = await Promise.all([
    db.query.topics.findFirst({
      where: eq(schema.topics.subjectId, subjectId),
      columns: { id: true },
    }),
    db.query.questions.findFirst({
      where: eq(schema.questions.subjectId, subjectId),
      columns: { id: true },
    }),
    db.query.practices.findFirst({
      where: eq(schema.practices.subjectId, subjectId),
      columns: { id: true },
    }),
    db.query.tryoutSections.findFirst({
      where: eq(schema.tryoutSections.subjectId, subjectId),
      columns: { id: true },
    }),
  ])

  if (topicUsage || questionUsage || practiceUsage || tryoutSectionUsage) {
    return {
      success: false,
      message: "This subject cannot be deleted because it is still used by topics, questions, practices, or tryout sections.",
    }
  }

  await db.delete(schema.subjects).where(eq(schema.subjects.id, subjectId))

  revalidateSubjectRoutes()
  revalidatePath(`/admin/subjects/${subjectId}/edit`)

  return {
    success: true,
    data: { id: subjectId },
  }
}
