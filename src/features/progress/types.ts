export type ProgressTopicSnapshot = {
  topic_id: number
  topic_name: string
  accuracy: number
}

export type ProgressExamType = {
  id: number
  name: string
  slug: string
}

export type ProgressSummary = {
  totalQuestionsAnswered: number
  totalCorrect: number
  totalWrong: number
  averageScore: number | null
  accuracy: number | null
  totalScoreAggregate: number
  totalMaxScoreAggregate: number
  strongestTopics: ProgressTopicSnapshot[]
  weakestTopics: ProgressTopicSnapshot[]
  snapshotDate: string | null
}

export type ProgressActivityItem = {
  id: number
  type: "practice" | "tryout"
  practiceMode?: "practice" | "quiz"
  title: string
  examTypeName: string
  completedAt: string | null
  score: number
  maxScore: number
  scoreDisplay: "ratio" | "scaled"
  correct: number
  wrong: number
  unanswered: number
  reviewHref: string | null
}

export type ProgressPageData = {
  examTypes: ProgressExamType[]
  activeExamType: ProgressExamType | null
  summary: ProgressSummary
  activities: ProgressActivityItem[]
}
