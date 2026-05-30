import {
  vocabularyGameConfigDefaults,
  vocabularyGameCountValues,
  vocabularyGameDifficultyValues,
  vocabularyGameLanguageValues,
  vocabularyGameTypeValues,
  type VocabularyGameDifficulty,
  type VocabularyGameLanguage,
  type VocabularyGameType,
} from "./constants"
import type { VocabularyGameConfig } from "./types"

export function getSingleQueryValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0]?.trim() ?? ""
  }

  return value?.trim() ?? ""
}

export function parseVocabularyGameLanguage(value: string): VocabularyGameLanguage {
  const normalized = value.trim().toLowerCase()

  return vocabularyGameLanguageValues.includes(
    normalized as (typeof vocabularyGameLanguageValues)[number],
  )
    ? (normalized as VocabularyGameLanguage)
    : vocabularyGameConfigDefaults.language
}

export function parseVocabularyGameDifficulty(value: string): VocabularyGameDifficulty {
  const normalized = value.trim().toLowerCase()

  return vocabularyGameDifficultyValues.includes(
    normalized as (typeof vocabularyGameDifficultyValues)[number],
  )
    ? (normalized as VocabularyGameDifficulty)
    : vocabularyGameConfigDefaults.difficulty
}

export function parseVocabularyGameType(value: string): VocabularyGameType {
  const normalized = value.trim().toLowerCase()

  return vocabularyGameTypeValues.includes(
    normalized as (typeof vocabularyGameTypeValues)[number],
  )
    ? (normalized as VocabularyGameType)
    : vocabularyGameConfigDefaults.type
}

export function parseVocabularyGameCount(value: string) {
  const parsed = Number(value)

  return vocabularyGameCountValues.includes(parsed as (typeof vocabularyGameCountValues)[number])
    ? (parsed as (typeof vocabularyGameCountValues)[number])
    : vocabularyGameConfigDefaults.count
}

export function parseVocabularyGameConfig(searchParams: {
  language?: string | string[]
  difficulty?: string | string[]
  type?: string | string[]
  count?: string | string[]
}): VocabularyGameConfig {
  return {
    language: parseVocabularyGameLanguage(getSingleQueryValue(searchParams.language)),
    difficulty: parseVocabularyGameDifficulty(getSingleQueryValue(searchParams.difficulty)),
    type: parseVocabularyGameType(getSingleQueryValue(searchParams.type)),
    count: parseVocabularyGameCount(getSingleQueryValue(searchParams.count)),
  }
}

export function buildVocabularyGameSearchParams(
  config: VocabularyGameConfig,
  session?: string,
) {
  const params = new URLSearchParams()
  params.set("language", config.language)
  params.set("difficulty", config.difficulty)
  params.set("type", config.type)
  params.set("count", String(config.count))

  if (session) {
    params.set("session", session)
  }

  return params.toString()
}

export function shuffleArray<T>(items: T[]) {
  const output = [...items]

  for (let index = output.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[output[index], output[randomIndex]] = [output[randomIndex], output[index]]
  }

  return output
}

export function pickRandom<T>(items: T[]) {
  if (items.length === 0) {
    return null
  }

  return items[Math.floor(Math.random() * items.length)] ?? null
}

export function getVocabularyGameAccuracy(correctCount: number, totalCount: number) {
  if (totalCount === 0) {
    return 0
  }

  return Math.round((correctCount / totalCount) * 100)
}

export function getVocabularyGameLandingConfig(
  config: Partial<VocabularyGameConfig> | null | undefined,
): VocabularyGameConfig {
  return {
    language: config?.language ?? vocabularyGameConfigDefaults.language,
    difficulty: config?.difficulty ?? vocabularyGameConfigDefaults.difficulty,
    type: config?.type ?? vocabularyGameConfigDefaults.type,
    count: config?.count ?? vocabularyGameConfigDefaults.count,
  }
}
