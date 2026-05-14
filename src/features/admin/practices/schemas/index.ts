import { z } from "zod"

import { practiceNavigationModeValues } from "../constants"

export const practiceQuestionFormSchema = z.object({
  id: z.string().trim().default(""),
  questionId: z.string().trim().min(1, "Select a question."),
  orderIndex: z.string().trim().min(1, "Order is required."),
  points: z.string().trim().min(1, "Points are required."),
})

export const practiceFormSchema = z
  .object({
    examTypeId: z.string().trim().min(1, "Select an exam type."),
    subjectId: z.string().trim().min(1, "Select a subject."),
    topicId: z.string().trim().default(""),
    title: z.string().trim().min(3, "Practice title is required.").max(255),
    description: z.string().trim().max(10000, "Description is too long.").default(""),
    isFree: z.boolean().default(true),
    hasPracticeMode: z.boolean().default(true),
    hasQuizMode: z.boolean().default(false),
    quizDurationMinutes: z.string().trim().default(""),
    shuffleQuestions: z.boolean().default(false),
    shuffleOptions: z.boolean().default(false),
    allowReviewBeforeSubmit: z.boolean().default(true),
    showResultAfterSubmit: z.boolean().default(true),
    showExplanationAfterSubmit: z.boolean().default(true),
    navigationMode: z.enum(practiceNavigationModeValues).default("free"),
    questions: z.array(practiceQuestionFormSchema).default([]),
  })
  .superRefine((value, ctx) => {
    if (!value.hasPracticeMode && !value.hasQuizMode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["hasPracticeMode"],
        message: "Enable at least one mode.",
      })
    }

    if (value.hasQuizMode) {
      const duration = Number(value.quizDurationMinutes)

      if (!Number.isInteger(duration) || duration <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["quizDurationMinutes"],
          message: "Quiz duration is required when quiz mode is enabled.",
        })
      }
    }

    const questionIds = new Set<string>()
    const questionOrders = new Set<string>()
    value.questions.forEach((question, questionIndex) => {
      const order = Number(question.orderIndex)
      const points = Number(question.points)

      if (questionIds.has(question.questionId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["questions", questionIndex, "questionId"],
          message: "Question must be unique.",
        })
      }
      questionIds.add(question.questionId)

      if (!Number.isInteger(order) || order <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["questions", questionIndex, "orderIndex"],
          message: "Question order must be greater than 0.",
        })
      } else if (questionOrders.has(question.orderIndex)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["questions", questionIndex, "orderIndex"],
          message: "Question order must be unique.",
        })
      }
      questionOrders.add(question.orderIndex)

      if (!Number.isFinite(points) || points <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["questions", questionIndex, "points"],
          message: "Points must be greater than 0.",
        })
      }
    })
  })

export type PracticeFormValues = z.infer<typeof practiceFormSchema>
