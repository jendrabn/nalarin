export type MaterialContentMode = "empty" | "video" | "text" | "mixed"

export function stripHtml(value: string) {
  return value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function normalizeMaterialContent(value: string) {
  const trimmed = value.trim()

  return stripHtml(trimmed).length > 0 ? trimmed : null
}

export function getMaterialContentMode(
  youtubeUrl: string | null | undefined,
  content: string | null | undefined,
): MaterialContentMode {
  const hasVideo = Boolean(youtubeUrl?.trim())
  const hasText = Boolean(stripHtml(content ?? "").length)

  if (hasVideo && hasText) {
    return "mixed"
  }

  if (hasVideo) {
    return "video"
  }

  if (hasText) {
    return "text"
  }

  return "empty"
}

export function previewMaterialContent(value: string | null | undefined, limit = 120) {
  const plainText = stripHtml(value ?? "")

  if (plainText.length <= limit) {
    return plainText
  }

  return `${plainText.slice(0, limit).trimEnd()}...`
}

