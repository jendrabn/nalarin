"use server"

import { and, eq, inArray, ne } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"

import { db, schema } from "@/db"
import { requireAdmin } from "@/features/auth/services/session"

import { objectiveQuestionTypes, type ObjectiveQuestionType } from "../constants"
import { getPracticeById } from "../queries"
import { practiceFormSchema, type PracticeFormValues } from "../schemas"
import { slugifyPractice } from "../utils/slug"
import {
  normalizeNullableText,
  parseOptionalInteger,
  parseRequiredDecimal,
  parseRequiredInteger,
} from "../utils/practice"

type ActionError = {
  success: false
  message: string
  fieldErrors?: Partial<Record<keyof PracticeFormValues, string[]>>
}

type ActionSuccess<T = unknown> = {
  success: true
  data: T
}

export type PracticeActionResult<T = unknown> = ActionError | ActionSuccess<T>

function flattenZodError(error: z.ZodError<PracticeFormValues>) {
  return error.flatten().fieldErrors as Partial<
    Record<keyof PracticeFormValues, string[]>
  >
}

function parsePracticeValues(values: PracticeFormValues) {
  const validated = practiceFormSchema.safeParse(values)

  if (!validated.success) {
    return {
      success: false as const,
      message: "Please fix the highlighted fields.",
      fieldErrors: flattenZodError(validated.error),
    }
  }

  const quizDurationMinutes = parseRequiredInteger(validated.data.quizDurationMinutes)

  if (quizDurationMinutes === null) {
    return {
      success: false as const,
      message: "Please fix the highlighted fields.",
      fieldErrors: {
        quizDurationMinutes: ["Quiz duration must be greater than 0."],
      },
    }
  }

  return {
    success: true as const,
    data: {
      examTypeId: Number(validated.data.examTypeId),
      subjectId: Number(validated.data.subjectId),
      topicId: parseOptionalInteger(validated.data.topicId),
      title: validated.data.title.trim(),
      description: normalizeNullableText(validated.data.description),
      isFree: validated.data.isFree,
      hasPracticeMode: true,
      hasQuizMode: true,
      quizDurationMinutes,
      shuffleQuestions: false,
      shuffleOptions: false,
      allowReviewBeforeSubmit: false,
      showResultAfterSubmit: true,
      showExplanationAfterSubmit: true,
      navigationMode: "free" as const,
      questions: validated.data.questions.map((question) => ({
        questionId: Number(question.questionId),
        orderIndex: parseRequiredInteger(question.orderIndex),
        points: parseRequiredDecimal(question.points),
      })),
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

function isObjectiveQuestionType(value: string): value is ObjectiveQuestionType {
  return objectiveQuestionTypes.some((questionType) => questionType === value)
}

function revalidatePracticeRoutes(practiceId?: number, slug?: string, previousSlug?: string) {
  revalidatePath("/admin/practices")
  revalidatePath("/admin/practices/create")
  revalidatePath("/practices")

  if (practiceId) {
    revalidatePath(`/admin/practices/${practiceId}`)
    revalidatePath(`/admin/practices/${practiceId}/edit`)
    revalidatePath(`/admin/practices/${practiceId}/questions`)
  }

  if (slug) {
    revalidatePath(`/practice/${slug}`)
  }

  if (previousSlug && previousSlug !== slug) {
    revalidatePath(`/practice/${previousSlug}`)
  }
}

async function findUniquePracticeSlug(
  examTypeId: number,
  title: string,
  excludedPracticeId?: number,
) {
  const baseSlug = slugifyPractice(title)
  let candidate = baseSlug
  let suffix = 2

  while (true) {
    const conflict = await db.query.practices.findFirst({
      where:
        excludedPracticeId !== undefined
          ? and(
              eq(schema.practices.examTypeId, examTypeId),
              eq(schema.practices.slug, candidate),
              ne(schema.practices.id, excludedPracticeId),
            )
          : and(
              eq(schema.practices.examTypeId, examTypeId),
              eq(schema.practices.slug, candidate),
            ),
      columns: {
        id: true,
      },
    })

    if (!conflict) {
      return candidate
    }

    candidate = `${baseSlug}-${suffix}`
    suffix += 1
  }
}

async function validateRelations(
  parsed: Extract<ReturnType<typeof parsePracticeValues>, { success: true }>["data"],
) {
  const subject = await db.query.subjects.findFirst({
    where: eq(schema.subjects.id, parsed.subjectId),
    columns: {
      id: true,
      examTypeId: true,
    },
  })

  if (!subject || subject.examTypeId !== parsed.examTypeId) {
    return {
      success: false as const,
      message: "Subject must belong to the selected exam type.",
      fieldErrors: {
        subjectId: ["The selected subject is invalid."],
      },
    }
  }

  if (parsed.topicId !== null) {
    const topic = await db.query.topics.findFirst({
      where: eq(schema.topics.id, parsed.topicId),
      columns: {
        id: true,
        subjectId: true,
      },
    })

    if (!topic || topic.subjectId !== parsed.subjectId) {
      return {
        success: false as const,
        message: "Topic must belong to the selected subject.",
        fieldErrors: {
          topicId: ["The selected topic is invalid."],
        },
      }
    }
  }

  for (const [questionIndex, question] of parsed.questions.entries()) {
    if (question.orderIndex === null || question.points === null) {
      return {
        success: false as const,
        message: `Please fix question ${questionIndex + 1}.`,
      }
    }

    const existingQuestion = await db.query.questions.findFirst({
      where: eq(schema.questions.id, question.questionId),
      columns: {
        id: true,
        subjectId: true,
        type: true,
        status: true,
      },
    })

    if (!existingQuestion || existingQuestion.subjectId !== parsed.subjectId) {
      return {
        success: false as const,
        message: `Question ${questionIndex + 1} does not belong to the selected practice subject.`,
      }
    }

    if (!isObjectiveQuestionType(existingQuestion.type)) {
      return {
        success: false as const,
        message: `Question ${questionIndex + 1} uses manual grading or text input and cannot be added to this practice.`,
      }
    }

    if (existingQuestion.status !== "published") {
      return {
        success: false as const,
        message: `Question ${questionIndex + 1} must be published before it can be added to a practice.`,
      }
    }
  }

  return { success: true as const }
}

async function practiceHasSessions(practiceId: number) {
  const session = await db.query.practiceSessions.findFirst({
    where: eq(schema.practiceSessions.practiceId, practiceId),
    columns: {
      id: true,
    },
  })

  return Boolean(session)
}

async function deletePracticeComposition(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  practiceId: number,
) {
  await tx
    .delete(schema.practiceQuestions)
    .where(eq(schema.practiceQuestions.practiceId, practiceId))
}

async function insertPracticeComposition(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  practiceId: number,
  parsed: Extract<ReturnType<typeof parsePracticeValues>, { success: true }>["data"],
) {
  if (parsed.questions.length === 0) {
    return
  }

  await tx.insert(schema.practiceQuestions).values(
    parsed.questions.map((question) => ({
      practiceId,
      questionId: question.questionId,
      orderIndex: question.orderIndex ?? 0,
      points: question.points === null ? null : String(question.points),
    })),
  )
}

export async function createPracticeAction(
  values: PracticeFormValues,
): Promise<PracticeActionResult<{ id: number; slug: string }>> {
  const user = await requireAdmin()
  const parsed = parsePracticeValues(values)

  if (!parsed.success) {
    return parsed
  }

  const relationCheck = await validateRelations(parsed.data)
  if (!relationCheck.success) {
    return relationCheck
  }

  const slug = await findUniquePracticeSlug(parsed.data.examTypeId, parsed.data.title)

  try {
    const [created] = await db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(schema.practices)
        .values({
          examTypeId: parsed.data.examTypeId,
          subjectId: parsed.data.subjectId,
          topicId: parsed.data.topicId,
          title: parsed.data.title,
          slug,
          description: parsed.data.description,
          isFree: parsed.data.isFree,
          hasPracticeMode: parsed.data.hasPracticeMode,
          hasQuizMode: parsed.data.hasQuizMode,
          quizDurationMinutes: parsed.data.quizDurationMinutes,
          shuffleQuestions: parsed.data.shuffleQuestions,
          shuffleOptions: parsed.data.shuffleOptions,
          allowReviewBeforeSubmit: parsed.data.allowReviewBeforeSubmit,
          showResultAfterSubmit: parsed.data.showResultAfterSubmit,
          showExplanationAfterSubmit: parsed.data.showExplanationAfterSubmit,
          navigationMode: parsed.data.navigationMode,
          status: "draft",
          publishedAt: null,
          createdBy: user.id,
        })
        .$returningId()

      await insertPracticeComposition(tx, inserted.id, parsed.data)

      return [inserted]
    })

    revalidatePracticeRoutes(created.id, slug)

    return {
      success: true,
      data: { id: created.id, slug },
    }
  } catch (error) {
    return {
      success: false,
      message: isDuplicateEntryError(error)
        ? "A practice with the same slug, question, or question order already exists."
        : "Failed to create the practice.",
    }
  }
}

export async function updatePracticeAction(
  practiceId: number,
  values: PracticeFormValues,
): Promise<PracticeActionResult<{ id: number; slug: string }>> {
  await requireAdmin()

  const existingPractice = await getPracticeById(practiceId)

  if (!existingPractice) {
    return {
      success: false,
      message: "Practice not found.",
    }
  }

  if (existingPractice.status !== "draft") {
    return {
      success: false,
      message: "Published or archived practices cannot be edited.",
    }
  }

  if (await practiceHasSessions(practiceId)) {
    return {
      success: false,
      message: "This practice already has sessions and can no longer be edited.",
    }
  }

  const parsed = parsePracticeValues(values)

  if (!parsed.success) {
    return parsed
  }

  const relationCheck = await validateRelations(parsed.data)
  if (!relationCheck.success) {
    return relationCheck
  }

  const slug = await findUniquePracticeSlug(
    parsed.data.examTypeId,
    parsed.data.title,
    practiceId,
  )

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(schema.practices)
        .set({
          examTypeId: parsed.data.examTypeId,
          subjectId: parsed.data.subjectId,
          topicId: parsed.data.topicId,
          title: parsed.data.title,
          slug,
          description: parsed.data.description,
          isFree: parsed.data.isFree,
          hasPracticeMode: parsed.data.hasPracticeMode,
          hasQuizMode: parsed.data.hasQuizMode,
          quizDurationMinutes: parsed.data.quizDurationMinutes,
          shuffleQuestions: parsed.data.shuffleQuestions,
          shuffleOptions: parsed.data.shuffleOptions,
          allowReviewBeforeSubmit: parsed.data.allowReviewBeforeSubmit,
          showResultAfterSubmit: parsed.data.showResultAfterSubmit,
          showExplanationAfterSubmit: parsed.data.showExplanationAfterSubmit,
          navigationMode: parsed.data.navigationMode,
        })
        .where(eq(schema.practices.id, practiceId))

      await deletePracticeComposition(tx, practiceId)
      await insertPracticeComposition(tx, practiceId, parsed.data)
    })

    revalidatePracticeRoutes(practiceId, slug, existingPractice.slug)

    return {
      success: true,
      data: { id: practiceId, slug },
    }
  } catch (error) {
    return {
      success: false,
      message: isDuplicateEntryError(error)
        ? "A practice with the same slug, question, or question order already exists."
        : "Failed to update the practice.",
    }
  }
}

export async function publishPracticeAction(
  practiceId: number,
): Promise<PracticeActionResult<{ id: number }>> {
  await requireAdmin()

  const existingPractice = await getPracticeById(practiceId)

  if (!existingPractice) {
    return {
      success: false,
      message: "Practice not found.",
    }
  }

  if (existingPractice.status !== "draft") {
    return {
      success: false,
      message: "Only draft practices can be published.",
    }
  }

  if (!existingPractice.quizDurationMinutes || existingPractice.quizDurationMinutes <= 0) {
    return {
      success: false,
      message: "Quiz duration is required before publishing.",
    }
  }

  if (existingPractice.questions.length === 0) {
    return {
      success: false,
      message: "Add at least one objective question before publishing.",
    }
  }

  const invalidQuestion = existingPractice.questions.find(
    (question) =>
      question.questionStatus !== "published" ||
      question.subjectId !== existingPractice.subjectId ||
      !isObjectiveQuestionType(question.questionType),
  )

  if (invalidQuestion) {
    return {
      success: false,
      message:
        "All practice questions must be published objective questions from the selected subject.",
    }
  }

  await db
    .update(schema.practices)
    .set({
      status: "published",
      publishedAt: existingPractice.publishedAt ?? new Date(),
    })
    .where(eq(schema.practices.id, practiceId))

  revalidatePracticeRoutes(practiceId, existingPractice.slug)

  return {
    success: true,
    data: { id: practiceId },
  }
}

export async function archivePracticeAction(
  practiceId: number,
): Promise<PracticeActionResult<{ id: number }>> {
  await requireAdmin()

  const existingPractice = await getPracticeById(practiceId)

  if (!existingPractice) {
    return {
      success: false,
      message: "Practice not found.",
    }
  }

  if (existingPractice.status !== "published") {
    return {
      success: false,
      message: "Only published practices can be archived.",
    }
  }

  await db
    .update(schema.practices)
    .set({
      status: "archived",
    })
    .where(eq(schema.practices.id, practiceId))

  revalidatePracticeRoutes(practiceId, existingPractice.slug)

  return {
    success: true,
    data: { id: practiceId },
  }
}

export async function deletePracticeAction(
  practiceId: number,
): Promise<PracticeActionResult<{ id: number }>> {
  await requireAdmin()

  const existingPractice = await getPracticeById(practiceId)

  if (!existingPractice) {
    return {
      success: false,
      message: "Practice not found.",
    }
  }

  if (existingPractice.status !== "draft") {
    return {
      success: false,
      message: "Only draft practices can be deleted.",
    }
  }

  if (await practiceHasSessions(practiceId)) {
    return {
      success: false,
      message: "This practice cannot be deleted because it already has sessions.",
    }
  }

  await db.transaction(async (tx) => {
    await deletePracticeComposition(tx, practiceId)
    await tx.delete(schema.practices).where(eq(schema.practices.id, practiceId))
  })

  revalidatePracticeRoutes(practiceId, undefined, existingPractice.slug)

  return {
    success: true,
    data: { id: practiceId },
  }
}

export async function deletePracticesAction(
  practiceIds: number[],
): Promise<PracticeActionResult<{ deletedCount: number }>> {
  await requireAdmin()

  const uniquePracticeIds = [...new Set(practiceIds)].filter(
    (id) => Number.isInteger(id) && id > 0,
  )

  if (uniquePracticeIds.length === 0) {
    return {
      success: false,
      message: "No practices were selected.",
    }
  }

  const [existingPractices, sessionUsageRows] = await Promise.all([
    db
      .select({
        id: schema.practices.id,
        slug: schema.practices.slug,
        status: schema.practices.status,
      })
      .from(schema.practices)
      .where(inArray(schema.practices.id, uniquePracticeIds)),
    db
      .select({
        practiceId: schema.practiceSessions.practiceId,
      })
      .from(schema.practiceSessions)
      .where(inArray(schema.practiceSessions.practiceId, uniquePracticeIds))
      .groupBy(schema.practiceSessions.practiceId),
  ])

  if (existingPractices.length !== uniquePracticeIds.length) {
    return {
      success: false,
      message: "Some selected practices were not found.",
    }
  }

  if (existingPractices.some((practice) => practice.status !== "draft")) {
    return {
      success: false,
      message: "Only draft practices can be deleted.",
    }
  }

  if (sessionUsageRows.length > 0) {
    return {
      success: false,
      message: "One or more selected practices cannot be deleted because they already have sessions.",
    }
  }

  await db.transaction(async (tx) => {
    await tx.delete(schema.practiceQuestions).where(inArray(schema.practiceQuestions.practiceId, uniquePracticeIds))
    await tx.delete(schema.practices).where(inArray(schema.practices.id, uniquePracticeIds))
  })

  revalidatePracticeRoutes()
  existingPractices.forEach((practice) => {
    revalidatePath(`/admin/practices/${practice.id}`)
    revalidatePath(`/admin/practices/${practice.id}/edit`)
    revalidatePath(`/admin/practices/${practice.id}/questions`)
    revalidatePath(`/practice/${practice.slug}`)
  })

  return {
    success: true,
    data: { deletedCount: uniquePracticeIds.length },
  }
}
