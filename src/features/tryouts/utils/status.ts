export type TryoutAvailabilityStatus = "ongoing" | "upcoming" | "ended"

export type TryoutStatusInput = {
  contentStatus: "published" | "archived"
  startsAt: string | null
  endsAt: string | null
}

export function resolveTryoutAvailabilityStatus(
  tryout: TryoutStatusInput,
  nowInput: Date | string = new Date(),
): TryoutAvailabilityStatus {
  if (tryout.contentStatus === "archived") {
    return "ended"
  }

  const now = toDate(nowInput) ?? new Date()
  const startsAt = toDate(tryout.startsAt)
  const endsAt = toDate(tryout.endsAt)

  if (startsAt && startsAt.getTime() > now.getTime()) {
    return "upcoming"
  }

  if (endsAt && endsAt.getTime() < now.getTime()) {
    return "ended"
  }

  return "ongoing"
}

export function isResultReleased(
  input: {
    showResultAfterSubmit: boolean
    resultReleaseAt: string | null
  },
  nowInput: Date | string = new Date(),
) {
  if (!input.showResultAfterSubmit) {
    return false
  }

  const releaseAt = toDate(input.resultReleaseAt)

  if (!releaseAt) {
    return true
  }

  const now = toDate(nowInput) ?? new Date()
  return releaseAt.getTime() <= now.getTime()
}

export function isFeatureReleased(
  input: {
    enabled: boolean
    releaseAt: string | null
  },
  nowInput: Date | string = new Date(),
) {
  if (!input.enabled) {
    return false
  }

  const releaseAt = toDate(input.releaseAt)

  if (!releaseAt) {
    return true
  }

  const now = toDate(nowInput) ?? new Date()
  return releaseAt.getTime() <= now.getTime()
}

export function formatShortDateRange(startsAt: string | null, endsAt: string | null) {
  const start = toDate(startsAt)
  const end = toDate(endsAt)

  if (!start && !end) {
    return "Jadwal fleksibel"
  }

  if (start && !end) {
    return `Mulai ${formatShortDate(start)}`
  }

  if (!start && end) {
    return `Sampai ${formatShortDate(end)}`
  }

  return `${formatShortDate(start)} - ${formatShortDate(end)}`
}

export function formatLongDateTime(value: string | null) {
  const date = toDate(value)

  if (!date) {
    return "Belum ditentukan"
  }

  const datePart = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "full",
  }).format(date)
  const timePart = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date)

  return `${datePart}, ${timePart}`
}

export function formatDuration(minutes: number) {
  if (minutes < 60) {
    return `${minutes} menit`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (remainingMinutes === 0) {
    return `${hours} jam`
  }

  return `${hours} jam ${remainingMinutes} menit`
}

export function formatRelativeSchedule(
  tryout: Pick<TryoutStatusInput, "startsAt" | "endsAt"> & {
    contentStatus: "published" | "archived"
  },
  nowInput: Date | string = new Date(),
) {
  const status = resolveTryoutAvailabilityStatus(tryout, nowInput)
  const now = toDate(nowInput) ?? new Date()

  if (status === "ended") {
    return "Berakhir"
  }

  if (status === "upcoming") {
    return `${formatDistance(toDate(tryout.startsAt), now)} lagi`
  }

  return `${formatDistance(toDate(tryout.endsAt), now)} tersisa`
}

function formatShortDate(value: Date | null) {
  if (!value) {
    return "-"
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
  }).format(value)
}

function formatDistance(target: Date | null, now: Date) {
  if (!target) {
    return "Tanpa batas akhir"
  }

  const diffMs = Math.max(0, Math.abs(target.getTime() - now.getTime()))
  const totalHours = Math.ceil(diffMs / 3_600_000)
  const days = Math.floor(totalHours / 24)
  const hours = totalHours % 24

  if (days > 0 && hours > 0) {
    return `${days} hari ${hours} jam`
  }

  if (days > 0) {
    return `${days} hari`
  }

  if (hours > 0) {
    return `${hours} jam`
  }

  return "Kurang dari 1 jam"
}

function toDate(value: Date | string | null | undefined) {
  if (!value) {
    return null
  }

  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}
