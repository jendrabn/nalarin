import { z } from "zod"

import {
  tryoutNavigationModeValues,
} from "../constants"

const optionalDateTimeSchema = z.string().trim().default("")

export const tryoutQuestionFormSchema = z.object({
  id: z.string().trim().default(""),
  questionId: z.string().trim().min(1, "Select a question."),
  orderIndex: z.string().trim().min(1, "Order is required."),
  points: z.string().trim().min(1, "Points are required."),
})

export const tryoutSectionFormSchema = z.object({
  id: z.string().trim().default(""),
  subjectId: z.string().trim().min(1, "Select a subject."),
  title: z.string().trim().min(3, "Section title is required.").max(255),
  description: z.string().trim().max(5000, "Description is too long.").default(""),
  durationMinutes: z.string().trim().min(1, "Duration is required."),
  orderIndex: z.string().trim().min(1, "Order is required."),
  wrongAnswerPenalty: z.string().trim().default(""),
  questions: z.array(tryoutQuestionFormSchema).default([]),
})

export const tryoutFormSchema = z
  .object({
    examTypeId: z.string().trim().min(1, "Select an exam type."),
    title: z.string().trim().min(3, "Tryout title is required.").max(255),
    description: z.string().trim().max(10000, "Description is too long.").default(""),
    isFree: z.boolean().default(true),
    startsAt: optionalDateTimeSchema,
    endsAt: optionalDateTimeSchema,
    shuffleQuestions: z.boolean().default(false),
    shuffleOptions: z.boolean().default(false),
    allowReviewBeforeSubmit: z.boolean().default(true),
    showResultAfterSubmit: z.boolean().default(true),
    resultReleaseAt: optionalDateTimeSchema,
    showRankingAfterSubmit: z.boolean().default(true),
    rankingReleaseAt: optionalDateTimeSchema,
    showExplanationAfterSubmit: z.boolean().default(true),
    explanationReleaseAt: optionalDateTimeSchema,
    navigationMode: z.enum(tryoutNavigationModeValues),
    enforceEndTime: z.boolean().default(false),
    wrongAnswerPenalty: z.string().trim().min(1, "Penalty is required."),
    sections: z.array(tryoutSectionFormSchema).default([]),
  })
  .superRefine((value, ctx) => {
    const startsAt = value.startsAt ? new Date(value.startsAt) : null
    const endsAt = value.endsAt ? new Date(value.endsAt) : null

    if (value.startsAt && (!startsAt || Number.isNaN(startsAt.getTime()))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["startsAt"],
        message: "Start date is invalid.",
      })
    }

    if (value.endsAt && (!endsAt || Number.isNaN(endsAt.getTime()))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endsAt"],
        message: "End date is invalid.",
      })
    }

    if (startsAt && endsAt && endsAt <= startsAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endsAt"],
        message: "End date must be after start date.",
      })
    }

    if (value.enforceEndTime && !value.endsAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endsAt"],
        message: "End date is required when enforced end time is enabled.",
      })
    }

    const tryoutPenalty = Number(value.wrongAnswerPenalty)
    if (!Number.isFinite(tryoutPenalty) || tryoutPenalty > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["wrongAnswerPenalty"],
        message: "Penalty must be zero or a negative number.",
      })
    }

    const sectionOrders = new Set<string>()
    value.sections.forEach((section, sectionIndex) => {
      const duration = Number(section.durationMinutes)
      const order = Number(section.orderIndex)
      const sectionPenalty = section.wrongAnswerPenalty.trim()
        ? Number(section.wrongAnswerPenalty)
        : null

      if (!Number.isInteger(duration) || duration <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["sections", sectionIndex, "durationMinutes"],
          message: "Duration must be greater than 0.",
        })
      }

      if (!Number.isInteger(order) || order <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["sections", sectionIndex, "orderIndex"],
          message: "Order must be greater than 0.",
        })
      } else if (sectionOrders.has(section.orderIndex)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["sections", sectionIndex, "orderIndex"],
          message: "Section order must be unique.",
        })
      }
      sectionOrders.add(section.orderIndex)

      if (sectionPenalty !== null && (!Number.isFinite(sectionPenalty) || sectionPenalty > 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["sections", sectionIndex, "wrongAnswerPenalty"],
          message: "Section penalty must be zero or a negative number.",
        })
      }

      const questionIds = new Set<string>()
      const questionOrders = new Set<string>()
      section.questions.forEach((question, questionIndex) => {
        const questionOrder = Number(question.orderIndex)
        const points = Number(question.points)

        if (questionIds.has(question.questionId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["sections", sectionIndex, "questions", questionIndex, "questionId"],
            message: "Question must be unique within the section.",
          })
        }
        questionIds.add(question.questionId)

        if (!Number.isInteger(questionOrder) || questionOrder <= 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["sections", sectionIndex, "questions", questionIndex, "orderIndex"],
            message: "Question order must be greater than 0.",
          })
        } else if (questionOrders.has(question.orderIndex)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["sections", sectionIndex, "questions", questionIndex, "orderIndex"],
            message: "Question order must be unique within the section.",
          })
        }
        questionOrders.add(question.orderIndex)

        if (!Number.isFinite(points) || points <= 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["sections", sectionIndex, "questions", questionIndex, "points"],
            message: "Points must be greater than 0.",
          })
        }
      })
    })
  })

export type TryoutFormValues = z.infer<typeof tryoutFormSchema>
