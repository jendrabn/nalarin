import dayjs from "dayjs"
import "dayjs/locale/en"
import "dayjs/locale/id"

export type DayjsLocale = "id" | "en"

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

function formatDate(
  value: Date | string | number | null | undefined,
  locale: DayjsLocale,
  pattern: string,
) {
  const date = normalizeDate(value)

  if (!date) {
    return "-"
  }

  return dayjs(date).locale(locale).format(pattern)
}

export function formatIdDateTime(
  value: Date | string | number | null | undefined,
) {
  return formatDate(value, "id", "D MMM YYYY HH:mm")
}

export function formatIdDate(
  value: Date | string | number | null | undefined,
) {
  return formatDate(value, "id", "D MMM YYYY")
}

export function formatIdLongDate(
  value: Date | string | number | null | undefined,
) {
  return formatDate(value, "id", "D MMMM YYYY")
}

export function formatEnDateTime(
  value: Date | string | number | null | undefined,
) {
  return formatDate(value, "en", "MMM D, YYYY h:mm A")
}

export function formatEnDate(
  value: Date | string | number | null | undefined,
) {
  return formatDate(value, "en", "MMM D, YYYY")
}

export function formatEnMonthLabel(
  value: Date | string | number | null | undefined,
) {
  return formatDate(value, "en", "MMM YYYY")
}

export function toDateTimeLocalValue(
  value: Date | string | number | null | undefined,
) {
  const date = normalizeDate(value)

  if (!date) {
    return ""
  }

  return dayjs(date).format("YYYY-MM-DDTHH:mm")
}
