import {
  formatAdminDate as formatAdminDateValue,
  formatAdminDateTime as formatAdminDateTimeValue,
} from "@/lib/format"

function normalizeDate(value: Date | string | number | null | undefined) {
  if (value === null || value === undefined) {
    return null
  }

  const date = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date
}

export function formatAdminDateTime(value: Date | string | number | null | undefined) {
  const date = normalizeDate(value)

  if (!date) {
    return "-"
  }

  return formatAdminDateTimeValue(date)
}

export function formatAdminDate(value: Date | string | number | null | undefined) {
  const date = normalizeDate(value)

  if (!date) {
    return "-"
  }

  return formatAdminDateValue(date)
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
