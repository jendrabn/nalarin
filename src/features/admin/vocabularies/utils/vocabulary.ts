export function normalizeNullableText(value: string) {
  const trimmed = value.trim()

  return trimmed.length > 0 ? trimmed : null
}

export function buildVocabularyWrongOptions(values: {
  wrongOption1: string
  wrongOption2?: string
  wrongOption3?: string
}) {
  return [values.wrongOption1, values.wrongOption2 ?? "", values.wrongOption3 ?? ""]
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
}

export function formatVocabularyWrongOptions(values: string[]) {
  return values.map((value, index) => `${index + 1}. ${value}`).join("\n")
}

export function previewVocabularyText(value: string | null | undefined, limit = 90) {
  const text = value?.trim() ?? ""

  if (!text) {
    return ""
  }

  if (text.length <= limit) {
    return text
  }

  return `${text.slice(0, limit).trimEnd()}…`
}
