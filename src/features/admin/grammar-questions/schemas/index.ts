import { z } from "zod"

import { contentStatusValues, questionDifficultyValues, vocabularyLanguageValues } from "@/db/schema"

import { grammarQuestionAnswerMaxCount, grammarQuestionStatusValues } from "../constants"
import {
  getGrammarQuestionAnswerValues,
  getGrammarQuestionDistractorValues,
} from "../utils/grammar-question"
import { extractGrammarPlaceholderOrders, normalizeGrammarText } from "@/features/grammar-game/utils"

const grammarFieldTextSchema = z.string().trim().max(255).default("")

export const grammarQuestionFormSchema = z
  .object({
    sentenceTemplate: z
      .string()
      .trim()
      .min(1, "Sentence template is required.")
      .max(5000, "Sentence template is too long."),
    language: z.enum(vocabularyLanguageValues),
    difficulty: z.enum(questionDifficultyValues),
    category: z.string().trim().max(191, "Category is too long.").default(""),
    answer1: grammarFieldTextSchema,
    answer2: grammarFieldTextSchema,
    answer3: grammarFieldTextSchema,
    answer4: grammarFieldTextSchema,
    answer5: grammarFieldTextSchema,
    distractor1: grammarFieldTextSchema,
    distractor2: grammarFieldTextSchema,
    distractor3: grammarFieldTextSchema,
    status: z.enum(grammarQuestionStatusValues),
  })
  .superRefine((value, ctx) => {
    const placeholderOrders = extractGrammarPlaceholderOrders(value.sentenceTemplate)
    const answerValues = getGrammarQuestionAnswerValues(value)
    const distractorValues = getGrammarQuestionDistractorValues(value)

    if (placeholderOrders.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sentenceTemplate"],
        message: "Sentence template must include at least one placeholder.",
      })
    }

    if (placeholderOrders.length > grammarQuestionAnswerMaxCount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sentenceTemplate"],
        message: "Maximum 5 placeholders allowed.",
      })
    }

    placeholderOrders.forEach((order, index) => {
      const expected = index + 1
      if (order !== expected) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["sentenceTemplate"],
          message: `Placeholder order must start from {{ 1 }} and be sequential. Missing {{ ${expected} }}.`,
        })
      }
    })

    const usedAnswerValues = placeholderOrders
      .map((order) => answerValues[order - 1] ?? "")
      .filter((value) => value.trim().length > 0)
    const filledDistractors = distractorValues.filter((value) => value.trim().length > 0)
    const normalizedAnswers = usedAnswerValues.map((value) => normalizeGrammarText(value))
    const normalizedDistractors = filledDistractors.map((value) => normalizeGrammarText(value))

    if (value.status === "published") {
      placeholderOrders.forEach((order) => {
        const answer = answerValues[order - 1] ?? ""
        if (answer.trim().length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [`answer${order}` as const],
            message: `Answer for blank {{ ${order} }} is required.`,
          })
        }
      })

      if (filledDistractors.length < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["distractor1"],
          message: "At least one distractor is required.",
        })
      }

      const overlap = normalizedAnswers.find((answer) =>
        normalizedDistractors.includes(answer),
      )

      if (overlap) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["distractor1"],
          message: "Correct answers cannot appear in distractors.",
        })
      }
    }
  })

export type GrammarQuestionFormValues = z.infer<typeof grammarQuestionFormSchema>

export const grammarQuestionImportRowSchema = z
  .object({
    sentenceTemplate: z
      .string()
      .trim()
      .min(1, "sentence_template is required.")
      .max(5000),
    answer1: grammarFieldTextSchema,
    answer2: grammarFieldTextSchema,
    answer3: grammarFieldTextSchema,
    answer4: grammarFieldTextSchema,
    answer5: grammarFieldTextSchema,
    language: z.enum(vocabularyLanguageValues),
    difficulty: z.enum(questionDifficultyValues),
    category: z.string().trim().max(191).default(""),
    distractor1: grammarFieldTextSchema,
    distractor2: grammarFieldTextSchema,
    distractor3: grammarFieldTextSchema,
    status: z.enum(contentStatusValues),
  })
  .superRefine((value, ctx) => {
    const placeholderOrders = extractGrammarPlaceholderOrders(value.sentenceTemplate)
    const answerValues = getGrammarQuestionAnswerValues(value)
    const distractorValues = getGrammarQuestionDistractorValues(value)

    if (placeholderOrders.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sentenceTemplate"],
        message: "sentence_template must include at least one placeholder.",
      })
    }

    if (placeholderOrders.length > grammarQuestionAnswerMaxCount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sentenceTemplate"],
        message: "Maximum 5 placeholders allowed.",
      })
    }

    placeholderOrders.forEach((order, index) => {
      const expected = index + 1
      if (order !== expected) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["sentenceTemplate"],
          message: `Placeholder order must start from {{ 1 }} and be sequential. Missing {{ ${expected} }}.`,
        })
      }
    })

    placeholderOrders.forEach((order) => {
      const answer = answerValues[order - 1] ?? ""
      if (answer.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [`answer${order}` as const],
          message: `answer_${order} is required.`,
        })
      }
    })

    const filledAnswers = placeholderOrders
      .map((order) => answerValues[order - 1] ?? "")
      .filter((value) => value.trim().length > 0)
    const filledDistractors = distractorValues.filter((value) => value.trim().length > 0)

    if (filledDistractors.length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["distractor1"],
        message: "distractor_1 is required.",
      })
    }

    const overlap = filledAnswers
      .map((answer) => normalizeGrammarText(answer))
      .find((answer) =>
        filledDistractors.map((distractor) => normalizeGrammarText(distractor)).includes(answer),
      )

    if (overlap) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["distractor1"],
        message: "Answers cannot appear in distractors.",
      })
    }
  })

export type GrammarQuestionImportRowValues = z.infer<
  typeof grammarQuestionImportRowSchema
>
