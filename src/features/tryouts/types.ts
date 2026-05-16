import type {
  PracticeCorrectAnswerSnapshot,
  PracticeOptionSnapshot,
  PracticeQuestionSnapshot,
  PracticeQuestionType,
} from "@/features/practices/types"

export type TryoutSessionStatus =
  | "pending"
  | "in_progress"
  | "submitted"
  | "grading"
  | "graded"
  | "cancelled"

export type TryoutNavigationMode = "free" | "sequential"

export type TryoutQuestionType = PracticeQuestionType
export type TryoutQuestionSnapshot = PracticeQuestionSnapshot
export type TryoutOptionSnapshot = PracticeOptionSnapshot
export type TryoutCorrectAnswerSnapshot = PracticeCorrectAnswerSnapshot

export type TryoutSectionSummary = {
  id: number
  tryoutSectionId: number
  title: string
  description: string | null
  subjectName: string
  subjectCode: string | null
  orderIndex: number
  status: TryoutSessionStatus
  durationMinutes: number
  totalQuestions: number
  answeredCount: number
  markedCount: number
  correctCount: number
  wrongCount: number
  unansweredCount: number
  score: number
  currentQuestionOrder: number | null
  startedAt: string | null
  submittedAt: string | null
  gradedAt: string | null
}

export type TryoutSessionOverviewData = {
  id: number
  tryoutId: number
  tryoutSlug: string
  title: string
  description: string | null
  examTypeName: string
  status: TryoutSessionStatus
  navigationMode: TryoutNavigationMode
  allowReviewBeforeSubmit: boolean
  startedAt: string
  submittedAt: string | null
  gradedAt: string | null
  totalQuestions: number
  totalSections: number
  totalDurationMinutes: number
  totalAnswered: number
  totalMarked: number
  totalScore: number
  totalMaxScore: number
  totalSectionsStarted: number
  durationUsedSeconds: number
  sections: TryoutSectionSummary[]
}

export type TryoutRoomQuestion = {
  id: number
  tryoutQuestionId: number
  questionId: number
  orderIndex: number
  displayOrder: number
  points: number
  question: TryoutQuestionSnapshot
  options: TryoutOptionSnapshot[]
  correctAnswer: TryoutCorrectAnswerSnapshot
}

export type TryoutRoomAnswer = {
  sessionQuestionId: number
  selectedOptionKeys: string[]
  answerText: string
  isMarkedForReview: boolean
  isCorrect: boolean | null
  score: number | null
  maxScore: number | null
  gradingStatus: "not_required" | "pending" | "graded" | "needs_review"
  gradedAt: string | null
}

export type TryoutSectionRoomData = {
  sessionId: number
  tryoutId: number
  tryoutSlug: string
  title: string
  examTypeName: string
  navigationMode: TryoutNavigationMode
  allowReviewBeforeSubmit: boolean
  sessionStatus: TryoutSessionStatus
  section: TryoutSectionSummary
  sections: TryoutSectionSummary[]
  questions: TryoutRoomQuestion[]
  answers: TryoutRoomAnswer[]
}
