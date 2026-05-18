export type ProgressPeriod = "7d" | "30d" | "90d" | "all"

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

export type ProgressSubject = {
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
  title: string
  examTypeName: string
  subjectName: string | null
  completedAt: string | null
  score: number
  maxScore: number
  correct: number
  wrong: number
  unanswered: number
  reviewHref: string | null
}

export type ProgressStreakDay = {
  date: string
  count: number
  level: 0 | 1 | 2 | 3 | 4
}

export type ProgressStreak = {
  days: ProgressStreakDay[]
  currentStreak: number
  longestStreak: number
  activeDays: number
  totalSessions: number
}

export type ProgressPageData = {
  activePeriod: ProgressPeriod
  examTypes: ProgressExamType[]
  subjects: ProgressSubject[]
  activeExamType: ProgressExamType | null
  activeSubject: ProgressSubject | null
  summary: ProgressSummary
  streak: ProgressStreak
  activities: ProgressActivityItem[]
}
