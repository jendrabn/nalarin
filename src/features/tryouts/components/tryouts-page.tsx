"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { useMemo, useState } from "react"
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  ClockIcon,
  LockIcon,
  ListFilterIcon,
  PlayCircleIcon,
  TrophyIcon,
} from "lucide-react"

import { EmptyState } from "@/components/empty-state"
import { SiteFooter } from "@/components/site-footer"
import { SiteNavbar, type SiteUser } from "@/components/site-navbar"
import { PageHeader } from "@/components/page-header"
import { PremiumBadge } from "@/components/premium-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

import type {
  PublicTryoutDiscoveryData,
  PublicTryoutSessionSummary,
  PublicTryoutSummary,
} from "../queries"
import { canAccessTryout } from "../utils/access"
import {
  formatDuration,
  formatRelativeSchedule,
  formatShortDateRange,
  isResultReleased,
} from "../utils/status"

type TryoutsPageProps = {
  user: {
    id: number
    name: string
    email: string
    avatarUrl: string | null
    role: "user" | "admin"
    isEmailVerified: boolean
  } | null
  premiumExamTypeIds: number[]
  data: PublicTryoutDiscoveryData
  selectedExamTypeSlug?: string
}

type StatusFilter = "all" | "ongoing" | "upcoming" | "ended"

const statusFilters: Array<{
  value: StatusFilter
  label: string
  icon: ReactNode
}> = [
  { value: "all", label: "Semua", icon: <ListFilterIcon data-icon="inline-start" /> },
  { value: "ongoing", label: "Sedang Berlangsung", icon: <PlayCircleIcon data-icon="inline-start" /> },
  { value: "upcoming", label: "Akan Datang", icon: <CalendarDaysIcon data-icon="inline-start" /> },
  { value: "ended", label: "Selesai", icon: <CheckCircle2Icon data-icon="inline-start" /> },
]

export function TryoutsPage({
  user,
  premiumExamTypeIds,
  data,
  selectedExamTypeSlug,
}: TryoutsPageProps) {
  const selectedExamType = selectedExamTypeSlug
    ? data.examTypes.find((examType) => examType.slug === selectedExamTypeSlug)
    : null
  const activeExamTypeId = selectedExamType?.id ?? data.examTypes[0]?.id ?? null
  const [activeStatus, setActiveStatus] = useState<StatusFilter>("all")

  const siteUser = user
    ? ({
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        role: user.role,
      } satisfies NonNullable<SiteUser>)
    : null

  const sessionsByTryoutId = useMemo(() => {
    const map = new Map<number, PublicTryoutSessionSummary>()

    for (const session of data.userSessions) {
      map.set(session.tryoutId, session)
    }

    return map
  }, [data.userSessions])

  const activeExamType = data.examTypes.find((examType) => examType.id === activeExamTypeId)
  const tryoutsByExamType = data.tryouts.filter(
    (tryout) => tryout.examTypeId === activeExamTypeId,
  )
  const statusCounts = {
    all: tryoutsByExamType.length,
    ongoing: tryoutsByExamType.filter((tryout) => tryout.availabilityStatus === "ongoing").length,
    upcoming: tryoutsByExamType.filter((tryout) => tryout.availabilityStatus === "upcoming").length,
    ended: tryoutsByExamType.filter((tryout) => tryout.availabilityStatus === "ended").length,
  } satisfies Record<StatusFilter, number>
  const visibleTryouts =
    activeStatus === "all"
      ? tryoutsByExamType
      : tryoutsByExamType.filter((tryout) => tryout.availabilityStatus === activeStatus)
  const pageTitle = activeExamType ? `Tryout ${activeExamType.name}` : "Tryout"
  const pageSubtitle = activeExamType
    ? `Pilih jadwal tryout ${activeExamType.name} untuk mengecek status dan membuka detail sebelum mulai.`
    : "Pilih simulasi ujian yang sesuai jalur belajar dan cek detail sebelum mulai."

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNavbar user={siteUser} />
      <main className="flex flex-col">
        <TryoutPageHeader title={pageTitle} subtitle={pageSubtitle} />

        <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pt-4 pb-8 sm:px-6 lg:px-8">
          {data.examTypes.length === 0 ? (
            <EmptyState title="Belum Ada Tryout Publik" className="min-h-80" />
          ) : (
            <>
              <StatusFilterBar
                activeStatus={activeStatus}
                onStatusChange={setActiveStatus}
                counts={statusCounts}
              />

              {tryoutsByExamType.length === 0 ? (
                <EmptyState
                  title={`Belum Ada Tryout ${activeExamType?.name ?? ""}`.trim()}
                  className="min-h-72"
                />
              ) : visibleTryouts.length === 0 ? (
                <EmptyState
                  title="Tidak Ada Tryout Pada Filter Ini"
                  className="min-h-72"
                />
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {visibleTryouts.map((tryout) => (
                    <TryoutCard
                      key={tryout.id}
                      tryout={tryout}
                      session={sessionsByTryoutId.get(tryout.id) ?? null}
                      premiumExamTypeIds={premiumExamTypeIds}
                      serverNow={data.serverNow}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}

function TryoutPageHeader({
  title,
  subtitle,
}: {
  title: string
  subtitle: string
}) {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 pt-6 pb-1 sm:px-6 lg:px-8">
      <PageHeader
        className="mb-0 w-full"
        title={title}
        subtitle={subtitle}
        actions={
          <Button asChild variant="ghost">
            <Link href="/tryouts">
              <ArrowLeftIcon data-icon="inline-start" />
              Kembali Ke Tryout
            </Link>
          </Button>
        }
      />
    </section>
  )
}

function StatusFilterBar({
  activeStatus,
  onStatusChange,
  counts,
}: {
  activeStatus: StatusFilter
  onStatusChange: (status: StatusFilter) => void
  counts: Record<StatusFilter, number>
}) {
  return (
    <div
      aria-label="Filter Status Tryout"
      className="flex w-full flex-wrap gap-2 pb-1"
    >
      {statusFilters.map((filter) => {
        const active = filter.value === activeStatus

        return (
          <Button
            key={filter.value}
            type="button"
            aria-pressed={active}
            onClick={() => onStatusChange(filter.value)}
            variant={active ? "default" : "outline"}
            size="xl"
            className={cn(
              "max-w-full shrink-0 justify-start rounded-full text-[0.9rem] font-medium tracking-normal shadow-sm",
              !active && "text-muted-foreground hover:border-primary/30 hover:text-foreground",
            )}
          >
            {filter.icon}
            <span className="min-w-0 truncate">
              {filter.label} ({counts[filter.value]})
            </span>
          </Button>
        )
      })}
    </div>
  )
}

function TryoutCard({
  tryout,
  session,
  premiumExamTypeIds,
  serverNow,
}: {
  tryout: PublicTryoutSummary
  session: PublicTryoutSessionSummary | null
  premiumExamTypeIds: number[]
  serverNow: string
}) {
  const accessAllowed = canAccessTryout({
    isFree: tryout.isFree,
    hasPremiumAccess: premiumExamTypeIds.includes(tryout.examTypeId),
  })
  const resultAvailable =
    session?.status === "graded" &&
    isResultReleased(
      {
        showResultAfterSubmit: tryout.showResultAfterSubmit,
        resultReleaseAt: tryout.resultReleaseAt,
      },
      serverNow,
    )
  const statusMeta = getCardStatusMeta(tryout, session, resultAvailable)
  const actionLabel = getCardActionLabel({
    tryout,
    session,
    accessAllowed,
    resultAvailable,
  })
  const actionHref = getCardActionHref({
    tryout,
    session,
    accessAllowed,
    resultAvailable,
  })

  return (
    <Card className="group flex h-full gap-0 overflow-hidden rounded-xl border border-border bg-card py-0 shadow-md shadow-foreground/5 ring-1 ring-border/50 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lg hover:shadow-primary/10 hover:ring-primary/15">
      <Link
        href={`/tryouts/${tryout.slug}`}
        className="flex flex-1 flex-col gap-4 px-4 pt-4 pb-0 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:px-5 sm:pt-5"
      >
        <CardHeader className="gap-3.5 px-0 pt-0 pb-0">
          <div className="flex items-start justify-between gap-3">
            <Badge
              variant="outline"
              size="sm"
              className={cn("shrink-0 rounded-full font-semibold", statusMeta.badgeClassName)}
            >
              {statusMeta.icon}
              {statusMeta.label}
            </Badge>
            {tryout.isFree ? null : (
              <PremiumBadge showIcon />
            )}
          </div>

          <div className="flex flex-col gap-2">
            <CardTitle className="line-clamp-2 text-[1rem] font-semibold leading-[1.45] text-foreground sm:text-[1.04rem]">
              {tryout.title}
            </CardTitle>
            <p className="line-clamp-3 text-[0.86rem] font-normal leading-[1.6] text-muted-foreground sm:text-[0.9rem]">
              {tryout.description ?? "Simulasi tryout multi-section dengan timer per subtest."}
            </p>
          </div>
        </CardHeader>

        <CardContent className="mt-auto flex flex-1 flex-col px-0 pt-0 pb-0">
          <div className="grid gap-2 rounded-xl border border-border/60 bg-secondary/30 p-3">
            <TryoutMetaRow
              icon={<CalendarDaysIcon />}
              value={formatShortDateRange(tryout.startsAt, tryout.endsAt)}
            />
            <TryoutMetaRow
              icon={<ClockIcon />}
              value={formatRelativeSchedule(tryout, serverNow)}
              tone={statusMeta.tone}
            />
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2.5 sm:mt-3.5">
            <TryoutMetric label="Subtes" value={tryout.sectionCount.toString()} />
            <TryoutMetric label="Soal" value={tryout.questionCount.toString()} />
            <TryoutMetric
              label="Durasi"
              value={formatTitleCaseDuration(tryout.totalDurationMinutes)}
            />
          </div>
        </CardContent>
      </Link>

      <div className="px-4 pt-3.5 pb-4 sm:px-5 sm:pb-5">
        {actionHref ? (
          <Button
            asChild
            variant={accessAllowed ? "default" : "outline"}
            size="lg"
            className={cn(
              "w-full font-semibold shadow-sm transition-all duration-200 group-hover:shadow-md",
              accessAllowed
                ? cn(statusMeta.actionClassName, "group-hover:bg-primary/90")
                : "border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary",
            )}
            >
              <Link href={actionHref}>
                {!accessAllowed && !tryout.isFree ? <LockIcon data-icon="inline-start" /> : null}
                {actionLabel}
                {accessAllowed ? <ArrowRightIcon data-icon="inline-end" aria-hidden="true" /> : null}
              </Link>
            </Button>
          ) : (
          <Button
            type="button"
            variant="secondary"
            size="lg"
              disabled
              className={cn("w-full font-semibold text-muted-foreground", statusMeta.actionClassName)}
            >
              {!accessAllowed && !tryout.isFree ? <LockIcon data-icon="inline-start" /> : null}
              {actionLabel}
            </Button>
          )}
      </div>
    </Card>
  )
}

function TryoutMetaRow({
  icon,
  value,
  tone = "neutral",
}: {
  icon: ReactNode
  value: string
  tone?: "neutral" | "ongoing" | "upcoming" | "ended"
}) {
  const toneClassName = {
    neutral: "text-foreground",
    ongoing: "text-chart-2",
    upcoming: "text-chart-1",
    ended: "text-destructive",
  }[tone]

  return (
    <div className="flex items-center gap-2.5 text-sm">
      <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-md bg-background text-muted-foreground [&_svg]:size-4", toneClassName)}>
        {icon}
      </span>
      <span className="min-w-0 flex-1 py-1">
        <span className={cn("block truncate text-[0.9rem] font-medium", toneClassName)}>{value}</span>
      </span>
    </div>
  )
}

function TryoutMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/80 px-3 py-2 shadow-sm shadow-foreground/5">
      <span className="block truncate text-[0.9rem] font-semibold text-foreground">
        {value}
      </span>
      <span className="mt-0.5 block truncate text-[0.72rem] font-medium tracking-normal text-muted-foreground">
        {label}
      </span>
    </div>
  )
}

function formatTitleCaseDuration(minutes: number) {
  return formatDuration(minutes)
    .replace(/\bjam\b/g, "Jam")
    .replace(/\bmenit\b/g, "Menit")
}

function getCardStatusMeta(
  tryout: PublicTryoutSummary,
  session: PublicTryoutSessionSummary | null,
  resultAvailable: boolean,
) {
  if (resultAvailable) {
    return {
      label: "Hasil Tersedia",
      icon: <TrophyIcon data-icon="inline-start" />,
      tone: "ongoing" as const,
      badgeClassName: "border-chart-4/20 bg-chart-4/10 text-chart-4",
      actionClassName: "bg-primary text-primary-foreground group-hover:bg-primary/90",
    }
  }

  if (session?.status === "in_progress") {
    return {
      label: "Sedang Dikerjakan",
      icon: <ClockIcon data-icon="inline-start" />,
      tone: "ongoing" as const,
      badgeClassName: "border-chart-2/20 bg-chart-2/10 text-chart-2",
      actionClassName: "bg-primary text-primary-foreground group-hover:bg-primary/90",
    }
  }

  if (tryout.availabilityStatus === "ongoing") {
    return {
      label: "Berlangsung",
      icon: <ClockIcon data-icon="inline-start" />,
      tone: "ongoing" as const,
      badgeClassName: "border-chart-2/20 bg-chart-2/10 text-chart-2",
      actionClassName: "bg-primary text-primary-foreground group-hover:bg-primary/90",
    }
  }

  if (tryout.availabilityStatus === "upcoming") {
    return {
      label: "Akan Datang",
      icon: <CalendarDaysIcon data-icon="inline-start" />,
      tone: "upcoming" as const,
      badgeClassName: "border-chart-1/20 bg-chart-1/10 text-chart-1",
      actionClassName: "bg-muted text-muted-foreground",
    }
  }

  return {
    label: "Berakhir",
    icon: <CheckCircle2Icon data-icon="inline-start" />,
    tone: "ended" as const,
    badgeClassName: "border-destructive/20 bg-destructive/10 text-destructive",
    actionClassName: "bg-muted text-muted-foreground",
  }
}

function getCardActionLabel({
  tryout,
  session,
  accessAllowed,
  resultAvailable,
}: {
  tryout: PublicTryoutSummary
  session: PublicTryoutSessionSummary | null
  accessAllowed: boolean
  resultAvailable: boolean
}) {
  if (session?.status === "in_progress") {
    return "Lanjutkan Tryout"
  }

  if (resultAvailable) {
    return "Lihat Hasil"
  }

  if (session && session.status !== "cancelled") {
    return "Hasil Belum Tersedia"
  }

  if (!accessAllowed) {
    return "Upgrade Untuk Akses"
  }

  if (tryout.availabilityStatus === "upcoming") {
    return "Belum Dimulai"
  }

  if (tryout.availabilityStatus === "ended") {
    return "Sudah Berakhir"
  }

  return "Lihat Detail"
}

function getCardActionHref({
  tryout,
  session,
  accessAllowed,
  resultAvailable,
}: {
  tryout: PublicTryoutSummary
  session: PublicTryoutSessionSummary | null
  accessAllowed: boolean
  resultAvailable: boolean
}) {
  if (session?.status === "in_progress") {
    return `/tryout-sessions/${session.id}`
  }

  if (session && (resultAvailable || session.status === "graded")) {
    return `/tryout-sessions/${session.id}/result`
  }

  if (session && session.status !== "cancelled") {
    return `/tryout-sessions/${session.id}`
  }

  if (!accessAllowed) {
    return "/pricing"
  }

  if (tryout.availabilityStatus === "ongoing") {
    return `/tryouts/${tryout.slug}`
  }

  return null
}
