import Link from "next/link"
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  BarChart3Icon,
  CheckCircle2Icon,
  ClockIcon,
  FileTextIcon,
  TrophyIcon,
  XCircleIcon,
} from "lucide-react"
import type { ReactNode } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

import type { TryoutResultData, TryoutSectionResult } from "../types"

export function TryoutResultPage({ data }: { data: TryoutResultData }) {
  const resultLocked = !data.resultRelease.available
  const releaseText = formatReleaseText(data.resultRelease.releaseAt)

  return (
    <main className="min-h-svh bg-muted/35 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant="outline">{data.examTypeName}</Badge>
              <ResultStatusBadge isFinal={data.isFinal} status={data.status} />
            </div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Hasil Tryout
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              {data.title}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={`/tryout-sessions/${data.id}`}>
              <ArrowLeftIcon data-icon="inline-start" />
              Kembali
            </Link>
          </Button>
        </header>

        {resultLocked ? (
          <LockedResultCard releaseText={releaseText} sessionId={data.id} />
        ) : (
          <>
            {!data.isFinal ? (
              <Alert>
                <AlertCircleIcon />
                <AlertTitle>Skor Sementara</AlertTitle>
                <AlertDescription>
                  Sesi sudah dikirim dan sedang diproses. Nilai akhir dapat berubah sampai proses
                  penilaian selesai.
                </AlertDescription>
              </Alert>
            ) : null}

            <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Ringkasan Skor</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-5">
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <MetricCard
                      icon={<BarChart3Icon />}
                      label="Skor"
                      value={`${formatNumber(data.totalScore)} / ${formatNumber(data.totalMaxScore)}`}
                      tone="score"
                    />
                    <MetricCard
                      icon={<CheckCircle2Icon />}
                      label="Benar"
                      value={data.totalCorrect}
                      tone="correct"
                    />
                    <MetricCard
                      icon={<XCircleIcon />}
                      label="Salah"
                      value={data.totalWrong}
                      tone="wrong"
                    />
                    <MetricCard
                      icon={<ClockIcon />}
                      label="Durasi"
                      value={formatDuration(data.durationUsedSeconds)}
                      tone="time"
                    />
                  </div>

                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Persentase Skor</p>
                        <p className="mt-1 text-3xl font-semibold tabular-nums text-primary">
                          {data.scorePercentage}%
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {data.totalQuestions} soal / {data.totalUnanswered} kosong
                      </p>
                    </div>
                    <Progress value={data.scorePercentage} className="mt-4 h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Aksi Lanjutan</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <Button asChild className="w-full">
                    <Link href={`/tryout-sessions/${data.id}/review`}>
                      <FileTextIcon data-icon="inline-start" />
                      Review Jawaban
                    </Link>
                  </Button>
                  {data.rankingRelease.available && data.rankingRelease.allowedByPlan ? (
                    <Button asChild variant="outline-primary" className="w-full">
                      <Link href={`/tryout-sessions/${data.id}/ranking`}>
                        <TrophyIcon data-icon="inline-start" />
                        Lihat Ranking
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild variant="outline" className="w-full">
                      <Link href={`/tryout-sessions/${data.id}/ranking`}>
                        <TrophyIcon data-icon="inline-start" />
                        Info Ranking
                      </Link>
                    </Button>
                  )}
                  <div className="rounded-lg bg-muted/50 p-3 text-sm leading-6 text-muted-foreground">
                    Ranking dan pembahasan mengikuti jadwal rilis tryout serta akses paket aktif.
                  </div>
                </CardContent>
              </Card>
            </section>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Breakdown Subtes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subtes</TableHead>
                        <TableHead className="text-right">Skor</TableHead>
                        <TableHead className="text-right">Benar</TableHead>
                        <TableHead className="text-right">Salah</TableHead>
                        <TableHead className="text-right">Kosong</TableHead>
                        <TableHead className="text-right">Durasi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.sections.map((section) => (
                        <SectionResultRow key={section.id} section={section} />
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="grid gap-3 md:hidden">
                  {data.sections.map((section) => (
                    <SectionResultCard key={section.id} section={section} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </main>
  )
}

function LockedResultCard({
  releaseText,
  sessionId,
}: {
  releaseText: string
  sessionId: number
}) {
  return (
    <Empty className="min-h-[24rem] border bg-card">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ClockIcon />
        </EmptyMedia>
        <EmptyTitle>Hasil Belum Tersedia</EmptyTitle>
        <EmptyDescription>
          Hasil tryout belum bisa ditampilkan. {releaseText}
        </EmptyDescription>
      </EmptyHeader>
      <Button asChild variant="outline">
        <Link href={`/tryout-sessions/${sessionId}`}>Kembali ke Tryout</Link>
      </Button>
    </Empty>
  )
}

function SectionResultRow({ section }: { section: TryoutSectionResult }) {
  return (
    <TableRow>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{section.title}</span>
          <span className="text-xs text-muted-foreground">{section.subjectName}</span>
        </div>
      </TableCell>
      <TableCell className="text-right font-medium tabular-nums">
        {formatNumber(section.score)} / {formatNumber(section.maxScore)}
      </TableCell>
      <TableCell className="text-right tabular-nums">{section.correctCount}</TableCell>
      <TableCell className="text-right tabular-nums">{section.wrongCount}</TableCell>
      <TableCell className="text-right tabular-nums">{section.unansweredCount}</TableCell>
      <TableCell className="text-right tabular-nums">
        {formatDuration(section.durationUsedSeconds)}
      </TableCell>
    </TableRow>
  )
}

function SectionResultCard({ section }: { section: TryoutSectionResult }) {
  return (
    <article className="rounded-xl border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-medium text-foreground">{section.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{section.subjectName}</p>
        </div>
        <p className="font-semibold tabular-nums text-primary">
          {formatNumber(section.score)}
        </p>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">
        <MiniMetric label="Benar" value={section.correctCount} />
        <MiniMetric label="Salah" value={section.wrongCount} />
        <MiniMetric label="Kosong" value={section.unansweredCount} />
        <MiniMetric label="Durasi" value={formatDuration(section.durationUsedSeconds)} />
      </div>
    </article>
  )
}

function MiniMetric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg bg-muted/50 p-2">
      <p className="font-medium tabular-nums text-foreground">{value}</p>
      <p className="mt-1 text-muted-foreground">{label}</p>
    </div>
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
      <p className={cn("mt-3 text-xl font-semibold tabular-nums", toneClass.value)}>
        {value}
      </p>
    </div>
  )
}

function ResultStatusBadge({
  isFinal,
  status,
}: {
  isFinal: boolean
  status: TryoutResultData["status"]
}) {
  if (isFinal) {
    return (
      <Badge variant="outline" className="border-chart-2/35 bg-chart-2/10 text-chart-2">
        Final
      </Badge>
    )
  }

  return <Badge variant="secondary">{status === "grading" ? "Diproses" : "Sementara"}</Badge>
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

function formatReleaseText(releaseAt: string | null) {
  if (!releaseAt) {
    return "Jadwal rilis akan diinformasikan oleh admin."
  }

  return `Hasil dijadwalkan rilis pada ${formatDateTime(releaseAt)}.`
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
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
