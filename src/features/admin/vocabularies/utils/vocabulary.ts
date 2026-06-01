export function normalizeNullableText(value: string) {
  const trimmed = value.trim()

  return trimmed.length > 0 ? trimmed : null
}

export function normalizeVocabularyWrongOption(value: string) {
  return value.trim()
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
