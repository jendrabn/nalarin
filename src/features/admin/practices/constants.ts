import type { ModelEnumValue } from "@/lib/model-enums"
import { modelEnums } from "@/lib/model-enums"

export const practiceStatusValues = modelEnums.contentStatus.values
export type PracticeStatus = ModelEnumValue<"contentStatus">
export const practiceStatusLabels = modelEnums.contentStatus.labels

export const practiceQuestionTypes = modelEnums.questionType.values
export type PracticeQuestionType = ModelEnumValue<"questionType">

export const practiceColumnLabels = {
  title: "Title",
  examType: "Exam Type",
  subject: "Subject",
  topic: "Topic",
  status: "Status",
  access: "Access",
  questions: "Questions",
  sessions: "Sessions",
  publishedAt: "Published At",
  createdAt: "Created At",
  updatedAt: "Updated At",
} as const
