"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowRightIcon,
  BookOpenCheckIcon,
  CheckCircle2Icon,
  ClockIcon,
  FlagIcon,
  Loader2Icon,
  LockIcon,
  PlayIcon,
  TrophyIcon,
} from "lucide-react"
import type { ReactNode } from "react"
import { useTransition } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

import { startTryoutSectionAction } from "../actions"
import type { TryoutSectionSummary, TryoutSessionOverviewData } from "../types"

export function TryoutSessionOverviewPage({
  session,
}: {
  session: TryoutSessionOverviewData
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const progressValue =
    session.totalQuestions > 0
      ? Math.round((session.totalAnswered / session.totalQuestions) * 100)
      : 0
  const activeSection = session.sections.find((section) => section.status === "in_progress")

  function startSection(section: TryoutSectionSummary) {
    startTransition(async () => {
      const result = await startTryoutSectionAction({
        sessionId: session.id,
        sectionSessionId: section.id,
      })

      if (!result.success) {
        toast.error(result.message)
        return
      }

      router.push(`/tryout-sessions/${session.id}/sections/${result.data.sectionSessionId}`)
    })
  }

  return (
    <main className="min-h-svh bg-muted/35">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
        <section className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="gap-1.5 bg-primary/10 text-primary">
              <BookOpenCheckIcon />
              Tryout
            </Badge>
            <Badge variant="secondary">{session.examTypeName}</Badge>
            <SessionStatusBadge status={session.status} />
          </div>

          <PageHeader
            className="mb-0"
            title={session.title}
            subtitle={
              session.description ??
              "Tinjau progress, lanjutkan subtes, dan buka detail sebelum mulai."
            }
            actions={
              <Button asChild variant="outline">
                <Link href={`/tryouts/${session.tryoutSlug}`}>Detail Tryout</Link>
              </Button>
            }
          />

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryMetric label="Progress" value={`${progressValue}%`} icon={<TrophyIcon />} />
            <SummaryMetric
              label="Dijawab"
              value={`${session.totalAnswered}/${session.totalQuestions}`}
              icon={<CheckCircle2Icon />}
            />
            <SummaryMetric
              label="Ditandai"
              value={session.totalMarked}
              icon={<FlagIcon />}
            />
            <SummaryMetric
              label="Durasi total"
              value={formatMinutes(session.totalDurationMinutes)}
              icon={<ClockIcon />}
            />
          </div>

          <div className="flex items-center gap-3">
            <Progress value={progressValue} className="h-2 flex-1" />
            <span className="text-xs font-medium tabular-nums text-muted-foreground">
              {progressValue}%
            </span>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <Card className="shadow-sm">
            <CardHeader>
            <CardTitle>Subtes Tryout</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {session.sections.map((section, index) => {
                const previousOpen = session.sections
                  .slice(0, index)
                  .some((item) => item.status === "pending" || item.status === "in_progress")
                const locked =
                  session.status !== "in_progress" ||
                  previousOpen ||
                  (Boolean(activeSection) && activeSection?.id !== section.id)
                const canOpen = section.status === "pending" || section.status === "in_progress"

                return (
                  <SectionRow
                    key={section.id}
                    section={section}
                    locked={locked}
                    canOpen={canOpen}
                    isPending={isPending}
                    onStart={() => startSection(section)}
                  />
                )
              })}
            </CardContent>
          </Card>

          <aside className="flex flex-col gap-4">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Aturan Room</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-sm leading-6 text-muted-foreground">
                <p>Kerjakan subtes sesuai urutan. Timer berjalan terpisah untuk setiap subtes.</p>
                <p>Subtes yang sudah disubmit tidak dapat dibuka ulang atau diubah jawabannya.</p>
                <p>Tryout hanya bisa dikerjakan satu kali. Hasil mengikuti jadwal rilis tryout.</p>
              </CardContent>
            </Card>

            {session.status === "graded" ? (
              <Button asChild className="w-full">
                <Link href={`/tryout-sessions/${session.id}/result`}>
                  <TrophyIcon data-icon="inline-start" />
                  Lihat Hasil
                </Link>
              </Button>
            ) : null}
          </aside>
        </section>
      </div>
    </main>
  )
}

function SectionRow({
  section,
  locked,
  canOpen,
  isPending,
  onStart,
}: {
  section: TryoutSectionSummary
  locked: boolean
  canOpen: boolean
  isPending: boolean
  onStart: () => void
}) {
  const progressValue =
    section.totalQuestions > 0
      ? Math.round((section.answeredCount / section.totalQuestions) * 100)
      : 0

  return (
    <article className="rounded-xl border bg-background p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
            {section.orderIndex}
          </span>
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="min-w-0 font-semibold text-foreground">{section.title}</h2>
              <SectionStatusBadge status={section.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {section.subjectName} - {section.totalQuestions} soal -{" "}
              {formatMinutes(section.durationMinutes)}
            </p>
            <div className="flex items-center gap-2">
              <Progress value={progressValue} className="h-2 w-32" />
              <span className="text-xs tabular-nums text-muted-foreground">
                {section.answeredCount}/{section.totalQuestions}
              </span>
            </div>
          </div>
        </div>

        <Button
          type="button"
          variant={section.status === "in_progress" ? "default" : "outline"}
          onClick={onStart}
          disabled={!canOpen || locked || isPending}
          className="md:w-40"
        >
          {isPending ? (
            <Loader2Icon data-icon="inline-start" className="animate-spin" />
          ) : locked ? (
            <LockIcon data-icon="inline-start" />
          ) : section.status === "in_progress" ? (
            <ArrowRightIcon data-icon="inline-start" />
          ) : section.status === "pending" ? (
            <PlayIcon data-icon="inline-start" />
          ) : (
            <CheckCircle2Icon data-icon="inline-start" />
          )}
          {getSectionActionLabel(section, locked)}
        </Button>
      </div>
    </article>
  )
}

function SummaryMetric({
  label,
  value,
  icon,
}: {
  label: string
  value: string | number
  icon: ReactNode
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-background p-3">
      <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary [&_svg]:size-4">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-semibold tabular-nums">{value}</p>
      </div>
    </div>
  )
}

function SessionStatusBadge({ status }: { status: TryoutSessionOverviewData["status"] }) {
  return <Badge variant={status === "in_progress" ? "default" : "secondary"}>{statusLabel(status)}</Badge>
}

function SectionStatusBadge({ status }: { status: TryoutSectionSummary["status"] }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        status === "in_progress" && "border-primary/30 bg-primary/10 text-primary",
        status === "graded" && "border-chart-2/30 bg-chart-2/10 text-chart-2",
        status === "grading" && "border-chart-3/30 bg-chart-3/10 text-chart-3",
        status === "pending" && "bg-muted text-muted-foreground",
      )}
    >
      {statusLabel(status)}
    </Badge>
  )
}

function getSectionActionLabel(section: TryoutSectionSummary, locked: boolean) {
  if (locked && section.status === "pending") {
    return "Terkunci"
  }

  if (section.status === "in_progress") {
    return "Lanjutkan"
  }

  if (section.status === "pending") {
    return "Mulai"
  }

  return "Selesai"
}

function statusLabel(status: TryoutSessionOverviewData["status"]) {
  const labels: Record<TryoutSessionOverviewData["status"], string> = {
    pending: "Belum Mulai",
    in_progress: "Berlangsung",
    submitted: "Terkirim",
    grading: "Dinilai",
    graded: "Selesai",
    cancelled: "Dibatalkan",
  }

  return labels[status]
}

function formatMinutes(minutes: number) {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60)
    const rest = minutes % 60

    return rest > 0 ? `${hours} jam ${rest} menit` : `${hours} jam`
  }

  return `${minutes} menit`
}
