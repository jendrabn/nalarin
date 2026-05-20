export type MonthBucket = {
  key: string
  label: string
  date: Date
}

export function getMonthBuckets(monthCount = 6, anchor = new Date()) {
  const buckets: MonthBucket[] = []
  const base = new Date(anchor)

  base.setDate(1)
  base.setHours(0, 0, 0, 0)

  for (let index = monthCount - 1; index >= 0; index -= 1) {
    const date = new Date(base)
    date.setMonth(base.getMonth() - index)

    buckets.push({
      key: formatMonthKey(date),
      label: formatMonthLabel(date),
      date,
    })
  }

  return buckets
}

export function formatMonthKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")

  return `${year}-${month}-01`
}

export function formatMonthLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  }).format(date)
}
