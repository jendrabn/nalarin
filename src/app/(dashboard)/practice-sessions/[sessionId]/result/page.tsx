import type { Metadata } from "next"
import type { ReactNode } from "react"
import { notFound, redirect } from "next/navigation"
import { BarChart3Icon, CheckCircle2Icon, ClockIcon, XCircleIcon } from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { requireUser } from "@/features/auth/services/session"
import { PracticeSessionPageShell } from "@/features/practices/components/practice-session-page-shell"
import { PracticeResultActions } from "@/features/practices/components/practice-result-actions"
import { getPracticeSessionSummary } from "@/features/practices/queries/session"
import { cn } from "@/lib/utils"
import type { SiteUser } from "@/components/site-navbar"

export const metadata: Metadata = {
  title: "Hasil Latihan",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function Page({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const [{ sessionId }, user] = await Promise.all([params, requireUser()])
  const id = Number(sessionId)

  if (!Number.isInteger(id) || id <= 0) {
    notFound()
  }

  const summary = await getPracticeSessionSummary(id, user.id)

  if (!summary) {
    notFound()
  }

  if (summary.status === "in_progress") {
    redirect(`/practice-sessions/${summary.id}`)
  }

  const siteUser: NonNullable<SiteUser> = {
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    role: user.role,
  }

  return (
    <PracticeSessionPageShell user={siteUser}>
      <main className="min-h-svh bg-muted/35 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
          <PageHeader
            className="mb-0"
            title={`Hasil Latihan ${summary.title}`}
            subtitle="Ringkasan skor, akurasi, dan durasi pada sesi latihan ini."
          />

          <Card className="overflow-hidden shadow-sm">
            <CardContent className="flex flex-col gap-5 p-4 sm:p-5">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                  icon={<BarChart3Icon />}
                  label="Skor"
                  value={`${formatNumber(summary.totalScore)} / ${formatNumber(summary.totalMaxScore)}`}
                  tone="score"
                />
                <MetricCard
                  icon={<CheckCircle2Icon />}
                  label="Benar"
                  value={summary.totalCorrect}
                  tone="correct"
                />
                <MetricCard
                  icon={<XCircleIcon />}
                  label="Salah"
                  value={summary.totalWrong}
                  tone="wrong"
                />
                <MetricCard
                  icon={<ClockIcon />}
                  label="Waktu"
                  value={formatDuration(summary.durationSeconds)}
                  tone="time"
                />
              </div>

              <div className="rounded-xl border border-chart-2/20 bg-chart-2/5 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-2xl font-semibold tabular-nums text-chart-2">{summary.accuracy}%</p>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    {summary.totalQuestions} soal / {summary.totalUnanswered} kosong
                  </div>
                </div>
                <Progress value={summary.accuracy} className="mt-4 h-2" />
              </div>

              <PracticeResultActions
                practiceId={summary.practiceId}
                sessionId={summary.id}
                mode={summary.mode}
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </PracticeSessionPageShell>
  )
}

function MetricCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode
  label: string
  value: ReactNode
  tone: "score" | "correct" | "wrong" | "time"
}) {
  const toneClass = metricToneClasses[tone]

  return (
    <div className={cn("rounded-xl border p-4 shadow-sm", toneClass.card)}>
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className={cn("grid size-8 place-items-center rounded-lg [&_svg]:size-4", toneClass.icon)}>
          {icon}
        </span>
        <span className="text-sm">{label}</span>
      </div>
      <p className={cn("mt-3 text-xl font-semibold tabular-nums", toneClass.value)}>{value}</p>
    </div>
  )
}

const metricToneClasses = {
  score: {
    card: "border-primary/20 bg-primary/5",
    icon: "bg-primary/10 text-primary",
    value: "text-primary",
  },
  correct: {
    card: "border-chart-2/20 bg-chart-2/5",
    icon: "bg-chart-2/10 text-chart-2",
    value: "text-chart-2",
  },
  wrong: {
    card: "border-destructive/20 bg-destructive/5",
    icon: "bg-destructive/10 text-destructive",
    value: "text-destructive",
  },
  time: {
    card: "border-chart-3/20 bg-chart-3/5",
    icon: "bg-chart-3/10 text-chart-3",
    value: "text-chart-3",
  },
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 2,
  }).format(value)
}

function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}
