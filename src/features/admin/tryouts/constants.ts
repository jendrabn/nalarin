import type { ModelEnumValue } from "@/lib/model-enums"
import { modelEnums } from "@/lib/model-enums"

export const tryoutStatusValues = modelEnums.contentStatus.values
export type TryoutStatus = ModelEnumValue<"contentStatus">
export const tryoutStatusLabels = modelEnums.contentStatus.labels

export const tryoutNavigationModeValues = modelEnums.navigationMode.values
export type TryoutNavigationMode = ModelEnumValue<"navigationMode">
export const tryoutNavigationModeLabels = modelEnums.navigationMode.labels

export const tryoutQuestionTypeLabels = modelEnums.questionType.labels
export type TryoutQuestionType = ModelEnumValue<"questionType">

export const tryoutQuestionDifficultyLabels = modelEnums.questionDifficulty.labels
export type TryoutQuestionDifficulty = ModelEnumValue<"questionDifficulty">

export const tryoutColumnLabels = {
  title: "Title",
  examType: "Exam Type",
  status: "Status",
  access: "Access",
  sections: "Sections",
  questions: "Questions",
  sessions: "Sessions",
  startsAt: "Starts At",
  endsAt: "Ends At",
  publishedAt: "Published At",
  createdAt: "Created At",
  updatedAt: "Updated At",
} as const
