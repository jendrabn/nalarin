import {
  questionOptionLabelValues,
  questionTypeValues,
  questionTrueFalseLabels,
  type QuestionType,
} from "../constants"

export type QuestionOptionInput = {
  label: string
  content: string
  imageUrl: string
  isCorrect: boolean
}

export function stripHtml(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function previewQuestionContent(value: string, limit = 120) {
  const plainText = stripHtml(value)

  if (plainText.length <= limit) {
    return plainText
  }

  return `${plainText.slice(0, limit).trimEnd()}...`
}

export function normalizeNullableText(value: string) {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function parseOptionalInteger(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return null
  }

  const parsed = Number(trimmed)

  if (!Number.isInteger(parsed)) {
    return null
  }

  return parsed
}

export function parseOptionalDecimal(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return null
  }

  const parsed = Number(trimmed)

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null
  }

  return parsed
}

export function isChoiceQuestionType(type: QuestionType) {
  return (
    type === "multiple_choice" ||
    type === "multiple_answer" ||
    type === "true_false"
  )
}

export function isSubjectiveQuestionType(type: QuestionType) {
  return type === "short_answer" || type === "essay"
}

export function getDefaultQuestionOptions(type: QuestionType): QuestionOptionInput[] {
  if (type === "true_false") {
    return questionTrueFalseLabels.map((label) => ({
      label,
      content: label,
      imageUrl: "",
      isCorrect: false,
    }))
  }

  if (type === "multiple_choice" || type === "multiple_answer") {
    return questionOptionLabelValues.map((label) => ({
      label,
      content: "",
      imageUrl: "",
      isCorrect: false,
    }))
  }

  return []
}

export function ensureQuestionOptions(options: QuestionOptionInput[], type: QuestionType) {
  if (type === "true_false") {
    return getDefaultQuestionOptions(type).map((option, index) => ({
      ...option,
      content: options[index]?.content?.trim() || option.content,
      imageUrl: options[index]?.imageUrl?.trim() || "",
      isCorrect: false,
    }))
  }

  if (type === "multiple_choice" || type === "multiple_answer") {
    return questionOptionLabelValues.map((label, index) => ({
      label,
      content: options[index]?.content?.trim() || "",
      imageUrl: options[index]?.imageUrl?.trim() || "",
      isCorrect: Boolean(options[index]?.isCorrect),
    }))
  }

  return []
}

export function getCorrectOptionLabels(options: QuestionOptionInput[]) {
  return options
    .filter((option) => option.isCorrect)
    .map((option) => option.label.trim().toUpperCase())
}

export function questionTypeSupportsOptions(type: QuestionType) {
  return questionTypeValues.includes(type) && isChoiceQuestionType(type)
}
