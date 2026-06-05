import type { PracticeQuestionType } from "@/features/practices/types"

export const IRT_SCORE_MIN = 200
export const IRT_SCORE_MEAN = 500
export const IRT_SCORE_STANDARD_DEVIATION = 100
export const IRT_SCORE_MAX = 1000

const IRT_THETA_MIN = -3
const IRT_THETA_MAX = 5
const IRT_THETA_STEP = 0.05
const IRT_THETA_PRIOR_STANDARD_DEVIATION = 2.5

export type IrtDifficulty = "easy" | "medium" | "hard"

export type IrtItemResponse = {
  isCorrect: boolean
  difficulty: IrtDifficulty
  questionType: PracticeQuestionType
  optionCount: number
}

export function getIrtDifficulty(value: unknown): IrtDifficulty {
  if (value === "easy" || value === "medium" || value === "hard") {
    return value
  }

  return "medium"
}

export function getIrtOptionCount(value: unknown) {
  return Array.isArray(value) ? value.length : 0
}

export function calculateIrtScore(items: IrtItemResponse[]) {
  if (items.length === 0) {
    return 0
  }

  const theta = estimateIrtTheta(items)
  const scaledScore = IRT_SCORE_MEAN + IRT_SCORE_STANDARD_DEVIATION * theta

  return Math.max(IRT_SCORE_MIN, Math.min(IRT_SCORE_MAX, scaledScore))
}

function estimateIrtTheta(items: IrtItemResponse[]) {
  let bestTheta = 0
  let bestPosterior = Number.NEGATIVE_INFINITY

  for (let theta = IRT_THETA_MIN; theta <= IRT_THETA_MAX + 0.0001; theta += IRT_THETA_STEP) {
    const logLikelihood = items.reduce((total, item) => {
      const probability = Math.max(0.0001, Math.min(0.9999, getIrtProbability(theta, item)))
      return total + (item.isCorrect ? Math.log(probability) : Math.log(1 - probability))
    }, 0)
    const logPrior = -0.5 * (theta / IRT_THETA_PRIOR_STANDARD_DEVIATION) ** 2
    const posterior = logLikelihood + logPrior

    if (posterior > bestPosterior) {
      bestPosterior = posterior
      bestTheta = theta
    }
  }

  return bestTheta
}

function getIrtProbability(theta: number, item: IrtItemResponse) {
  const difficulty = getIrtDifficultyValue(item.difficulty)
  const discrimination = 1
  const guessing = getIrtGuessingValue(item)
  const logistic = 1 / (1 + Math.exp(-discrimination * (theta - difficulty)))

  return guessing + (1 - guessing) * logistic
}

function getIrtDifficultyValue(difficulty: IrtDifficulty) {
  if (difficulty === "easy") {
    return -1
  }

  if (difficulty === "hard") {
    return 1
  }

  return 0
}

function getIrtGuessingValue(item: IrtItemResponse) {
  if (item.questionType === "multiple_choice" || item.questionType === "true_false") {
    return item.optionCount > 1 ? 1 / item.optionCount : 0
  }

  return 0
}
