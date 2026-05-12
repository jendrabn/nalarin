"use server"

import { and, eq, inArray, ne } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"

import { db, schema } from "@/db"
import { requireAdmin } from "@/features/auth/services/session"

import { tryoutFormSchema, type TryoutFormValues } from "../schemas"
import { getTryoutById } from "../queries"
import { slugifyTryout } from "../utils/slug"
import {
  normalizeNullableText,
  parseOptionalDateTime,
  parsePenalty,
  parseRequiredDecimal,
  parseRequiredInteger,
} from "../utils/tryout"

type ActionError = {
  success: false
  message: string
  fieldErrors?: Partial<Record<keyof TryoutFormValues, string[]>>
}

type ActionSuccess<T = unknown> = {
  success: true
  data: T
}

export type TryoutActionResult<T = unknown> = ActionError | ActionSuccess<T>

function flattenZodError(error: z.ZodError<TryoutFormValues>) {
  return error.flatten().fieldErrors as Partial<
    Record<keyof TryoutFormValues, string[]>
  >
}

function parseTryoutValues(values: TryoutFormValues) {
  const validated = tryoutFormSchema.safeParse(values)

  if (!validated.success) {
    return {
      success: false as const,
      message: "Please fix the highlighted fields.",
      fieldErrors: flattenZodError(validated.error),
    }
  }

  const wrongAnswerPenalty = parsePenalty(validated.data.wrongAnswerPenalty)
  const startsAt = parseOptionalDateTime(validated.data.startsAt)
  const endsAt = parseOptionalDateTime(validated.data.endsAt)
  const resultReleaseAt = parseOptionalDateTime(validated.data.resultReleaseAt)
  const rankingReleaseAt = parseOptionalDateTime(validated.data.rankingReleaseAt)
  const explanationReleaseAt = parseOptionalDateTime(validated.data.explanationReleaseAt)

  if (wrongAnswerPenalty === null) {
    return {
      success: false as const,
      message: "Please fix the highlighted fields.",
      fieldErrors: {
        wrongAnswerPenalty: ["Penalty must be zero or a negative number."],
      },
    }
  }

  return {
    success: true as const,
    data: {
      examTypeId: Number(validated.data.examTypeId),
      title: validated.data.title.trim(),
      description: normalizeNullableText(validated.data.description),
      isFree: validated.data.isFree,
      startsAt,
      endsAt,
      shuffleQuestions: validated.data.shuffleQuestions,
      shuffleOptions: validated.data.shuffleOptions,
      allowReviewBeforeSubmit: validated.data.allowReviewBeforeSubmit,
      showResultAfterSubmit: validated.data.showResultAfterSubmit,
      resultReleaseAt,
      showRankingAfterSubmit: validated.data.showRankingAfterSubmit,
      rankingReleaseAt,
      showExplanationAfterSubmit: validated.data.showExplanationAfterSubmit,
      explanationReleaseAt,
      navigationMode: validated.data.navigationMode,
      enforceEndTime: validated.data.enforceEndTime,
      wrongAnswerPenalty,
      sections: validated.data.sections.map((section) => ({
        subjectId: Number(section.subjectId),
        title: section.title.trim(),
        description: normalizeNullableText(section.description),
        durationMinutes: parseRequiredInteger(section.durationMinutes),
        orderIndex: parseRequiredInteger(section.orderIndex),
        wrongAnswerPenalty: section.wrongAnswerPenalty.trim()
          ? parsePenalty(section.wrongAnswerPenalty)
          : null,
        questions: section.questions.map((question) => ({
          questionId: Number(question.questionId),
          orderIndex: parseRequiredInteger(question.orderIndex),
          points: parseRequiredDecimal(question.points),
        })),
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

function revalidateTryoutRoutes(tryoutId?: number, slug?: string, previousSlug?: string) {
  revalidatePath("/admin/tryouts")
  revalidatePath("/admin/tryouts/create")
  revalidatePath("/tryouts")

  if (tryoutId) {
    revalidatePath(`/admin/tryouts/${tryoutId}`)
    revalidatePath(`/admin/tryouts/${tryoutId}/edit`)
    revalidatePath(`/admin/tryouts/${tryoutId}/sections`)
    revalidatePath(`/admin/tryouts/${tryoutId}/sessions`)
  }

  if (slug) {
    revalidatePath(`/tryout/${slug}`)
  }

  if (previousSlug && previousSlug !== slug) {
    revalidatePath(`/tryout/${previousSlug}`)
  }
}

async function findUniqueTryoutSlug(title: string, excludedTryoutId?: number) {
  const baseSlug = slugifyTryout(title)
  let candidate = baseSlug
  let suffix = 2

  while (true) {
    const conflict = await db.query.tryouts.findFirst({
      where:
        excludedTryoutId !== undefined
          ? and(
              eq(schema.tryouts.slug, candidate),
              ne(schema.tryouts.id, excludedTryoutId),
            )
          : eq(schema.tryouts.slug, candidate),
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

async function validateRelations(parsed: Extract<ReturnType<typeof parseTryoutValues>, { success: true }>["data"]) {
  const examType = await db.query.examTypes.findFirst({
    where: eq(schema.examTypes.id, parsed.examTypeId),
    columns: {
      id: true,
    },
  })

  if (!examType) {
    return {
      success: false as const,
      message: "Please select a valid exam type.",
      fieldErrors: {
        examTypeId: ["The selected exam type is invalid."],
      },
    }
  }

  for (const [sectionIndex, section] of parsed.sections.entries()) {
    if (section.durationMinutes === null || section.orderIndex === null) {
      return {
        success: false as const,
        message: `Please fix section ${sectionIndex + 1}.`,
      }
    }

    const subject = await db.query.subjects.findFirst({
      where: eq(schema.subjects.id, section.subjectId),
      columns: {
        id: true,
        examTypeId: true,
      },
    })

    if (!subject || subject.examTypeId !== parsed.examTypeId) {
      return {
        success: false as const,
        message: `Section ${sectionIndex + 1} uses a subject outside the selected exam type.`,
      }
    }

    for (const [questionIndex, question] of section.questions.entries()) {
      if (question.orderIndex === null || question.points === null) {
        return {
          success: false as const,
          message: `Please fix question ${questionIndex + 1} in section ${sectionIndex + 1}.`,
        }
      }

      const existingQuestion = await db.query.questions.findFirst({
        where: eq(schema.questions.id, question.questionId),
        columns: {
          id: true,
          subjectId: true,
          status: true,
        },
      })

      if (!existingQuestion || existingQuestion.subjectId !== section.subjectId) {
        return {
          success: false as const,
          message: `Question ${questionIndex + 1} in section ${sectionIndex + 1} does not belong to the selected section subject.`,
        }
      }

      if (existingQuestion.status !== "published") {
        return {
          success: false as const,
          message: `Question ${questionIndex + 1} in section ${sectionIndex + 1} must be published before it can be added to a tryout.`,
        }
      }
    }
  }

  return { success: true as const }
}

async function tryoutHasSessions(tryoutId: number) {
  const session = await db.query.tryoutSessions.findFirst({
    where: eq(schema.tryoutSessions.tryoutId, tryoutId),
    columns: {
      id: true,
    },
  })

  return Boolean(session)
}

async function deleteTryoutComposition(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  tryoutId: number,
) {
  const existingSections = await tx
    .select({
      id: schema.tryoutSections.id,
    })
    .from(schema.tryoutSections)
    .where(eq(schema.tryoutSections.tryoutId, tryoutId))

  const sectionIds = existingSections.map((section) => section.id)

  if (sectionIds.length > 0) {
    await tx
      .delete(schema.tryoutQuestions)
      .where(inArray(schema.tryoutQuestions.tryoutSectionId, sectionIds))
  }

  await tx
    .delete(schema.tryoutSections)
    .where(eq(schema.tryoutSections.tryoutId, tryoutId))
}

async function insertTryoutComposition(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  tryoutId: number,
  parsed: Extract<ReturnType<typeof parseTryoutValues>, { success: true }>["data"],
) {
  for (const section of parsed.sections) {
    const [insertedSection] = await tx
      .insert(schema.tryoutSections)
      .values({
        tryoutId,
        subjectId: section.subjectId,
        title: section.title,
        description: section.description,
        durationMinutes: section.durationMinutes ?? 0,
        orderIndex: section.orderIndex ?? 0,
        wrongAnswerPenalty:
          section.wrongAnswerPenalty === null
            ? null
            : String(section.wrongAnswerPenalty),
      })
      .$returningId()

    if (section.questions.length > 0) {
      await tx.insert(schema.tryoutQuestions).values(
        section.questions.map((question) => ({
          tryoutSectionId: insertedSection.id,
          questionId: question.questionId,
          orderIndex: question.orderIndex ?? 0,
          points: question.points === null ? null : String(question.points),
        })),
      )
    }
  }
}

export async function createTryoutAction(
  values: TryoutFormValues,
): Promise<TryoutActionResult<{ id: number; slug: string }>> {
  const user = await requireAdmin()
  const parsed = parseTryoutValues(values)

  if (!parsed.success) {
    return parsed
  }

  const relationCheck = await validateRelations(parsed.data)
  if (!relationCheck.success) {
    return relationCheck
  }

  const slug = await findUniqueTryoutSlug(parsed.data.title)

  try {
    const [created] = await db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(schema.tryouts)
        .values({
          examTypeId: parsed.data.examTypeId,
          title: parsed.data.title,
          slug,
          description: parsed.data.description,
          isFree: parsed.data.isFree,
          startsAt: parsed.data.startsAt,
          endsAt: parsed.data.endsAt,
          shuffleQuestions: parsed.data.shuffleQuestions,
          shuffleOptions: parsed.data.shuffleOptions,
          allowReviewBeforeSubmit: parsed.data.allowReviewBeforeSubmit,
          showResultAfterSubmit: parsed.data.showResultAfterSubmit,
          resultReleaseAt: parsed.data.resultReleaseAt,
          showRankingAfterSubmit: parsed.data.showRankingAfterSubmit,
          rankingReleaseAt: parsed.data.rankingReleaseAt,
          showExplanationAfterSubmit: parsed.data.showExplanationAfterSubmit,
          explanationReleaseAt: parsed.data.explanationReleaseAt,
          navigationMode: parsed.data.navigationMode,
          enforceEndTime: parsed.data.enforceEndTime,
          wrongAnswerPenalty: String(parsed.data.wrongAnswerPenalty),
          status: "draft",
          publishedAt: null,
          createdBy: user.id,
        })
        .$returningId()

      await insertTryoutComposition(tx, inserted.id, parsed.data)

      return [inserted]
    })

    revalidateTryoutRoutes(created.id, slug)

    return {
      success: true,
      data: { id: created.id, slug },
    }
  } catch (error) {
    return {
      success: false,
      message: isDuplicateEntryError(error)
        ? "A tryout with the same slug already exists."
        : "Failed to create the tryout.",
    }
  }
}

export async function updateTryoutAction(
  tryoutId: number,
  values: TryoutFormValues,
): Promise<TryoutActionResult<{ id: number; slug: string }>> {
  await requireAdmin()

  const existingTryout = await getTryoutById(tryoutId)

  if (!existingTryout) {
    return {
      success: false,
      message: "Tryout not found.",
    }
  }

  if (existingTryout.status !== "draft") {
    return {
      success: false,
      message: "Published or archived tryouts cannot be edited. Archive it and create a new tryout for major revisions.",
    }
  }

  if (await tryoutHasSessions(tryoutId)) {
    return {
      success: false,
      message: "This tryout already has sessions and can no longer be edited.",
    }
  }

  const parsed = parseTryoutValues(values)

  if (!parsed.success) {
    return parsed
  }

  const relationCheck = await validateRelations(parsed.data)
  if (!relationCheck.success) {
    return relationCheck
  }

  const slug = await findUniqueTryoutSlug(parsed.data.title, tryoutId)

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(schema.tryouts)
        .set({
          examTypeId: parsed.data.examTypeId,
          title: parsed.data.title,
          slug,
          description: parsed.data.description,
          isFree: parsed.data.isFree,
          startsAt: parsed.data.startsAt,
          endsAt: parsed.data.endsAt,
          shuffleQuestions: parsed.data.shuffleQuestions,
          shuffleOptions: parsed.data.shuffleOptions,
          allowReviewBeforeSubmit: parsed.data.allowReviewBeforeSubmit,
          showResultAfterSubmit: parsed.data.showResultAfterSubmit,
          resultReleaseAt: parsed.data.resultReleaseAt,
          showRankingAfterSubmit: parsed.data.showRankingAfterSubmit,
          rankingReleaseAt: parsed.data.rankingReleaseAt,
          showExplanationAfterSubmit: parsed.data.showExplanationAfterSubmit,
          explanationReleaseAt: parsed.data.explanationReleaseAt,
          navigationMode: parsed.data.navigationMode,
          enforceEndTime: parsed.data.enforceEndTime,
          wrongAnswerPenalty: String(parsed.data.wrongAnswerPenalty),
        })
        .where(eq(schema.tryouts.id, tryoutId))

      await deleteTryoutComposition(tx, tryoutId)
      await insertTryoutComposition(tx, tryoutId, parsed.data)
    })

    revalidateTryoutRoutes(tryoutId, slug, existingTryout.slug)

    return {
      success: true,
      data: { id: tryoutId, slug },
    }
  } catch (error) {
    return {
      success: false,
      message: isDuplicateEntryError(error)
        ? "A tryout with the same slug or duplicate section/question order already exists."
        : "Failed to update the tryout.",
    }
  }
}

export async function publishTryoutAction(
  tryoutId: number,
): Promise<TryoutActionResult<{ id: number }>> {
  await requireAdmin()

  const existingTryout = await getTryoutById(tryoutId)

  if (!existingTryout) {
    return {
      success: false,
      message: "Tryout not found.",
    }
  }

  if (existingTryout.status !== "draft") {
    return {
      success: false,
      message: "Only draft tryouts can be published.",
    }
  }

  await db
    .update(schema.tryouts)
    .set({
      status: "published",
      publishedAt: existingTryout.publishedAt ?? new Date(),
    })
    .where(eq(schema.tryouts.id, tryoutId))

  revalidateTryoutRoutes(tryoutId, existingTryout.slug)

  return {
    success: true,
    data: { id: tryoutId },
  }
}

export async function archiveTryoutAction(
  tryoutId: number,
): Promise<TryoutActionResult<{ id: number }>> {
  await requireAdmin()

  const existingTryout = await getTryoutById(tryoutId)

  if (!existingTryout) {
    return {
      success: false,
      message: "Tryout not found.",
    }
  }

  if (existingTryout.status !== "published") {
    return {
      success: false,
      message: "Only published tryouts can be archived.",
    }
  }

  await db
    .update(schema.tryouts)
    .set({
      status: "archived",
    })
    .where(eq(schema.tryouts.id, tryoutId))

  revalidateTryoutRoutes(tryoutId, existingTryout.slug)

  return {
    success: true,
    data: { id: tryoutId },
  }
}

export async function deleteTryoutAction(
  tryoutId: number,
): Promise<TryoutActionResult<{ id: number }>> {
  await requireAdmin()

  const existingTryout = await getTryoutById(tryoutId)

  if (!existingTryout) {
    return {
      success: false,
      message: "Tryout not found.",
    }
  }

  if (existingTryout.status !== "draft") {
    return {
      success: false,
      message: "Only draft tryouts can be deleted.",
    }
  }

  if (await tryoutHasSessions(tryoutId)) {
    return {
      success: false,
      message: "This tryout cannot be deleted because it already has sessions.",
    }
  }

  await db.transaction(async (tx) => {
    await deleteTryoutComposition(tx, tryoutId)
    await tx.delete(schema.tryouts).where(eq(schema.tryouts.id, tryoutId))
  })

  revalidateTryoutRoutes(tryoutId, undefined, existingTryout.slug)

  return {
    success: true,
    data: { id: tryoutId },
  }
}
