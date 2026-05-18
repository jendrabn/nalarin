import type { ProgressPeriod } from "../types"

export const PROGRESS_PERIOD_OPTIONS: Array<{
  value: ProgressPeriod
  label: string
}> = [
  { value: "7d", label: "7 Hari" },
  { value: "30d", label: "30 Hari" },
  { value: "90d", label: "3 Bulan" },
  { value: "all", label: "Semua Waktu" },
]

export function parseProgressPeriod(value: string | string[] | undefined): ProgressPeriod {
  const period = Array.isArray(value) ? value[0] : value

  if (period === "7d" || period === "30d" || period === "90d" || period === "all") {
    return period
  }

  return "30d"
}

export function getProgressPeriodStart(period: ProgressPeriod) {
  if (period === "all") {
    return null
  }

  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - days + 1)

  return start
}
