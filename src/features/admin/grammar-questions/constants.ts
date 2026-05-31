import type { ModelEnumValue } from "@/lib/model-enums"
import { modelEnums } from "@/lib/model-enums"
import { contentStatusValues, questionDifficultyValues, vocabularyLanguageValues } from "@/db/schema"

import {
  grammarQuestionImportTemplateFileName,
} from "@/features/grammar-game/constants"

export const grammarQuestionLanguageValues = vocabularyLanguageValues
export type GrammarQuestionLanguage = ModelEnumValue<"vocabularyLanguage">
export const grammarQuestionLanguageLabels = modelEnums.vocabularyLanguage.labels

export const grammarQuestionDifficultyValues = questionDifficultyValues
export type GrammarQuestionDifficulty = ModelEnumValue<"questionDifficulty">
export const grammarQuestionDifficultyLabels = modelEnums.questionDifficulty.labels

export const grammarQuestionStatusValues = contentStatusValues
export type GrammarQuestionStatus = ModelEnumValue<"contentStatus">
export const grammarQuestionStatusLabels = modelEnums.contentStatus.labels

export const grammarQuestionColumnLabels = {
  id: "ID",
  sentenceTemplate: "Sentence Template",
  language: "Language",
  difficulty: "Difficulty",
  category: "Category",
  blankCount: "Blanks",
  distractorCount: "Distractors",
  status: "Status",
  createdAt: "Created At",
  updatedAt: "Updated At",
} as const

export const grammarQuestionAnswerMaxCount = 5
export const grammarQuestionDistractorMaxCount = 3

export { grammarQuestionImportTemplateFileName }

