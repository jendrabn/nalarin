import {
  extractGrammarPlaceholderOrders,
  normalizeGrammarText,
  parseGrammarSentenceTemplate,
} from "@/features/grammar-game/utils"

export function getGrammarQuestionBlankCount(sentenceTemplate: string) {
  return extractGrammarPlaceholderOrders(sentenceTemplate).length
}

export function previewGrammarQuestionSentence(sentenceTemplate: string) {
  const parsed = parseGrammarSentenceTemplate(sentenceTemplate)

  return parsed.segments
    .map((segment) =>
      segment.type === "text" ? segment.text : `[[${segment.order}]]`,
    )
    .join("")
    .trim()
}

export function normalizeGrammarNullableText(value: string) {
  const normalized = value.trim()

  return normalized.length > 0 ? normalized : null
}

export function normalizeGrammarAnswerText(value: string) {
  return normalizeGrammarText(value)
}

export function getGrammarQuestionAnswerValues(values: {
  answer1: string
  answer2: string
  answer3: string
  answer4: string
  answer5: string
}) {
  return [
    values.answer1,
    values.answer2,
    values.answer3,
    values.answer4,
    values.answer5,
  ]
}

export function getGrammarQuestionDistractorValues(values: {
  distractor1: string
  distractor2: string
  distractor3: string
}) {
  return [values.distractor1, values.distractor2, values.distractor3]
}

export function buildGrammarQuestionAnswers(
  placeholderOrders: number[],
  values: {
    answer1: string
    answer2: string
    answer3: string
    answer4: string
    answer5: string
  },
) {
  const answerValues = getGrammarQuestionAnswerValues(values)

  return placeholderOrders.map((order) => ({
    order,
    answer: (answerValues[order - 1] ?? "").trim(),
  }))
}

export function buildGrammarQuestionDistractors(values: {
  distractor1: string
  distractor2: string
  distractor3: string
}) {
  return getGrammarQuestionDistractorValues(values)
    .map((distractor) => distractor.trim())
    .filter((distractor) => distractor.length > 0)
}
