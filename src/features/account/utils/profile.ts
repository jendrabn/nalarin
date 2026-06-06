export const PROFILE_BIO_MAX_LENGTH = 250
export const PROFILE_AVATAR_MAX_SIZE = 2 * 1024 * 1024
export const PROFILE_AVATAR_MIME_TYPES = new Set(["image/png", "image/jpeg"])

export function getProfileInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}

export function formatProfileDate(value: string | Date | null) {
  if (!value) {
    return "-"
  }

  const date = typeof value === "string" ? new Date(value) : value

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date)
}

export function getUsagePercent(used: number, limit: number | null) {
  if (limit === null || limit < 0) {
    return 100
  }

  if (limit <= 0) {
    return 0
  }

  return Math.min(100, Math.round((used / limit) * 100))
}

export function formatUsageLimit(used: number, limit: number | null) {
  if (limit === null || limit < 0) {
    return `${used} / Tanpa Batas`
  }

  return `${used} / ${limit}`
}
