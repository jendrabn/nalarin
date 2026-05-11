function normalizeDate(value: Date | string | number | null | undefined) {
  if (value === null || value === undefined) {
    return "-"
  }

  const date = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "-"
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

export function formatAdminDateTime(value: Date | string | number | null | undefined) {
  return normalizeDate(value)
}

export function formatAdminDate(value: Date | string | number | null | undefined) {
  const formatted = normalizeDate(value)

  if (formatted === "-") {
    return formatted
  }

  const date = value instanceof Date ? value : new Date(value as string | number)

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
  }).format(date)
}

export function formatCurrencyIDR(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value)
}

export function getUserInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}
