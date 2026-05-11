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

export function formatAdminDateTime(
  value: Date | string | number | null | undefined,
) {
  const date = normalizeDate(value)

  if (!date) {
    return "-"
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

export function formatAdminDate(
  value: Date | string | number | null | undefined,
) {
  const date = normalizeDate(value)

  if (!date) {
    return "-"
  }

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

export function toDateTimeLocalValue(
  value: Date | string | number | null | undefined,
) {
  const date = normalizeDate(value)

  if (!date) {
    return ""
  }

  const pad = (input: number) => String(input).padStart(2, "0")

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("-") + `T${pad(date.getHours())}:${pad(date.getMinutes())}`
}
