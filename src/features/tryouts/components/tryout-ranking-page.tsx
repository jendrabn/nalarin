import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"
import type { ReactNode } from "react"

import { EmptyState } from "@/components/empty-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

import type { TryoutRankingData, TryoutRankingRow } from "../types"

export function TryoutRankingPage({ data }: { data: TryoutRankingData }) {
  const lockedByPlan = data.release.available && !data.release.allowedByPlan
  const unavailable = !data.release.available
  const scoreLabel = data.session.scoringMethod === "irt_3pl" ? "IRT Score" : "Skor"

  return (
    <main className="relative min-h-svh overflow-hidden bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_34%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.12),transparent_28%),linear-gradient(to_bottom,rgba(59,130,246,0.04),transparent_18%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_34%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.14),transparent_28%),linear-gradient(to_bottom,rgba(59,130,246,0.06),transparent_18%)]"
      />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <PageHeader
          className="mb-0"
          title={`Rangking Tryout ${data.session.title}`}
          subtitle="Lihat peringkat peserta berdasarkan skor akhir pada sesi tryout ini."
          actions={
            <Button asChild variant="ghost">
              <Link href={`/tryout-sessions/${data.session.id}/result`}>
                <ArrowLeftIcon data-icon="inline-start" />
                Kembali ke Hasil
              </Link>
            </Button>
          }
        />

        {unavailable ? (
          <RankingUnavailable data={data} />
        ) : (
          <>
            {data.ownRank ? <OwnRankCard row={data.ownRank} scoreLabel={scoreLabel} /> : null}

            {lockedByPlan ? (
              <RankingLockedNotice participantCount={data.participantCount} data={data} />
            ) : (
              <Card className="shadow-sm">
                <CardHeader>
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <CardTitle>Leaderboard</CardTitle>
                    <Badge variant="outline" className="w-fit">
                      {data.participantCount} Peserta
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-5">
                  {data.leaderboard.length > 0 ? (
                    <Table className="min-w-[56rem]">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-20 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                            Rank
                          </TableHead>
                          <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                            Peserta
                          </TableHead>
                          <TableHead className="text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                            {scoreLabel}
                          </TableHead>
                          <TableHead className="text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                            Benar
                          </TableHead>
                          <TableHead className="text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                            Salah
                          </TableHead>
                          <TableHead className="text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                            Kosong
                          </TableHead>
                          <TableHead className="text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                            Durasi
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.leaderboard.map((row) => (
                          <RankingTableRow key={row.sessionId} row={row} />
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <EmptyState title="Belum Ada Ranking" className="py-12" />
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </main>
  )
}

function RankingUnavailable({
  data,
}: {
  data: TryoutRankingData
}) {
  return (
    <div className="flex min-h-[24rem] flex-col items-center justify-center gap-4">
      <EmptyState title="Ranking Belum Tersedia" className="py-0" />
      <Button asChild variant="outline">
        <Link href={`/tryout-sessions/${data.session.id}/result`}>Kembali ke Hasil</Link>
      </Button>
    </div>
  )
}

function RankingLockedNotice({
  participantCount,
  data,
}: {
  participantCount: number
  data: TryoutRankingData
}) {
  return (
    <Card className="border-primary/20 bg-primary/5 shadow-sm">
      <CardHeader className="border-b">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">Leaderboard Terkunci</CardTitle>
            <p className="text-sm text-muted-foreground">
              Posisi kamu tetap dihitung, tetapi tabel leaderboard hanya tersedia untuk paket yang
              mendukung ranking.
            </p>
          </div>
          <Badge variant="outline" className="w-fit border-primary/30 bg-background">
            {participantCount} Peserta
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline-primary">
            <Link href="/pricing">Lihat Paket</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/tryout-sessions/${data.session.id}/result`}>Kembali ke Hasil</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function OwnRankCard({ row, scoreLabel }: { row: TryoutRankingRow; scoreLabel: string }) {
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background shadow-sm">
      <CardContent className="py-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-center">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-background/85 text-xl font-semibold text-primary shadow-sm shadow-primary/5 backdrop-blur-sm">
              #{row.rank}
            </div>
            <div className="flex min-w-0 flex-col justify-center gap-0.5">
              <h2 className="truncate text-xl font-semibold text-foreground">{row.userName}</h2>
              <p className="text-sm leading-6 text-muted-foreground">Peringkat {row.rank}</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border/60 bg-background/80 shadow-sm backdrop-blur-sm">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
              <RankMiniMetric label={scoreLabel} value={formatNumber(row.totalScore)} />
              <RankMiniMetric label="Benar" value={row.totalCorrect} />
              <RankMiniMetric label="Salah" value={row.totalWrong} />
              <RankMiniMetric label="Kosong" value={row.totalUnanswered} />
              <RankMiniMetric label="Durasi" value={formatDuration(row.durationUsedSeconds)} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function RankingTableRow({ row }: { row: TryoutRankingRow }) {
  const participantName = getLeaderboardParticipantName(row)

  return (
    <TableRow
      className={cn(
        row.isCurrentUser &&
          "bg-emerald-500/10 hover:bg-emerald-500/15 dark:bg-emerald-500/12 dark:hover:bg-emerald-500/18",
      )}
    >
      <TableCell className="font-medium tabular-nums text-foreground">
        #{row.rank}
      </TableCell>
      <TableCell>
        <p className="truncate font-medium text-foreground">{participantName}</p>
      </TableCell>
      <TableCell className="text-right font-semibold tabular-nums text-foreground">
        {formatNumber(row.totalScore)}
      </TableCell>
      <TableCell className="text-right tabular-nums">{row.totalCorrect}</TableCell>
      <TableCell className="text-right tabular-nums">{row.totalWrong}</TableCell>
      <TableCell className="text-right tabular-nums">{row.totalUnanswered}</TableCell>
      <TableCell className="text-right tabular-nums">
        {formatDuration(row.durationUsedSeconds)}
      </TableCell>
    </TableRow>
  )
}

function RankMiniMetric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex min-h-24 flex-col items-center justify-center gap-2 border-b border-border/60 px-4 py-4 text-center xl:border-b-0 xl:border-r last:border-r-0">
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </p>
      <p className="text-base font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  )
}

function getLeaderboardParticipantName(row: TryoutRankingRow) {
  if (row.isCurrentUser) {
    return row.userName
  }

  const nameParts = row.userName.trim().split(/\s+/).filter(Boolean)

  if (nameParts.length <= 1) {
    return nameParts[0] ?? row.userName
  }

  return [
    nameParts[0],
    ...nameParts.slice(1).map((part) => "*".repeat(Math.max(part.length, 3))),
  ].join(" ")
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
