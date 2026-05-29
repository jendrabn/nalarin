import { formatAdminEnglishDateTime } from "@/lib/format"

const integerFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
})

const scoreFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
})

const percentFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
})

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  currency: "IDR",
  maximumFractionDigits: 0,
  style: "currency",
})

export function formatInteger(value: number) {
  return integerFormatter.format(value)
}

export function formatScore(value: number) {
  return scoreFormatter.format(value)
}

export function formatPercent(value: number) {
  return `${percentFormatter.format(value)}%`
}

export function formatCurrency(value: number) {
  return currencyFormatter.format(value)
}

export function formatDateTime(value: string | Date) {
  return formatAdminEnglishDateTime(value)
}
