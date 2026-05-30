import { z } from "zod"

import { contentStatusValues, questionDifficultyValues } from "@/db/schema"

import {
  vocabularyStatusValues,
  vocabularyLanguageValues,
  vocabularyTypeValues,
} from "../constants"

export const vocabularyFormSchema = z
  .object({
    word: z
      .string()
      .trim()
      .min(1, "Word is required.")
      .max(255, "Word is too long."),
    language: z.enum(vocabularyLanguageValues),
    difficulty: z.enum(questionDifficultyValues),
    type: z.enum(vocabularyTypeValues),
    correctMeaning: z
      .string()
      .trim()
      .min(1, "Correct meaning is required.")
      .max(5000, "Correct meaning is too long."),
    wrongOption1: z
      .string()
      .trim()
      .min(1, "At least one wrong option is required.")
      .max(255, "Wrong option is too long."),
    wrongOption2: z.string().trim().max(255, "Wrong option is too long.").default(""),
    wrongOption3: z.string().trim().max(255, "Wrong option is too long.").default(""),
    exampleSentence: z
      .string()
      .trim()
      .max(5000, "Example sentence is too long.")
      .default(""),
    status: z.enum(contentStatusValues),
  })
  .superRefine((value, ctx) => {
    const wrongOptions = [value.wrongOption1, value.wrongOption2, value.wrongOption3].filter(
      (option) => option.trim().length > 0,
    )

    if (wrongOptions.length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["wrongOption1"],
        message: "Provide at least one wrong option.",
      })
    }

    if (wrongOptions.length > 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["wrongOption3"],
        message: "You can add at most three wrong options.",
      })
    }
  })

export type VocabularyFormValues = z.infer<typeof vocabularyFormSchema>

export const vocabularyImportRowSchema = z
  .object({
    word: z.string().trim().min(1, "word is required.").max(255),
    language: z.enum(vocabularyLanguageValues),
    difficulty: z.enum(questionDifficultyValues),
    type: z.enum(vocabularyTypeValues),
    correctMeaning: z
      .string()
      .trim()
      .min(1, "correct_meaning is required.")
      .max(5000),
    wrongOption1: z
      .string()
      .trim()
      .min(1, "wrong_option_1 is required.")
      .max(255),
    wrongOption2: z.string().trim().max(255).default(""),
    wrongOption3: z.string().trim().max(255).default(""),
    exampleSentence: z.string().trim().max(5000).default(""),
    status: z.enum(vocabularyStatusValues),
  })
  .superRefine((value, ctx) => {
    const wrongOptions = [value.wrongOption1, value.wrongOption2, value.wrongOption3].filter(
      (option) => option.trim().length > 0,
    )

    if (wrongOptions.length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["wrongOption1"],
        message: "wrong_option_1 is required.",
      })
    }
  })

export type VocabularyImportRowValues = z.infer<typeof vocabularyImportRowSchema>
