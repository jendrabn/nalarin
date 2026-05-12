import type { ModelEnumValue } from "@/lib/model-enums"
import { modelEnums } from "@/lib/model-enums"

export const practiceStatusValues = modelEnums.contentStatus.values
export type PracticeStatus = ModelEnumValue<"contentStatus">
export const practiceStatusLabels = modelEnums.contentStatus.labels

export const practiceNavigationModeValues = modelEnums.navigationMode.values
export type PracticeNavigationMode = ModelEnumValue<"navigationMode">
export const practiceNavigationModeLabels = modelEnums.navigationMode.labels

export const objectiveQuestionTypes = [
  "multiple_choice",
  "multiple_answer",
  "true_false",
] as const
export type ObjectiveQuestionType = (typeof objectiveQuestionTypes)[number]

export const practiceColumnLabels = {
  title: "Title",
  examType: "Exam Type",
  subject: "Subject",
  topic: "Topic",
  status: "Status",
  access: "Access",
  modes: "Modes",
  questions: "Questions",
  sessions: "Sessions",
  publishedAt: "Published At",
  createdAt: "Created At",
  updatedAt: "Updated At",
} as const
