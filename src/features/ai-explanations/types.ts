import type {
  PracticeCorrectAnswerSnapshot,
  PracticeOptionSnapshot,
  PracticeQuestionSnapshot,
} from "@/features/practices/types"

export type AiExplanationSessionType = "practice" | "tryout"

export type AiExplanationAccess = {
  enabled: boolean
  sessionType: AiExplanationSessionType
  sessionId: number
  sessionQuestionId: number
  limitPerMonth?: number | null
  usedThisMonth?: number
}

export type AiExplanationAnswerContext = {
  selectedOptionKeys: string[]
  answerText: string
  isCorrect: boolean | null
}

export type AiExplanationContext = {
  examTypeId: number
  examTypeName: string
  subjectName: string
  topicName: string | null
  question: PracticeQuestionSnapshot
  options: PracticeOptionSnapshot[]
  correctAnswer: PracticeCorrectAnswerSnapshot
  answer: AiExplanationAnswerContext | null
  manualExplanation: string | null
}
