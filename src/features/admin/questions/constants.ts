export const questionTypeValues = [
  "multiple_choice",
  "multiple_answer",
  "short_answer",
  "essay",
  "true_false",
] as const

export type QuestionType = (typeof questionTypeValues)[number]

export const questionDifficultyValues = ["easy", "medium", "hard"] as const

export type QuestionDifficulty = (typeof questionDifficultyValues)[number]

export const questionScoringRuleValues = ["all_or_nothing", "partial"] as const

export type QuestionScoringRule = (typeof questionScoringRuleValues)[number]

export const questionStatusValues = ["draft", "published", "archived"] as const

export type QuestionStatus = (typeof questionStatusValues)[number]

export const questionTypeLabels: Record<QuestionType, string> = {
  multiple_choice: "Multiple Choice",
  multiple_answer: "Multiple Answer",
  short_answer: "Short Answer",
  essay: "Essay",
  true_false: "True / False",
}

export const questionDifficultyLabels: Record<QuestionDifficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
}

export const questionScoringRuleLabels: Record<QuestionScoringRule, string> = {
  all_or_nothing: "All or Nothing",
  partial: "Partial",
}

export const questionStatusLabels: Record<QuestionStatus, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
}

export const questionColumnLabels = {
  id: "ID",
  examType: "Exam Type",
  subject: "Subject",
  topic: "Topic",
  type: "Type",
  difficulty: "Difficulty",
  title: "Title",
  status: "Status",
  points: "Points",
  year: "Year",
  optionCount: "Options",
  createdAt: "Created At",
  updatedAt: "Updated At",
} as const

export const questionOptionLabelValues = ["A", "B", "C", "D", "E"] as const

export const questionTrueFalseLabels = ["True", "False"] as const
