"use server"

import { and, eq, inArray } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"

import { db, schema } from "@/db"
import { requireAdmin } from "@/features/auth/services/session"

import {
  questionFormSchema,
  type QuestionFormValues,
  type QuestionImportRowValues,
} from "../schemas"
import {
  questionOptionLabelValues,
  questionTrueFalseLabels,
} from "../constants"
import {
  ensureQuestionOptions,
  isChoiceQuestionType,
  isSubjectiveQuestionType,
  normalizeNullableText,
  parseOptionalDecimal,
  parseOptionalInteger,
} from "../utils/question"
import { getQuestionById } from "../queries"
import type { QuestionOptionInput } from "../utils/question"
import type { QuestionType } from "../constants"

type ActionError = {
  success: false
  message: string
  fieldErrors?: Partial<Record<keyof QuestionFormValues, string[]>>
}

type ActionSuccess<T = unknown> = {
  success: true
  data: T
}

export type QuestionActionResult<T = unknown> = ActionError | ActionSuccess<T>

function flattenZodError(error: z.ZodError<QuestionFormValues>) {
  return error.flatten().fieldErrors as Partial<
    Record<keyof QuestionFormValues, string[]>
  >
}

function parseQuestionValues(values: QuestionFormValues) {
  const validated = questionFormSchema.safeParse(values)

  if (!validated.success) {
    return {
      success: false as const,
      message: "Please fix the highlighted fields.",
      fieldErrors: flattenZodError(validated.error),
    }
  }

  const year = parseOptionalInteger(validated.data.year)
  const points = parseOptionalDecimal(validated.data.points)

  if (points === null) {
    return {
      success: false as const,
      message: "Please fix the highlighted fields.",
      fieldErrors: {
        points: ["Points must be greater than 0."],
      },
    }
  }

  return {
    success: true as const,
    data: {
      examTypeId: Number(validated.data.examTypeId),
      subjectId: Number(validated.data.subjectId),
      topicId: parseOptionalInteger(validated.data.topicId),
      type: validated.data.type,
      difficulty: validated.data.difficulty,
      scoringRule:
        validated.data.scoringRule.trim().length > 0
          ? validated.data.scoringRule
          : null,
      title: normalizeNullableText(validated.data.title),
      content: validated.data.content.trim(),
      imageUrl: normalizeNullableText(validated.data.imageUrl),
      correctAnswerText: normalizeNullableText(validated.data.correctAnswerText),
      gradingRubric: normalizeNullableText(validated.data.gradingRubric),
      manualExplanation: normalizeNullableText(validated.data.manualExplanation),
      aiExplanation: normalizeNullableText(validated.data.aiExplanation),
      year,
      points,
      status: validated.data.status,
      options: ensureQuestionOptions(validated.data.options, validated.data.type),
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

function revalidateQuestionRoutes(questionId?: number) {
  revalidatePath("/admin/questions")
  revalidatePath("/admin/questions/create")
  revalidatePath("/admin/questions/import")
  revalidatePath("/admin/questions/import/preview")

  if (questionId) {
    revalidatePath(`/admin/questions/${questionId}`)
    revalidatePath(`/admin/questions/${questionId}/edit`)
    revalidatePath(`/admin/questions/${questionId}/ai-explanation`)
  }
}

async function validateQuestionRelations(examTypeId: number, subjectId: number, topicId: number | null) {
  const subject = await db.query.subjects.findFirst({
    where: eq(schema.subjects.id, subjectId),
    columns: {
      id: true,
      examTypeId: true,
    },
  })

  if (!subject || subject.examTypeId !== examTypeId) {
    return {
      success: false as const,
      message: "Please select a valid subject for the selected exam type.",
      fieldErrors: {
        subjectId: ["The selected subject does not belong to the selected exam type."],
      },
    }
  }

  if (!topicId) {
    return { success: true as const }
  }

  const topic = await db.query.topics.findFirst({
    where: eq(schema.topics.id, topicId),
    columns: {
      id: true,
      subjectId: true,
    },
  })

  if (!topic || topic.subjectId !== subjectId) {
    return {
      success: false as const,
      message: "Please select a valid topic for the selected subject.",
      fieldErrors: {
        topicId: ["The selected topic does not belong to the selected subject."],
      },
    }
  }

  return { success: true as const }
}

async function isQuestionLocked(questionId: number) {
  const [practiceQuestion, tryoutQuestion, practiceSessionQuestion, tryoutSessionQuestion] =
    await Promise.all([
      db.query.practiceQuestions.findFirst({
        where: eq(schema.practiceQuestions.questionId, questionId),
        columns: {
          id: true,
        },
      }),
      db.query.tryoutQuestions.findFirst({
        where: eq(schema.tryoutQuestions.questionId, questionId),
        columns: {
          id: true,
        },
      }),
      db.query.practiceSessionQuestions.findFirst({
        where: eq(schema.practiceSessionQuestions.questionId, questionId),
        columns: {
          id: true,
        },
      }),
      db.query.tryoutSessionQuestions.findFirst({
        where: eq(schema.tryoutSessionQuestions.questionId, questionId),
        columns: {
          id: true,
        },
      }),
    ])

  return Boolean(
    practiceQuestion ||
      tryoutQuestion ||
      practiceSessionQuestion ||
      tryoutSessionQuestion,
  )
}

async function persistQuestionOptions(
  tx: typeof db,
  questionId: number,
  type: QuestionType,
  options: QuestionOptionInput[],
) {
  if (!isChoiceQuestionType(type)) {
    return
  }

  const resolvedOptions = ensureQuestionOptions(options, type)

  if (type === "true_false") {
    await tx.insert(schema.questionOptions).values(
      resolvedOptions.map((option) => ({
        questionId,
        label: option.label,
        content: option.content || option.label,
        imageUrl: normalizeNullableText(option.imageUrl),
        isCorrect: false,
      })),
    )
    return
  }

  await tx.insert(schema.questionOptions).values(
    resolvedOptions
      .filter((option) => option.content.trim().length > 0 || option.imageUrl.trim().length > 0)
      .map((option) => ({
        questionId,
        label: option.label,
        content: option.content,
        imageUrl: normalizeNullableText(option.imageUrl),
        isCorrect: option.isCorrect,
      })),
  )
}

async function persistQuestion(
  adminUserId: number,
  questionId: number | null,
  parsed: Awaited<ReturnType<typeof parseQuestionValues>>,
) {
  if (!parsed.success) {
    return parsed
  }

  const relationCheck = await validateQuestionRelations(
    parsed.data.examTypeId,
    parsed.data.subjectId,
    parsed.data.topicId,
  )

  if (!relationCheck.success) {
    return relationCheck
  }

  const payload = {
    subjectId: parsed.data.subjectId,
    topicId: parsed.data.topicId,
    type: parsed.data.type,
    difficulty: parsed.data.difficulty,
    scoringRule:
      parsed.data.type === "multiple_answer" ? parsed.data.scoringRule : null,
    title: parsed.data.title,
    content: parsed.data.content,
    imageUrl: parsed.data.imageUrl,
    correctAnswerText:
      parsed.data.type === "true_false"
        ? (parsed.data.correctAnswerText?.toLowerCase() ?? null)
        : isSubjectiveQuestionType(parsed.data.type)
          ? parsed.data.correctAnswerText
          : null,
    gradingRubric: parsed.data.gradingRubric,
    manualExplanation: parsed.data.manualExplanation,
    aiExplanation: parsed.data.aiExplanation,
    year: parsed.data.year,
    points: parsed.data.points,
    status: parsed.data.status,
  }

  try {
    if (questionId === null) {
      const [created] = await db.transaction(async (tx) => {
        const [inserted] = await tx
          .insert(schema.questions)
          .values({
            ...payload,
            createdBy: adminUserId,
          })
          .$returningId()

        await persistQuestionOptions(tx, inserted.id, parsed.data.type, parsed.data.options)

        return [inserted]
      })

      revalidateQuestionRoutes(created.id)

      return {
        success: true as const,
        data: { id: created.id },
      }
    }

    const existingQuestion = await getQuestionById(questionId)

    if (!existingQuestion) {
      return {
        success: false as const,
        message: "Question not found.",
      }
    }

    if (await isQuestionLocked(questionId)) {
      return {
        success: false as const,
        message:
          "This question is already used in a practice or tryout and cannot be edited.",
      }
    }

    await db.transaction(async (tx) => {
      await tx
        .update(schema.questions)
        .set(payload)
        .where(eq(schema.questions.id, questionId))

      await tx
        .delete(schema.questionOptions)
        .where(eq(schema.questionOptions.questionId, questionId))

      await persistQuestionOptions(tx, questionId, parsed.data.type, parsed.data.options)
    })

    revalidateQuestionRoutes(questionId)

    return {
      success: true as const,
      data: { id: questionId },
    }
  } catch (error) {
    return {
      success: false as const,
      message:
        isDuplicateEntryError(error)
          ? "A question with the same data already exists."
          : questionId === null
            ? "Failed to create the question."
            : "Failed to update the question.",
    }
  }
}

export async function createQuestionAction(
  values: QuestionFormValues,
): Promise<QuestionActionResult<{ id: number }>> {
  const user = await requireAdmin()
  return persistQuestion(user.id, null, parseQuestionValues(values))
}

export async function updateQuestionAction(
  questionId: number,
  values: QuestionFormValues,
): Promise<QuestionActionResult<{ id: number }>> {
  const user = await requireAdmin()
  return persistQuestion(user.id, questionId, parseQuestionValues(values))
}

export async function deleteQuestionAction(
  questionId: number,
): Promise<QuestionActionResult<{ id: number }>> {
  await requireAdmin()

  const question = await getQuestionById(questionId)

  if (!question) {
    return {
      success: false,
      message: "Question not found.",
    }
  }

  if (await isQuestionLocked(questionId)) {
    return {
      success: false,
      message: "This question cannot be deleted because it is already used.",
    }
  }

  await db.transaction(async (tx) => {
    await tx
      .delete(schema.questionOptions)
      .where(eq(schema.questionOptions.questionId, questionId))

    await tx.delete(schema.questions).where(eq(schema.questions.id, questionId))
  })

  revalidateQuestionRoutes()

  return {
    success: true,
    data: { id: questionId },
  }
}

export async function deleteQuestionsAction(
  questionIds: number[],
): Promise<QuestionActionResult<{ deletedCount: number }>> {
  await requireAdmin()

  const uniqueQuestionIds = [...new Set(questionIds)].filter(
    (id) => Number.isInteger(id) && id > 0,
  )

  if (uniqueQuestionIds.length === 0) {
    return {
      success: false,
      message: "No questions were selected.",
    }
  }

  const [
    existingQuestions,
    practiceQuestionRows,
    tryoutQuestionRows,
    practiceSessionQuestionRows,
    tryoutSessionQuestionRows,
  ] = await Promise.all([
    db
      .select({
        id: schema.questions.id,
      })
      .from(schema.questions)
      .where(inArray(schema.questions.id, uniqueQuestionIds)),
    db
      .select({
        questionId: schema.practiceQuestions.questionId,
      })
      .from(schema.practiceQuestions)
      .where(inArray(schema.practiceQuestions.questionId, uniqueQuestionIds))
      .groupBy(schema.practiceQuestions.questionId),
    db
      .select({
        questionId: schema.tryoutQuestions.questionId,
      })
      .from(schema.tryoutQuestions)
      .where(inArray(schema.tryoutQuestions.questionId, uniqueQuestionIds))
      .groupBy(schema.tryoutQuestions.questionId),
    db
      .select({
        questionId: schema.practiceSessionQuestions.questionId,
      })
      .from(schema.practiceSessionQuestions)
      .where(inArray(schema.practiceSessionQuestions.questionId, uniqueQuestionIds))
      .groupBy(schema.practiceSessionQuestions.questionId),
    db
      .select({
        questionId: schema.tryoutSessionQuestions.questionId,
      })
      .from(schema.tryoutSessionQuestions)
      .where(inArray(schema.tryoutSessionQuestions.questionId, uniqueQuestionIds))
      .groupBy(schema.tryoutSessionQuestions.questionId),
  ])

  if (existingQuestions.length !== uniqueQuestionIds.length) {
    return {
      success: false,
      message: "Some selected questions were not found.",
    }
  }

  if (
    practiceQuestionRows.length > 0 ||
    tryoutQuestionRows.length > 0 ||
    practiceSessionQuestionRows.length > 0 ||
    tryoutSessionQuestionRows.length > 0
  ) {
    return {
      success: false,
      message: "One or more selected questions cannot be deleted because they are already used.",
    }
  }

  await db.transaction(async (tx) => {
    await tx
      .delete(schema.questionOptions)
      .where(inArray(schema.questionOptions.questionId, uniqueQuestionIds))

    await tx.delete(schema.questions).where(inArray(schema.questions.id, uniqueQuestionIds))
  })

  revalidateQuestionRoutes()
  uniqueQuestionIds.forEach((questionId) => {
    revalidatePath(`/admin/questions/${questionId}`)
    revalidatePath(`/admin/questions/${questionId}/edit`)
    revalidatePath(`/admin/questions/${questionId}/ai-explanation`)
  })

  return {
    success: true,
    data: { deletedCount: uniqueQuestionIds.length },
  }
}

export async function importQuestionRowsAction(
  rows: QuestionImportRowValues[],
): Promise<
  QuestionActionResult<{ importedCount: number; skippedCount: number }>
> {
  const user = await requireAdmin()

  let importedCount = 0
  let skippedCount = 0

  for (const row of rows) {
    const examType = await db.query.examTypes.findFirst({
      where: eq(schema.examTypes.slug, row.examTypeSlug),
      columns: {
        id: true,
      },
    })

    const subject = await db.query.subjects.findFirst({
      where: and(
        eq(schema.subjects.slug, row.subjectSlug),
        eq(schema.subjects.examTypeId, examType?.id ?? 0),
      ),
      columns: {
        id: true,
      },
    })

    const topic =
      row.topicSlug.trim().length > 0
        ? await db.query.topics.findFirst({
            where: and(
              eq(schema.topics.slug, row.topicSlug),
              eq(schema.topics.subjectId, subject?.id ?? 0),
            ),
            columns: {
              id: true,
            },
          })
        : null

    if (!examType || !subject) {
      skippedCount += 1
      continue
    }

    const type = row.questionType
    const options: QuestionOptionInput[] = questionOptionLabelValues.map((label) => ({
      label,
      content: row[`option${label}` as keyof QuestionImportRowValues],
      imageUrl: "",
      isCorrect: false,
    }))

    if (type === "multiple_choice") {
      const correctLabel = row.correctAnswer.toUpperCase()

      options.forEach((option) => {
        option.isCorrect = option.label === correctLabel
      })
    }

    if (type === "multiple_answer") {
      const correctLabels = row.correctAnswer
        .split(",")
        .map((item) => item.trim().toUpperCase())
        .filter(Boolean)

      options.forEach((option) => {
        option.isCorrect = correctLabels.includes(option.label)
      })
    }

    if (type === "true_false") {
      options[0] = {
        label: questionTrueFalseLabels[0],
        content: row.optionA || "True",
        imageUrl: "",
        isCorrect: false,
      }
      options[1] = {
        label: questionTrueFalseLabels[1],
        content: row.optionB || "False",
        imageUrl: "",
        isCorrect: false,
      }
    }

    const parsed = parseQuestionValues({
      examTypeId: String(examType.id),
      subjectId: String(subject.id),
      topicId: topic ? String(topic.id) : "",
      type,
      difficulty: row.difficulty,
      scoringRule: row.scoringRule,
      title: row.title,
      content: row.questionContent,
      imageUrl: row.imageUrl,
      correctAnswerText:
        row.correctAnswerText || (row.questionType === "true_false" ? row.correctAnswer : ""),
      gradingRubric: row.gradingRubric,
      manualExplanation: row.manualExplanation,
      aiExplanation: row.aiExplanation,
      year: row.year,
      points: row.points || "1",
      status: row.status,
      options,
    })

    if (!parsed.success) {
      skippedCount += 1
      continue
    }

    const result = await persistQuestion(user.id, null, parsed)

    if (result.success) {
      importedCount += 1
    } else {
      skippedCount += 1
    }
  }

  revalidateQuestionRoutes()

  return {
    success: true,
    data: { importedCount, skippedCount },
  }
}

export async function saveQuestionDraftsAction(
  drafts: QuestionFormValues[],
): Promise<QuestionActionResult<{ importedCount: number }>> {
  const user = await requireAdmin()
  let importedCount = 0

  for (const draft of drafts) {
    const result = await persistQuestion(user.id, null, parseQuestionValues(draft))

    if (result.success) {
      importedCount += 1
    }
  }

  revalidateQuestionRoutes()

  return {
    success: true,
    data: { importedCount },
  }
}
