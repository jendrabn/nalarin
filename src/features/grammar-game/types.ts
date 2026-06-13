import type {
  GrammarGameCount,
  GrammarGameDifficulty,
  GrammarGameLanguage,
} from "./constants"

export type GrammarGameConfig = {
  language: GrammarGameLanguage
  difficulty: GrammarGameDifficulty
  category: string
  count: GrammarGameCount
}

export type GrammarSentenceSegment =
  | {
      type: "text"
      text: string
    }
  | {
      type: "blank"
      order: number
    }

export type GrammarGameChip = {
  id: string
  text: string
}

export type GrammarGameQuestion = {
  id: number
  sentenceTemplate: string
  language: Exclude<GrammarGameLanguage, "all">
  difficulty: Exclude<GrammarGameDifficulty, "all">
  category: string | null
  chips: GrammarGameChip[]
}

export type GrammarGameSession = {
  sessionId: string
  config: GrammarGameConfig
  availableCount: number
  requestedCount: number
  totalQuestions: number
  questions: GrammarGameQuestion[]
  availableCategories: string[]
}

export type GrammarQuestionBlankResult = {
  order: number
  selectedAnswer: string
  correctAnswer: string
  isCorrect: boolean
}

export type GrammarQuestionSubmission = {
  questionId: number
  answers: {
    order: number
    answer: string
  }[]
}

export type GrammarQuestionSubmissionResult = {
  questionId: number
  blankResults: GrammarQuestionBlankResult[]
  correctCount: number
  totalCount: number
}
