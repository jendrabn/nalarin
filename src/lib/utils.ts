import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(value: string) {
  const slug = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

  return slug || "item"
}

export function normalizeNullableText(value: string) {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function previewText(value: string, limit = 120) {
  const stripped = value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  if (stripped.length <= limit) {
    return stripped
  }

  return `${stripped.slice(0, limit).trimEnd()}...`
}
