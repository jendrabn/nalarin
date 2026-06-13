import {
  grammarGameConfigDefaults,
  grammarGameCountValues,
  grammarGameDifficultyValues,
  grammarGameLanguageValues,
  type GrammarGameCount,
  type GrammarGameDifficulty,
  type GrammarGameLanguage,
} from "./constants"
import type {
  GrammarSentenceSegment,
} from "./types"

export function getSingleQueryValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0]?.trim() ?? ""
  }

  return value?.trim() ?? ""
}

export function normalizeGrammarText(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase()
}

export function parseGrammarGameLanguage(value: string): GrammarGameLanguage {
  const normalized = value.trim().toLowerCase()

  return grammarGameLanguageValues.includes(
    normalized as (typeof grammarGameLanguageValues)[number],
  )
    ? (normalized as GrammarGameLanguage)
    : grammarGameConfigDefaults.language
}

export function parseGrammarGameDifficulty(value: string): GrammarGameDifficulty {
  const normalized = value.trim().toLowerCase()

  return grammarGameDifficultyValues.includes(
    normalized as (typeof grammarGameDifficultyValues)[number],
  )
    ? (normalized as GrammarGameDifficulty)
    : grammarGameConfigDefaults.difficulty
}

export function parseGrammarGameCategory(value: string) {
  const normalized = value.trim()

  return normalized.length > 0 ? normalized : grammarGameConfigDefaults.category
}

export function parseGrammarGameCount(value: string): GrammarGameCount {
  const parsed = Number(value)

  return grammarGameCountValues.includes(parsed as (typeof grammarGameCountValues)[number])
    ? (parsed as GrammarGameCount)
    : grammarGameConfigDefaults.count
}

export function parseGrammarGameConfig(searchParams: {
  language?: string | string[]
  difficulty?: string | string[]
  category?: string | string[]
  count?: string | string[]
}) {
  return {
    language: parseGrammarGameLanguage(getSingleQueryValue(searchParams.language)),
    difficulty: parseGrammarGameDifficulty(getSingleQueryValue(searchParams.difficulty)),
    category: parseGrammarGameCategory(getSingleQueryValue(searchParams.category)),
    count: parseGrammarGameCount(getSingleQueryValue(searchParams.count)),
  }
}

export function buildGrammarGameSearchParams(
  config: {
    language: string
    difficulty: string
    category: string
    count: number
  },
  session?: string,
) {
  const params = new URLSearchParams()
  params.set("language", config.language)
  params.set("difficulty", config.difficulty)
  params.set("category", config.category)
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

export function getGrammarGameAccuracy(correctCount: number, totalCount: number) {
  if (totalCount === 0) {
    return 0
  }

  return Math.round((correctCount / totalCount) * 100)
}

export function extractGrammarPlaceholderOrders(template: string) {
  const orders: number[] = []
  const regex = /\{\{\s*(\d+)\s*\}\}/g

  for (const match of template.matchAll(regex)) {
    const order = Number(match[1])
    if (Number.isInteger(order) && order > 0) {
      orders.push(order)
    }
  }

  return orders
}

export function parseGrammarSentenceTemplate(template: string): {
  segments: GrammarSentenceSegment[]
  placeholderOrders: number[]
  errors: string[]
} {
  const errors: string[] = []
  const segments: GrammarSentenceSegment[] = []
  const placeholderOrders: number[] = []
  const regex = /\{\{\s*(\d+)\s*\}\}/g
  let lastIndex = 0

  for (const match of template.matchAll(regex)) {
    const index = match.index ?? 0

    if (index > lastIndex) {
      segments.push({
        type: "text",
        text: template.slice(lastIndex, index),
      })
    }

    const order = Number(match[1])
    placeholderOrders.push(order)
    segments.push({
      type: "blank",
      order,
    })
    lastIndex = index + match[0].length
  }

  if (lastIndex < template.length) {
    segments.push({
      type: "text",
      text: template.slice(lastIndex),
    })
  }

  if (placeholderOrders.length === 0) {
    errors.push("Sentence template must include at least one placeholder.")
  }

  if (placeholderOrders.length > 5) {
    errors.push("Maximum 5 placeholders allowed.")
  }

  const seenOrders = new Set<number>()

  for (let index = 0; index < placeholderOrders.length; index += 1) {
    const expectedOrder = index + 1
    const order = placeholderOrders[index] ?? 0

    if (seenOrders.has(order)) {
      errors.push(`Placeholder {{ ${order} }} is duplicated.`)
      break
    }

    seenOrders.add(order)

    if (order !== expectedOrder) {
      errors.push(
        `Placeholder order must start from {{ 1 }} and be sequential. Missing {{ ${expectedOrder} }}.`,
      )
      break
    }
  }

  return {
    segments:
      segments.length > 0
        ? segments
        : [{ type: "text", text: template }],
    placeholderOrders,
    errors,
  }
}
