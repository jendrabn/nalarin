const scoreFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
})

const integerFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
})

export function formatScore(value: number) {
  return scoreFormatter.format(value)
}

export function formatInteger(value: number) {
  return integerFormatter.format(value)
}

export function formatPercent(value: number) {
  return `${scoreFormatter.format(value)}%`
}

export function formatDuration(seconds: number) {
  if (seconds <= 0) {
    return "0:00"
  }

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainderSeconds = seconds % 60

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(remainderSeconds).padStart(2, "0")}`
  }

  return `${minutes}:${String(remainderSeconds).padStart(2, "0")}`
}
