"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { useMemo, useState } from "react"
import {
  ArrowLeftIcon,
  BarChart3Icon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  ClockIcon,
  GraduationCapIcon,
  LayoutListIcon,
  LockIcon,
  TrophyIcon,
} from "lucide-react"

import type { PlanCode } from "@/config/plans"
import { SiteFooter } from "@/components/site-footer"
import { SiteNavbar, type SiteUser } from "@/components/site-navbar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
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
  currentPlanCode: PlanCode
  data: PublicTryoutDiscoveryData
  selectedExamTypeSlug?: string
}

type StatusFilter = "all" | "ongoing" | "upcoming" | "ended"

const statusFilters: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "Semua" },
  { value: "ongoing", label: "Sedang berlangsung" },
  { value: "upcoming", label: "Akan datang" },
  { value: "ended", label: "Selesai" },
]

export function TryoutsPage({
  user,
  currentPlanCode,
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
  const visibleTryouts =
    activeStatus === "all"
      ? tryoutsByExamType
      : tryoutsByExamType.filter((tryout) => tryout.availabilityStatus === activeStatus)
  const stats = buildStats(tryoutsByExamType)
  const pageTitle = activeExamType ? `Tryout ${activeExamType.name}` : "Tryout"
  const pageSubtitle = activeExamType
    ? `Pilih jadwal tryout ${activeExamType.name}, cek status pengerjaan, dan buka detail sebelum masuk ruang tryout.`
    : "Pilih simulasi ujian multi-section untuk SNBT, UTUL UGM, SIMAK UI, dan CPNS. Cek jadwal, aturan, dan akses sebelum masuk ruang tryout."

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNavbar user={siteUser} />
      <main className="flex flex-col">
        <section className="border-b bg-[linear-gradient(180deg,color-mix(in_oklab,var(--secondary)_70%,transparent),transparent)]">
          <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end lg:px-8">
            <div className="flex max-w-3xl flex-col gap-4">
              <Badge variant="outline" className="w-fit border-primary/20 bg-primary/10 text-primary">
                <GraduationCapIcon data-icon="inline-start" />
                Simulasi rutin Nalarin
              </Badge>
              <div className="flex flex-col gap-3">
                <h1 className="font-heading text-[2.35rem] font-semibold leading-tight tracking-normal text-balance sm:text-[3rem]">
                  {pageTitle}
                </h1>
                <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                  {pageSubtitle}
                </p>
              </div>
            </div>
            <Card className="rounded-xl bg-card/80 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrophyIcon />
                  Ringkasan aktif
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <MiniMetric label="Tryout" value={stats.total} />
                <MiniMetric label="Gratis" value={stats.free} />
                <MiniMetric label="Berlangsung" value={stats.ongoing} />
                <MiniMetric label="Premium" value={stats.premium} />
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
          {data.examTypes.length === 0 ? (
            <Empty className="min-h-80 border bg-card">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <LayoutListIcon />
                </EmptyMedia>
                <EmptyTitle>Belum ada tryout publik</EmptyTitle>
                <EmptyDescription>
                  Tryout akan tampil di sini setelah admin mempublikasikan jadwal.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <Link
                  href="/tryouts"
                  className="inline-flex w-fit items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm font-medium text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <ArrowLeftIcon data-icon="inline-start" />
                  Kembali ke jenis ujian
                </Link>
                <div
                  aria-label="Filter status tryout"
                  className="flex gap-2 overflow-x-auto rounded-xl border bg-card p-1 shadow-sm"
                >
                  {statusFilters.map((filter) => {
                    const active = filter.value === activeStatus

                    return (
                      <button
                        key={filter.value}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setActiveStatus(filter.value)}
                        className={cn(
                          "h-8 shrink-0 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                          active
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                      >
                        {filter.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Total tryout" value={stats.total} icon={<BarChart3Icon />} />
                <StatCard label="Sedang berlangsung" value={stats.ongoing} icon={<ClockIcon />} />
                <StatCard label="Akan datang" value={stats.upcoming} icon={<CalendarDaysIcon />} />
                <StatCard label="Selesai" value={stats.ended} icon={<CheckCircle2Icon />} />
              </div>

              {tryoutsByExamType.length === 0 ? (
                <Empty className="min-h-72 border bg-card">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <LayoutListIcon />
                    </EmptyMedia>
                    <EmptyTitle>Belum ada tryout {activeExamType?.name}</EmptyTitle>
                    <EmptyDescription>
                      Coba pilih tipe ujian lain atau cek lagi saat jadwal baru dirilis.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : visibleTryouts.length === 0 ? (
                <Empty className="min-h-72 border bg-card">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <ClockIcon />
                    </EmptyMedia>
                    <EmptyTitle>Tidak ada tryout pada filter ini</EmptyTitle>
                    <EmptyDescription>
                      Ganti status filter untuk melihat jadwal tryout {activeExamType?.name}.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {visibleTryouts.map((tryout) => (
                    <TryoutCard
                      key={tryout.id}
                      tryout={tryout}
                      session={sessionsByTryoutId.get(tryout.id) ?? null}
                      currentPlanCode={currentPlanCode}
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

function buildStats(tryouts: PublicTryoutSummary[]) {
  return {
    total: tryouts.length,
    ongoing: tryouts.filter((tryout) => tryout.availabilityStatus === "ongoing").length,
    upcoming: tryouts.filter((tryout) => tryout.availabilityStatus === "upcoming").length,
    ended: tryouts.filter((tryout) => tryout.availabilityStatus === "ended").length,
    free: tryouts.filter((tryout) => tryout.isFree).length,
    premium: tryouts.filter((tryout) => !tryout.isFree).length,
  }
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-background/70 px-3 py-2">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string
  value: number
  icon: ReactNode
}) {
  return (
    <Card className="rounded-xl shadow-sm">
      <CardContent className="flex items-center justify-between gap-3 py-4">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-3xl font-semibold tabular-nums">{value}</p>
        </div>
        <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary [&_svg]:size-5">
          {icon}
        </div>
      </CardContent>
    </Card>
  )
}

function TryoutCard({
  tryout,
  session,
  currentPlanCode,
  serverNow,
}: {
  tryout: PublicTryoutSummary
  session: PublicTryoutSessionSummary | null
  currentPlanCode: PlanCode
  serverNow: string
}) {
  const accessAllowed = canAccessTryout({ isFree: tryout.isFree, planCode: currentPlanCode })
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

  return (
    <Link href={`/tryouts/${tryout.slug}`} className="group h-full rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
      <Card className="h-full rounded-xl bg-card shadow-sm transition-all group-hover:-translate-y-0.5 group-hover:shadow-md">
        <CardHeader className="gap-3">
          <div className="flex items-center justify-between gap-2">
            <Badge variant="outline" className={cn("shrink-0", statusMeta.badgeClassName)}>
              {statusMeta.icon}
              {statusMeta.label}
            </Badge>
            {tryout.isFree ? (
              <Badge variant="soft">Gratis</Badge>
            ) : (
              <Badge className="bg-primary text-primary-foreground">
                <LockIcon data-icon="inline-start" />
                Premium
              </Badge>
            )}
          </div>
          <CardTitle className="line-clamp-2 text-[1.02rem] font-semibold leading-snug">
            {tryout.title}
          </CardTitle>
          <p className="line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">
            {tryout.description ?? "Simulasi tryout multi-section dengan timer per subtest."}
          </p>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-4">
          <div className="grid gap-2">
            <InfoBox tone="neutral" icon={<CalendarDaysIcon />}>
              {formatShortDateRange(tryout.startsAt, tryout.endsAt)}
            </InfoBox>
            <InfoBox tone={statusMeta.tone} icon={<ClockIcon />}>
              {formatRelativeSchedule(tryout, serverNow)}
            </InfoBox>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span>{tryout.sectionCount} section</span>
            <span>{tryout.questionCount} soal</span>
            <span>{formatDuration(tryout.totalDurationMinutes)}</span>
          </div>
          <div
            className={cn(
              "mt-auto flex h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold transition-colors",
              statusMeta.actionClassName,
            )}
          >
            {!accessAllowed && !tryout.isFree ? <LockIcon /> : null}
            {actionLabel}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function InfoBox({
  icon,
  tone,
  children,
}: {
  icon: ReactNode
  tone: "neutral" | "ongoing" | "upcoming" | "ended"
  children: ReactNode
}) {
  const toneClassName = {
    neutral: "bg-muted/50 text-foreground",
    ongoing: "bg-chart-2/10 text-chart-2",
    upcoming: "bg-chart-1/10 text-chart-1",
    ended: "bg-destructive/10 text-destructive",
  }[tone]

  return (
    <div className={cn("flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium", toneClassName)}>
      <span className="[&_svg]:size-4">{icon}</span>
      <span className="line-clamp-1">{children}</span>
    </div>
  )
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
    return "Upgrade untuk Akses"
  }

  if (tryout.availabilityStatus === "upcoming") {
    return "Belum Dimulai"
  }

  if (tryout.availabilityStatus === "ended") {
    return "Sudah Berakhir"
  }

  return "Lihat Detail"
}
