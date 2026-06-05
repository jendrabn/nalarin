import type { PracticeQuestionType } from "@/features/practices/types"

export const IRT_SCORE_MIN = 200
export const IRT_SCORE_MEAN = 500
export const IRT_SCORE_STANDARD_DEVIATION = 100

const IRT_THETA_MIN = -4
const IRT_THETA_MAX = 8
const IRT_THETA_STEP = 0.025
const IRT_THETA_PRIOR_STANDARD_DEVIATION = 2.5

export type IrtItemParameters = {
  discrimination: number
  difficulty: number
  guessing: number
}

export type IrtItemResponse = {
  isCorrect: boolean
  questionType: PracticeQuestionType
  optionCount: number
  parameters?: IrtItemParameters
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

  return Math.max(IRT_SCORE_MIN, scaledScore)
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
  const parameters = item.parameters ?? getDefaultIrtItemParameters(item)
  const logistic =
    1 /
    (1 +
      Math.exp(
        -parameters.discrimination * (theta - parameters.difficulty),
      ))

  return parameters.guessing + (1 - parameters.guessing) * logistic
}

export function getDefaultIrtItemParameters(item: {
  questionType: PracticeQuestionType
  optionCount: number
}): IrtItemParameters {
  return {
    discrimination: 1,
    difficulty: 0,
    guessing: getIrtGuessingValue(item),
  }
}

export function getIrtGuessingValue(item: {
  questionType: PracticeQuestionType
  optionCount: number
}) {
  if (item.questionType === "multiple_choice" || item.questionType === "true_false") {
    return item.optionCount > 1 ? 1 / item.optionCount : 0
  }

  return 0
}
