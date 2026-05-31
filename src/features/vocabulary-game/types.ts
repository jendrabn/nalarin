import type {
  VocabularyGameDifficulty,
  VocabularyGameLanguage,
  VocabularyGameType,
} from "./constants"

export type VocabularyGameConfig = {
  language: VocabularyGameLanguage
  difficulty: VocabularyGameDifficulty
  type: VocabularyGameType
  count: number
}

export type VocabularyGameQuestion = {
  vocabularyId: number
  word: string
  language: Exclude<VocabularyGameLanguage, "all">
  difficulty: Exclude<VocabularyGameDifficulty, "all">
  type: Exclude<VocabularyGameType, "all">
  correctMeaning: string
  wrongMeaning: string
  leftOption: string
  rightOption: string
  correctSide: "left" | "right"
  exampleSentence: string | null
}

export type VocabularyGameSession = {
  config: VocabularyGameConfig
  availableCount: number
  requestedCount: number
  totalQuestions: number
  questions: VocabularyGameQuestion[]
}

export type VocabularyGameAnswer = {
  questionId: number
  selectedSide: "left" | "right"
  isCorrect: boolean
}
