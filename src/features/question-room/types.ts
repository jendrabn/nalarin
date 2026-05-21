import type { PracticeQuestionType } from "@/features/practices/types"

export type QuestionSnapshotLike = {
  title: string | null
  content: string
  type: PracticeQuestionType
  imageUrl: string | null
  explanation: string | null
}

export type QuestionOptionLike = {
  label: string
  content: string
  imageUrl: string | null
}

export type QuestionCorrectAnswerLike = {
  optionKeys: string[]
  answerText: string | null
}

export type QuestionRoomLike = {
  id: number
  question: QuestionSnapshotLike
  options: QuestionOptionLike[]
  correctAnswer: QuestionCorrectAnswerLike
}

export type QuestionAnswerLike = {
  selectedOptionKeys: string[]
  answerText: string
  isCorrect: boolean | null
  gradedAt: string | null
}

