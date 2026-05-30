import type { ModelEnumValue } from "@/lib/model-enums"
import { modelEnums } from "@/lib/model-enums"

export const vocabularyLanguageValues = modelEnums.vocabularyLanguage.values
export type VocabularyLanguage = ModelEnumValue<"vocabularyLanguage">
export const vocabularyLanguageLabels = modelEnums.vocabularyLanguage.labels

export const vocabularyTypeValues = modelEnums.vocabularyType.values
export type VocabularyType = ModelEnumValue<"vocabularyType">
export const vocabularyTypeLabels = modelEnums.vocabularyType.labels

export const vocabularyDifficultyValues = modelEnums.questionDifficulty.values
export type VocabularyDifficulty = ModelEnumValue<"questionDifficulty">
export const vocabularyDifficultyLabels = modelEnums.questionDifficulty.labels

export const vocabularyStatusValues = modelEnums.contentStatus.values
export type VocabularyStatus = ModelEnumValue<"contentStatus">
export const vocabularyStatusLabels = modelEnums.contentStatus.labels

export const vocabularyColumnLabels = {
  word: "Word",
  language: "Language",
  difficulty: "Difficulty",
  type: "Type",
  correctMeaning: "Correct Meaning",
  wrongOptions: "Wrong Options",
  exampleSentence: "Example Sentence",
  status: "Status",
  createdAt: "Created At",
  updatedAt: "Updated At",
} as const

export const vocabularyImportTemplateFileName = "vocabulary-import-template.xlsx"
