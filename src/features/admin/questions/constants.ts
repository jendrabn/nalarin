import type { ModelEnumValue } from "@/lib/model-enums"
import { modelEnums } from "@/lib/model-enums"

export const questionTypeValues = modelEnums.questionType.values
export type QuestionType = ModelEnumValue<"questionType">
export const questionTypeLabels = modelEnums.questionType.labels

export const questionDifficultyValues = modelEnums.questionDifficulty.values
export type QuestionDifficulty = ModelEnumValue<"questionDifficulty">
export const questionDifficultyLabels = modelEnums.questionDifficulty.labels

export const questionScoringRuleValues = modelEnums.scoringRule.values
export type QuestionScoringRule = ModelEnumValue<"scoringRule">
export const questionScoringRuleLabels = modelEnums.scoringRule.labels

export const questionStatusValues = modelEnums.contentStatus.values
export type QuestionStatus = ModelEnumValue<"contentStatus">
export const questionStatusLabels = modelEnums.contentStatus.labels

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

export const questionOptionLabelValues = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
] as const

export const questionOptionMinCount = 2
export const questionOptionMaxCount = questionOptionLabelValues.length

export const questionTrueFalseLabels = ["True", "False"] as const
