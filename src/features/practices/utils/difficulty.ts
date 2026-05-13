export type PracticeDifficulty = "easy" | "medium" | "hard"

export type DifficultyCounts = Record<PracticeDifficulty, number>

const difficultyWeights: Record<PracticeDifficulty, number> = {
  easy: 1,
  medium: 2,
  hard: 3,
}

export const practiceDifficultyLabels: Record<PracticeDifficulty, string> = {
  easy: "Mudah",
  medium: "Sedang",
  hard: "Sulit",
}

export function getPracticeDifficulty(counts: DifficultyCounts): PracticeDifficulty {
  const totalQuestions = counts.easy + counts.medium + counts.hard

  if (totalQuestions === 0) {
    return "medium"
  }

  const weightedScore =
    counts.easy * difficultyWeights.easy +
    counts.medium * difficultyWeights.medium +
    counts.hard * difficultyWeights.hard

  const average = weightedScore / totalQuestions

  if (average <= 1.67) {
    return "easy"
  }

  if (average <= 2.34) {
    return "medium"
  }

  return "hard"
}
