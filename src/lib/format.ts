import {
  formatEnDate,
  formatEnDateTime,
  formatEnMonthLabel,
  formatIdDate,
  formatIdDateTime,
  formatIdLongDate,
  toDateTimeLocalValue,
} from "./dayjs"

export function formatAdminDateTime(
  value: Date | string | number | null | undefined,
) {
  return formatIdDateTime(value)
}

export function formatAdminDate(
  value: Date | string | number | null | undefined,
) {
  return formatIdDate(value)
}

export function formatAdminLongDate(
  value: Date | string | number | null | undefined,
) {
  return formatIdLongDate(value)
}

export function formatAdminEnglishDateTime(
  value: Date | string | number | null | undefined,
) {
  return formatEnDateTime(value)
}

export function formatAdminEnglishDate(
  value: Date | string | number | null | undefined,
) {
  return formatEnDate(value)
}

export function formatAdminEnglishMonthLabel(
  value: Date | string | number | null | undefined,
) {
  return formatEnMonthLabel(value)
}

export function formatCurrencyIDR(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value)
}

export { toDateTimeLocalValue }
