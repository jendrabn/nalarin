import { slugify } from "./slug"

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

export function previewBlogPostSlug(title: string) {
  return slugify(title)
}

