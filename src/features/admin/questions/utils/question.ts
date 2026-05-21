import {
  questionOptionMaxCount,
  questionOptionMinCount,
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
  return type === "short_answer"
}

export function getNextQuestionOptionLabel(index: number) {
  return questionOptionLabelValues[index] ?? null
}

function normalizeQuestionOptionCount(count: number) {
  if (!Number.isFinite(count)) {
    return questionOptionMinCount
  }

  return Math.min(
    Math.max(Math.trunc(count), questionOptionMinCount),
    questionOptionMaxCount,
  )
}

export function resizeQuestionChoiceOptions(
  options: QuestionOptionInput[],
  count: number,
) {
  const normalizedCount = normalizeQuestionOptionCount(count)

  return questionOptionLabelValues.slice(0, normalizedCount).map((label, index) => ({
    label,
    content: options[index]?.content ?? "",
    imageUrl: options[index]?.imageUrl ?? "",
    isCorrect: Boolean(options[index]?.isCorrect),
  }))
}

export function normalizeQuestionChoiceOptions(
  options: QuestionOptionInput[],
  count = options.length,
) {
  return resizeQuestionChoiceOptions(options, count)
}

export function getDefaultQuestionOptionCount(type: QuestionType) {
  if (type === "true_false") {
    return questionOptionMinCount
  }

  if (type === "multiple_choice" || type === "multiple_answer") {
    return questionOptionMinCount
  }

  return 0
}

export function getDefaultQuestionOptions(
  type: QuestionType,
  count = getDefaultQuestionOptionCount(type),
): QuestionOptionInput[] {
  if (type === "true_false") {
    return questionTrueFalseLabels.map((label) => ({
      label,
      content: label,
      imageUrl: "",
      isCorrect: false,
    }))
  }

  if (type === "multiple_choice" || type === "multiple_answer") {
    return resizeQuestionChoiceOptions([], count)
  }

  return []
}

export function ensureQuestionOptions(
  options: QuestionOptionInput[],
  type: QuestionType,
  count?: number,
) {
  if (type === "true_false") {
    return getDefaultQuestionOptions(type).map((option, index) => ({
      ...option,
      content: options[index]?.content?.trim() || option.content,
      imageUrl: options[index]?.imageUrl?.trim() || "",
      isCorrect: false,
    }))
  }

  if (type === "multiple_choice" || type === "multiple_answer") {
    return resizeQuestionChoiceOptions(options, count ?? options.length).map((option) => ({
      ...option,
      content: option.content.trim(),
      imageUrl: option.imageUrl.trim(),
      isCorrect: Boolean(option.isCorrect),
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
