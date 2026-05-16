"use server"

import { and, eq, inArray } from "drizzle-orm"
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
      logoUrl: normalizeNullableText(validated.data.logoUrl),
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
        logoUrl: parsed.data.logoUrl,
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
        logoUrl: parsed.data.logoUrl,
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

export async function deleteSubjectsAction(
  subjectIds: number[],
): Promise<ActionResult<unknown, { deletedCount: number }>> {
  await requireAdmin()

  const uniqueSubjectIds = [...new Set(subjectIds)].filter(
    (id) => Number.isInteger(id) && id > 0,
  )

  if (uniqueSubjectIds.length === 0) {
    return {
      success: false,
      message: "No subjects were selected.",
    }
  }

  const [existingSubjects, topicUsageRows, questionUsageRows, practiceUsageRows, tryoutSectionUsageRows] =
    await Promise.all([
      db
        .select({
          id: schema.subjects.id,
        })
        .from(schema.subjects)
        .where(inArray(schema.subjects.id, uniqueSubjectIds)),
      db
        .select({
          subjectId: schema.topics.subjectId,
        })
        .from(schema.topics)
        .where(inArray(schema.topics.subjectId, uniqueSubjectIds))
        .groupBy(schema.topics.subjectId),
      db
        .select({
          subjectId: schema.questions.subjectId,
        })
        .from(schema.questions)
        .where(inArray(schema.questions.subjectId, uniqueSubjectIds))
        .groupBy(schema.questions.subjectId),
      db
        .select({
          subjectId: schema.practices.subjectId,
        })
        .from(schema.practices)
        .where(inArray(schema.practices.subjectId, uniqueSubjectIds))
        .groupBy(schema.practices.subjectId),
      db
        .select({
          subjectId: schema.tryoutSections.subjectId,
        })
        .from(schema.tryoutSections)
        .where(inArray(schema.tryoutSections.subjectId, uniqueSubjectIds))
        .groupBy(schema.tryoutSections.subjectId),
    ])

  if (existingSubjects.length !== uniqueSubjectIds.length) {
    return {
      success: false,
      message: "Some selected subjects were not found.",
    }
  }

  if (
    topicUsageRows.length > 0 ||
    questionUsageRows.length > 0 ||
    practiceUsageRows.length > 0 ||
    tryoutSectionUsageRows.length > 0
  ) {
    return {
      success: false,
      message:
        "One or more selected subjects cannot be deleted because they are still used by topics, questions, practices, or tryout sections.",
    }
  }

  await db.delete(schema.subjects).where(inArray(schema.subjects.id, uniqueSubjectIds))

  revalidateSubjectRoutes()
  uniqueSubjectIds.forEach((subjectId) => {
    revalidatePath(`/admin/subjects/${subjectId}/edit`)
  })

  return {
    success: true,
    data: { deletedCount: uniqueSubjectIds.length },
  }
}
