import { contentStatusValues, questionDifficultyValues, vocabularyLanguageValues, vocabularyTypeValues } from "@/db/schema"
import type { ModelEnumValue } from "@/lib/model-enums"
import { modelEnums } from "@/lib/model-enums"

export const vocabularyGameLanguageValues = ["all", ...vocabularyLanguageValues] as const
export type VocabularyGameLanguage = (typeof vocabularyGameLanguageValues)[number]
export const vocabularyGameLanguageLabels = {
  all: "Campuran",
  ...modelEnums.vocabularyLanguage.labels,
} as const

export const vocabularyGameDifficultyValues = ["all", ...questionDifficultyValues] as const
export type VocabularyGameDifficulty = (typeof vocabularyGameDifficultyValues)[number]
export const vocabularyGameDifficultyLabels = {
  all: "Campuran",
  ...modelEnums.questionDifficulty.labels,
} as const

export const vocabularyGameTypeValues = ["all", ...vocabularyTypeValues] as const
export type VocabularyGameType = (typeof vocabularyGameTypeValues)[number]
export const vocabularyGameTypeLabels = {
  all: "Campuran",
  ...modelEnums.vocabularyType.labels,
} as const

export const vocabularyGameCountValues = [10, 20, 30] as const
export type VocabularyGameCount = (typeof vocabularyGameCountValues)[number]

export const vocabularyGameStatusValues = contentStatusValues
export type VocabularyGameStatus = ModelEnumValue<"contentStatus">

export const vocabularyGameConfigDefaults = {
  language: "all",
  difficulty: "all",
  type: "all",
  count: 20,
} as const
