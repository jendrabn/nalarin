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
    wrongOption: z
      .string()
      .trim()
      .min(1, "Wrong option is required.")
      .max(255, "Wrong option is too long."),
    exampleSentence: z
      .string()
      .trim()
      .max(5000, "Example sentence is too long.")
      .default(""),
    status: z.enum(contentStatusValues),
  })

export type VocabularyFormValues = z.infer<typeof vocabularyFormSchema>

export const vocabularyImportRowSchema = z.object({
  word: z.string().trim().min(1, "word is required.").max(255),
  language: z.enum(vocabularyLanguageValues),
  difficulty: z.enum(questionDifficultyValues),
  type: z.enum(vocabularyTypeValues),
  correctMeaning: z
    .string()
    .trim()
    .min(1, "correct_meaning is required.")
    .max(5000),
  wrongOption: z
    .string()
    .trim()
    .min(1, "wrong_option is required.")
    .max(255),
  exampleSentence: z.string().trim().max(5000).default(""),
  status: z.enum(vocabularyStatusValues),
})

export type VocabularyImportRowValues = z.infer<typeof vocabularyImportRowSchema>
