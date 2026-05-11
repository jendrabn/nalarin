"use server"

import { eq } from "drizzle-orm"
import { z } from "zod"

import { db, schema } from "@/db"
import { requireAdmin } from "@/features/auth/services/session"

import type { QuestionActionResult } from "./questions"
import {
  questionAiGenerateFormSchema,
  type QuestionAiGenerateFormValues,
  type QuestionFormValues,
} from "../schemas"
import { generateQuestionDrafts } from "../services/question-ai"

function flattenZodError(error: z.ZodError<QuestionAiGenerateFormValues>) {
  return error.flatten().fieldErrors as Partial<
    Record<keyof QuestionAiGenerateFormValues, string[]>
  >
}

function parseRequest(values: QuestionAiGenerateFormValues) {
  const validated = questionAiGenerateFormSchema.safeParse(values)

  if (!validated.success) {
    return {
      success: false as const,
      message: "Please fix the highlighted fields.",
      fieldErrors: flattenZodError(validated.error),
    }
  }

  const count = Number(validated.data.questionCount)
  const points = Number(validated.data.points)

  if (!Number.isInteger(count) || count < 1 || count > 20) {
    return {
      success: false as const,
      message: "Please fix the highlighted fields.",
      fieldErrors: {
        questionCount: ["Question count must be between 1 and 20."],
      },
    }
  }

  if (!Number.isFinite(points) || points <= 0) {
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
      topicId: validated.data.topicId.trim().length > 0 ? Number(validated.data.topicId) : null,
      type: validated.data.type,
      difficulty: validated.data.difficulty,
      count,
      prompt: validated.data.prompt.trim(),
      points,
      status: validated.data.status,
    },
  }
}

export async function generateQuestionDraftsAction(
  values: QuestionAiGenerateFormValues,
): Promise<QuestionActionResult<{ drafts: QuestionFormValues[] }>> {
  await requireAdmin()

  const parsed = parseRequest(values)

  if (!parsed.success) {
    return parsed
  }

  const [examType, subject, topic] = await Promise.all([
    db.query.examTypes.findFirst({
      where: eq(schema.examTypes.id, parsed.data.examTypeId),
      columns: {
        id: true,
        name: true,
      },
    }),
    db.query.subjects.findFirst({
      where: eq(schema.subjects.id, parsed.data.subjectId),
      columns: {
        id: true,
        examTypeId: true,
        name: true,
      },
    }),
    parsed.data.topicId
      ? db.query.topics.findFirst({
          where: eq(schema.topics.id, parsed.data.topicId),
          columns: {
            id: true,
            subjectId: true,
            name: true,
          },
        })
      : Promise.resolve(null),
  ])

  if (!examType || !subject || subject.examTypeId !== examType.id) {
    return {
      success: false,
      message: "Please select a valid exam type and subject combination.",
      fieldErrors: {
        subjectId: ["The selected subject does not belong to the selected exam type."],
      },
    }
  }

  if (parsed.data.topicId && (!topic || topic.subjectId !== subject.id)) {
    return {
      success: false,
      message: "Please select a valid topic for the selected subject.",
      fieldErrors: {
        topicId: ["The selected topic does not belong to the selected subject."],
      },
    }
  }

  try {
    const drafts = await generateQuestionDrafts({
      examTypeName: examType.name,
      subjectName: subject.name,
      topicName: topic?.name ?? null,
      type: parsed.data.type,
      difficulty: parsed.data.difficulty,
      count: parsed.data.count,
      prompt: parsed.data.prompt,
      points: parsed.data.points,
    })

    return {
      success: true,
      data: {
        drafts: drafts.map<QuestionFormValues>((draft) => ({
          examTypeId: String(parsed.data.examTypeId),
          subjectId: String(parsed.data.subjectId),
          topicId: parsed.data.topicId ? String(parsed.data.topicId) : "",
          type: draft.type,
          difficulty: draft.difficulty,
          scoringRule: draft.scoringRule,
          title: draft.title,
          content: draft.content,
          imageUrl: draft.imageUrl,
          correctAnswerText: draft.correctAnswerText,
          gradingRubric: draft.gradingRubric,
          manualExplanation: draft.manualExplanation,
          aiExplanation: draft.aiExplanation,
          year: draft.year,
          points: draft.points,
          status: parsed.data.status,
          options: draft.options,
        })),
      },
    }
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to generate questions with AI.",
    }
  }
}
