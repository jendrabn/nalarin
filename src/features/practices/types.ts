export type PracticeMode = "practice" | "quiz"

export type PracticeQuestionType =
  | "multiple_choice"
  | "multiple_answer"
  | "short_answer"
  | "true_false"

export type PracticeQuestionSnapshot = {
  id: number
  title: string | null
  content: string
  type: PracticeQuestionType
  difficulty: "easy" | "medium" | "hard"
  scoringRule: "all_or_nothing" | "partial" | null
  imageUrl: string | null
  explanation: string | null
  manualExplanation: string | null
  aiExplanation: string | null
  year: number | null
  points: number
}

export type PracticeOptionSnapshot = {
  id: number
  label: string
  content: string
  imageUrl: string | null
}

export type PracticeCorrectAnswerSnapshot = {
  optionKeys: string[]
  answerText: string | null
}

export type PracticeRoomQuestion = {
  id: number
  practiceQuestionId: number
  questionId: number
  orderIndex: number
  points: number
  question: PracticeQuestionSnapshot
  options: PracticeOptionSnapshot[]
  correctAnswer: PracticeCorrectAnswerSnapshot
}

export type PracticeRoomAnswer = {
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

export type PracticeRoomData = {
  id: number
  practiceId: number
  title: string
  examTypeName: string
  subjectName: string
  mode: PracticeMode
  status: "pending" | "in_progress" | "submitted" | "grading" | "graded" | "cancelled"
  startedAt: string
  durationMinutes: number | null
  currentQuestionOrder: number | null
  totalQuestions: number
  questions: PracticeRoomQuestion[]
  answers: PracticeRoomAnswer[]
}

export type PracticeSessionReviewQuestion = PracticeRoomQuestion & {
  answer: PracticeRoomAnswer | null
  status: "correct" | "wrong" | "unanswered"
}

export type PracticeSessionSummary = {
  id: number
  practiceId: number
  title: string
  examTypeName: string
  subjectName: string
  mode: PracticeMode
  status: "pending" | "in_progress" | "submitted" | "grading" | "graded" | "cancelled"
  startedAt: string
  submittedAt: string | null
  gradedAt: string | null
  durationSeconds: number
  totalQuestions: number
  totalCorrect: number
  totalWrong: number
  totalUnanswered: number
  totalScore: number
  totalMaxScore: number
  accuracy: number
  questions: PracticeSessionReviewQuestion[]
}
