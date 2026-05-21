import type { QuestionRoomLike } from "./types"

export type QuestionFeedbackMode = "none" | "practice" | "review"

export type QuestionExplanationItem = {
  label: string
  content: string
}

export function normalizeText(value: string | null | undefined) {
  return value?.trim().replace(/\s+/g, " ").toLowerCase() ?? ""
}

export function getQuestionExplanationItems(question: Pick<QuestionRoomLike, "question">) {
  const items: QuestionExplanationItem[] = []

  if (question.question.explanation) {
    items.push({ label: "Pembahasan", content: question.question.explanation })
  }

  return items
}

export function hasQuestionExplanation(question: Pick<QuestionRoomLike, "question">) {
  return getQuestionExplanationItems(question).length > 0
}

export function isCorrectOptionForQuestion(
  question: QuestionRoomLike,
  optionLabel: string,
  optionContent: string,
) {
  if (question.question.type !== "true_false") {
    return question.correctAnswer.optionKeys.includes(optionLabel)
  }

  const normalizedCorrectAnswer = normalizeText(question.correctAnswer.answerText)
  const normalizedOption = normalizeText(`${optionLabel} ${optionContent}`)

  if (
    normalizedCorrectAnswer === "true" ||
    normalizedCorrectAnswer === "benar" ||
    normalizedCorrectAnswer === "a"
  ) {
    return optionLabel === "A" || normalizedOption.includes("true") || normalizedOption.includes("benar")
  }

  if (
    normalizedCorrectAnswer === "false" ||
    normalizedCorrectAnswer === "salah" ||
    normalizedCorrectAnswer === "b"
  ) {
    return optionLabel === "B" || normalizedOption.includes("false") || normalizedOption.includes("salah")
  }

  return question.correctAnswer.optionKeys.includes(optionLabel)
}

export function getOptionFeedbackClass({
  feedbackMode,
  locked,
  selected,
  isCorrectOption,
  isAnswerCorrect,
}: {
  feedbackMode: QuestionFeedbackMode
  locked: boolean
  selected: boolean
  isCorrectOption: boolean
  isAnswerCorrect: boolean | null
}) {
  if (feedbackMode === "none" || !locked) {
    return null
  }

  if (feedbackMode === "practice") {
    const answerIsCorrect = isAnswerCorrect === true
    const answerIsWrong = isAnswerCorrect === false

    if (selected && answerIsCorrect) {
      return "border-chart-2/35 bg-chart-2/10"
    }

    if (answerIsWrong && isCorrectOption) {
      return "border-primary/35 bg-primary/10"
    }

    if (selected && answerIsWrong) {
      return "border-destructive/35 bg-destructive/10"
    }

    return "opacity-70"
  }

  if (selected && isAnswerCorrect === false) {
    return "border-destructive/35 bg-destructive/10"
  }

  if (isCorrectOption) {
    return "border-primary/35 bg-primary/10"
  }

  return "opacity-70"
}

