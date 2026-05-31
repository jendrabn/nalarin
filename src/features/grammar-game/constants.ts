import type { ModelEnumValue } from "@/lib/model-enums"
import { modelEnums } from "@/lib/model-enums"
import { questionDifficultyValues, vocabularyLanguageValues } from "@/db/schema"

export const grammarGameLanguageValues = ["all", ...vocabularyLanguageValues] as const
export type GrammarGameLanguage = (typeof grammarGameLanguageValues)[number]
export const grammarGameLanguageLabels = {
  all: "Semua Bahasa",
  ...modelEnums.vocabularyLanguage.labels,
} as const

export const grammarGameDifficultyValues = ["all", ...questionDifficultyValues] as const
export type GrammarGameDifficulty = (typeof grammarGameDifficultyValues)[number]
export const grammarGameDifficultyLabels = {
  all: "Semua Level",
  ...modelEnums.questionDifficulty.labels,
} as const

export const grammarGameCountValues = [5, 10, 15] as const
export type GrammarGameCount = (typeof grammarGameCountValues)[number]

export const grammarGameConfigDefaults = {
  language: "all",
  difficulty: "all",
  category: "all",
  count: 10,
} as const

export const grammarQuestionStatusValues = modelEnums.contentStatus.values
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

export const grammarQuestionImportTemplateFileName =
  "grammar-question-import-template.xlsx"

