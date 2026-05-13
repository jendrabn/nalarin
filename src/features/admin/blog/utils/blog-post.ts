import {
  generateStrongSlugSuffix,
  slugify,
} from "./slug"

export function stripHtml(value: string) {
  return value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function estimateReadTimeMinutes(content: string) {
  const plainText = stripHtml(content)
  const words = plainText.length ? plainText.split(" ").length : 0

  return Math.max(1, Math.ceil(words / 200))
}

export function parseTagsInput(value: string) {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  )
}

export function formatTagsInput(tags: string[] | null | undefined) {
  return tags?.join(", ") ?? ""
}

export function previewBlogPostSlug(title: string, slugSuffix?: string) {
  const normalizedSuffix = normalizeSlugSuffix(slugSuffix) ?? "xxxxx"

  return `${slugify(title)}-${normalizedSuffix}`
}

export function createBlogPostSlug(title: string, slugSuffix?: string) {
  const normalizedSuffix = normalizeSlugSuffix(slugSuffix) ?? generateStrongSlugSuffix(5)

  return `${slugify(title)}-${normalizedSuffix}`
}

function normalizeSlugSuffix(value?: string) {
  const trimmed = value?.trim()

  if (!trimmed || trimmed.length !== 5 || !/^[A-Za-z0-9]{5}$/.test(trimmed)) {
    return null
  }

  return trimmed
}
