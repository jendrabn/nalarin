"use server"

import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"

import { db, schema } from "@/db"
import { requireAdmin } from "@/features/auth/services/session"

import { getExamTypeById, getSubjectById, getTopicById } from "./queries"
import {
  examTypeFormSchema,
  subjectFormSchema,
  topicFormSchema,
  type ExamTypeFormValues,
  type SubjectFormValues,
  type TopicFormValues,
} from "./schemas"
import { normalizeNullableText, slugify } from "./utils"

type ActionError<FormValues> = {
  success: false
  message: string
  fieldErrors?: Partial<Record<keyof FormValues, string[]>>
}

type ActionSuccess<T = unknown> = {
  success: true
  data: T
}

export type TaxonomyActionResult<FormValues, T = unknown> =
  | ActionError<FormValues>
  | ActionSuccess<T>

function flattenZodError<FormValues>(error: z.ZodError<FormValues>) {
  return error.flatten().fieldErrors as Partial<Record<keyof FormValues, string[]>>
}

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

function parseTopicValues(values: TopicFormValues) {
  const validated = topicFormSchema.safeParse(values)

  if (!validated.success) {
    return {
      success: false as const,
      message: "Please fix the highlighted fields.",
      fieldErrors: flattenZodError(validated.error),
    }
  }

  const subjectId = Number(validated.data.subjectId)

  if (!Number.isInteger(subjectId) || subjectId <= 0) {
    return {
      success: false as const,
      message: "Please fix the highlighted fields.",
      fieldErrors: {
        subjectId: ["Select a valid subject."],
      },
    }
  }

  return {
    success: true as const,
    data: {
      subjectId,
      name: validated.data.name.trim(),
      description: normalizeNullableText(validated.data.description),
    },
  }
}

function isDuplicateEntryError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "ER_DUP_ENTRY"
  )
}

function revalidateTaxonomyRoutes() {
  revalidatePath("/admin/exam-types")
  revalidatePath("/admin/subjects")
  revalidatePath("/admin/subjects/create")
  revalidatePath("/admin/topics")
  revalidatePath("/admin/topics/create")
  revalidatePath("/admin/questions")
  revalidatePath("/admin/questions/create")
  revalidatePath("/admin/questions/ai-generate")
}

async function buildUniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>,
) {
  let slug = base
  let suffix = 2

  while (await exists(slug)) {
    slug = `${base}-${suffix}`
    suffix += 1
  }

  return slug
}

async function examTypeSlugExists(slug: string, excludedId?: number) {
  const row = await db.query.examTypes.findFirst({
    where: eq(schema.examTypes.slug, slug),
    columns: { id: true },
  })

  return Boolean(row && (excludedId === undefined || row.id !== excludedId))
}

async function subjectSlugExists(examTypeId: number, slug: string, excludedId?: number) {
  const row = await db.query.subjects.findFirst({
    where: and(eq(schema.subjects.examTypeId, examTypeId), eq(schema.subjects.slug, slug)),
    columns: { id: true },
  })

  return Boolean(row && (excludedId === undefined || row.id !== excludedId))
}

async function topicSlugExists(subjectId: number, slug: string, excludedId?: number) {
  const row = await db.query.topics.findFirst({
    where: and(eq(schema.topics.subjectId, subjectId), eq(schema.topics.slug, slug)),
    columns: { id: true },
  })

  return Boolean(row && (excludedId === undefined || row.id !== excludedId))
}

export async function updateExamTypeAction(
  examTypeId: number,
  values: ExamTypeFormValues,
): Promise<TaxonomyActionResult<ExamTypeFormValues, { id: number }>> {
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

    revalidateTaxonomyRoutes()

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

export async function createSubjectAction(
  values: SubjectFormValues,
): Promise<TaxonomyActionResult<SubjectFormValues, { id: number }>> {
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

    revalidateTaxonomyRoutes()

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
): Promise<TaxonomyActionResult<SubjectFormValues, { id: number }>> {
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

    revalidateTaxonomyRoutes()

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
): Promise<TaxonomyActionResult<SubjectFormValues, { id: number }>> {
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

  revalidateTaxonomyRoutes()

  return {
    success: true,
    data: { id: subjectId },
  }
}

export async function createTopicAction(
  values: TopicFormValues,
): Promise<TaxonomyActionResult<TopicFormValues, { id: number }>> {
  await requireAdmin()

  const parsed = parseTopicValues(values)

  if (!parsed.success) {
    return parsed
  }

  const subject = await getSubjectById(parsed.data.subjectId)

  if (!subject) {
    return {
      success: false,
      message: "Selected subject not found.",
      fieldErrors: {
        subjectId: ["The selected subject does not exist."],
      },
    }
  }

  const slug = await buildUniqueSlug(slugify(parsed.data.name), async (candidate) =>
    topicSlugExists(parsed.data.subjectId, candidate),
  )

  try {
    const [created] = await db
      .insert(schema.topics)
      .values({
        subjectId: parsed.data.subjectId,
        name: parsed.data.name,
        slug,
        description: parsed.data.description,
      })
      .$returningId()

    revalidateTaxonomyRoutes()

    return {
      success: true,
      data: { id: created.id },
    }
  } catch (error) {
    return {
      success: false,
      message:
        isDuplicateEntryError(error)
          ? "Another topic already uses the same slug in this subject."
          : "Failed to create the topic.",
    }
  }
}

export async function updateTopicAction(
  topicId: number,
  values: TopicFormValues,
): Promise<TaxonomyActionResult<TopicFormValues, { id: number }>> {
  await requireAdmin()

  const parsed = parseTopicValues(values)

  if (!parsed.success) {
    return parsed
  }

  const existingTopic = await getTopicById(topicId)

  if (!existingTopic) {
    return {
      success: false,
      message: "Topic not found.",
    }
  }

  const subject = await getSubjectById(parsed.data.subjectId)

  if (!subject) {
    return {
      success: false,
      message: "Selected subject not found.",
      fieldErrors: {
        subjectId: ["The selected subject does not exist."],
      },
    }
  }

  const slug = await buildUniqueSlug(slugify(parsed.data.name), async (candidate) =>
    topicSlugExists(parsed.data.subjectId, candidate, topicId),
  )

  try {
    await db
      .update(schema.topics)
      .set({
        subjectId: parsed.data.subjectId,
        name: parsed.data.name,
        slug,
        description: parsed.data.description,
      })
      .where(eq(schema.topics.id, topicId))

    revalidateTaxonomyRoutes()

    return {
      success: true,
      data: { id: topicId },
    }
  } catch (error) {
    return {
      success: false,
      message:
        isDuplicateEntryError(error)
          ? "Another topic already uses the same slug in this subject."
          : "Failed to update the topic.",
    }
  }
}

export async function deleteTopicAction(
  topicId: number,
): Promise<TaxonomyActionResult<TopicFormValues, { id: number }>> {
  await requireAdmin()

  const existingTopic = await getTopicById(topicId)

  if (!existingTopic) {
    return {
      success: false,
      message: "Topic not found.",
    }
  }

  const [questionUsage, practiceUsage] = await Promise.all([
    db.query.questions.findFirst({
      where: eq(schema.questions.topicId, topicId),
      columns: { id: true },
    }),
    db.query.practices.findFirst({
      where: eq(schema.practices.topicId, topicId),
      columns: { id: true },
    }),
  ])

  if (questionUsage || practiceUsage) {
    return {
      success: false,
      message: "This topic cannot be deleted because it is still used by questions or practices.",
    }
  }

  await db.delete(schema.topics).where(eq(schema.topics.id, topicId))

  revalidateTaxonomyRoutes()

  return {
    success: true,
    data: { id: topicId },
  }
}

