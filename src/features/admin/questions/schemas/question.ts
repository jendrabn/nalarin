import { z } from "zod"

import {
  questionDifficultyValues,
  questionStatusValues,
  questionTypeValues,
} from "../constants"
import { isChoiceQuestionType, isSubjectiveQuestionType } from "../utils/question"

export const questionOptionFormSchema = z.object({
  label: z.string().trim().min(1, "Option label is required.").max(20),
  content: z.string().trim().default(""),
  imageUrl: z.string().trim().max(2048, "Image URL is too long.").default(""),
  isCorrect: z.boolean().default(false),
})

export const questionFormSchema = z
  .object({
    examTypeId: z.string().trim().min(1, "Select an exam type."),
    subjectId: z.string().trim().min(1, "Select a subject."),
    topicId: z.string().trim().default(""),
    type: z.enum(questionTypeValues),
    difficulty: z.enum(questionDifficultyValues),
    scoringRule: z.string().trim().default(""),
    title: z.string().trim().max(255, "Question title is too long.").default(""),
    content: z.string().trim().min(20, "Question content must be at least 20 characters."),
    imageUrl: z.string().trim().max(2048, "Question image URL is too long.").default(""),
    correctAnswerText: z
      .string()
      .trim()
      .max(5000, "Correct answer text is too long.")
      .default(""),
    gradingRubric: z
      .string()
      .trim()
      .max(10000, "Grading rubric is too long.")
      .default(""),
    manualExplanation: z
      .string()
      .trim()
      .max(10000, "Manual explanation is too long.")
      .default(""),
    aiExplanation: z
      .string()
      .trim()
      .max(10000, "AI explanation is too long.")
      .default(""),
    year: z.string().trim().max(4, "Year is too long.").default(""),
    points: z.string().trim().min(1, "Points are required."),
    status: z.enum(questionStatusValues),
    options: z.array(questionOptionFormSchema).max(10, "A maximum of 10 options is allowed.").default([]),
  })
  .superRefine((value, ctx) => {
    if (value.type === "multiple_answer" && !value.scoringRule) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["scoringRule"],
        message: "Scoring rule is required for multiple answer questions.",
      })
    }

    if (isChoiceQuestionType(value.type)) {
      const optionCount = value.options.filter(
        (option) => option.content.trim().length > 0 || option.imageUrl.trim().length > 0,
      ).length

      if (value.type !== "true_false" && optionCount < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["options"],
          message: "At least two options are required.",
        })
      }

      if (value.type === "multiple_choice") {
        const correctCount = value.options.filter((option) => option.isCorrect).length

        if (correctCount !== 1) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["options"],
            message: "Multiple choice questions must have exactly one correct option.",
          })
        }
      }

      if (value.type === "multiple_answer") {
        const correctCount = value.options.filter((option) => option.isCorrect).length

        if (correctCount < 2) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["options"],
            message: "Multiple answer questions must have at least two correct options.",
          })
        }
      }

      if (value.type === "true_false") {
        const normalized = value.correctAnswerText.trim().toLowerCase()

        if (normalized !== "true" && normalized !== "false") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["correctAnswerText"],
            message: "True / False questions must use true or false as the correct answer.",
          })
        }
      }
    }

    if (isSubjectiveQuestionType(value.type)) {
      if (value.scoringRule.trim().length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["scoringRule"],
          message: "Scoring rule is only used for multiple answer questions.",
        })
      }
    }

    if (value.year.trim().length > 0) {
      const year = Number(value.year)

      if (!Number.isInteger(year) || year < 1900 || year > 2100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["year"],
          message: "Year must be a valid year between 1900 and 2100.",
        })
      }
    }

    const points = Number(value.points)

    if (!Number.isFinite(points) || points <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["points"],
        message: "Points must be greater than 0.",
      })
    }

    if (value.examTypeId && value.subjectId && value.topicId) {
      // Relation checks are handled in the service layer. The form keeps this light.
    }
  })

export type QuestionFormValues = z.infer<typeof questionFormSchema>

export const questionImportRowSchema = z.object({
  examTypeSlug: z.string().trim().min(1, "exam_type_slug is required."),
  subjectSlug: z.string().trim().min(1, "subject_slug is required."),
  topicSlug: z.string().trim().default(""),
  questionType: z.enum(questionTypeValues),
  difficulty: z.enum(questionDifficultyValues),
  questionContent: z.string().trim().min(20, "question_content is required."),
  optionA: z.string().trim().default(""),
  optionB: z.string().trim().default(""),
  optionC: z.string().trim().default(""),
  optionD: z.string().trim().default(""),
  optionE: z.string().trim().default(""),
  correctAnswer: z.string().trim().default(""),
  scoringRule: z.string().trim().default(""),
  explanation: z.string().trim().default(""),
  year: z.string().trim().default(""),
  points: z.string().trim().default(""),
})

export type QuestionImportRowValues = z.infer<typeof questionImportRowSchema>

export const questionAiGenerateFormSchema = z.object({
  examTypeId: z.string().trim().min(1, "Select an exam type."),
  subjectId: z.string().trim().min(1, "Select a subject."),
  topicId: z.string().trim().default(""),
  type: z.enum(questionTypeValues),
  difficulty: z.enum(questionDifficultyValues),
  questionCount: z.string().trim().min(1, "Question count is required."),
  prompt: z.string().trim().min(20, "Prompt must be at least 20 characters."),
  points: z.string().trim().min(1, "Points are required."),
  status: z.enum(questionStatusValues).default("draft"),
})

export type QuestionAiGenerateFormValues = z.infer<typeof questionAiGenerateFormSchema>
