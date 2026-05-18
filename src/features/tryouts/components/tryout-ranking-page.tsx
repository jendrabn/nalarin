import Link from "next/link"
import {
  ArrowLeftIcon,
  ClockIcon,
  CrownIcon,
  LockIcon,
  MedalIcon,
  TrophyIcon,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

import type { TryoutRankingData, TryoutRankingRow } from "../types"

export function TryoutRankingPage({ data }: { data: TryoutRankingData }) {
  const lockedByPlan = data.release.available && !data.release.allowedByPlan
  const unavailable = !data.release.available || lockedByPlan

  return (
    <main className="min-h-svh bg-muted/35 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant="outline">{data.session.examTypeName}</Badge>
              <Badge variant="secondary">{data.session.title}</Badge>
            </div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Ranking Tryout
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Peringkat dihitung dari sesi yang sudah selesai dinilai.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={`/tryout-sessions/${data.session.id}/result`}>
              <ArrowLeftIcon data-icon="inline-start" />
              Kembali ke Hasil
            </Link>
          </Button>
        </header>

        {unavailable ? (
          <RankingUnavailable data={data} lockedByPlan={lockedByPlan} />
        ) : (
          <>
            {data.ownRank ? <OwnRankCard row={data.ownRank} /> : null}

            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between gap-3">
                <CardTitle>Leaderboard</CardTitle>
                <Badge variant="outline">{data.participantCount} Peserta</Badge>
              </CardHeader>
              <CardContent>
                {data.leaderboard.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-20">Rank</TableHead>
                        <TableHead>Peserta</TableHead>
                        <TableHead className="text-right">Skor</TableHead>
                        <TableHead className="text-right">Benar</TableHead>
                        <TableHead className="text-right">Durasi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.leaderboard.map((row) => (
                        <RankingTableRow key={row.sessionId} row={row} />
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <Empty className="border bg-muted/20">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <TrophyIcon />
                      </EmptyMedia>
                      <EmptyTitle>Belum Ada Ranking</EmptyTitle>
                      <EmptyDescription>
                        Ranking akan muncul setelah ada sesi yang selesai dinilai.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </main>
  )
}

function RankingUnavailable({
  data,
  lockedByPlan,
}: {
  data: TryoutRankingData
  lockedByPlan: boolean
}) {
  if (lockedByPlan) {
    return (
      <Alert variant="destructive">
        <LockIcon />
        <AlertTitle>Ranking Termasuk Fitur Premium</AlertTitle>
        <AlertDescription>
          Sesi kamu tetap masuk perhitungan ranking, tetapi leaderboard hanya dapat dilihat oleh
          paket yang mendukung akses ranking.
        </AlertDescription>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button asChild variant="destructive-solid">
            <Link href="/pricing">Lihat Paket</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/tryout-sessions/${data.session.id}/result`}>Kembali ke Hasil</Link>
          </Button>
        </div>
      </Alert>
    )
  }

  return (
    <Empty className="min-h-[24rem] border bg-card">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ClockIcon />
        </EmptyMedia>
        <EmptyTitle>Ranking Belum Tersedia</EmptyTitle>
        <EmptyDescription>
          {data.release.releaseAt
            ? `Ranking dijadwalkan rilis pada ${formatDateTime(data.release.releaseAt)}.`
            : "Jadwal rilis ranking akan diinformasikan oleh admin."}
        </EmptyDescription>
      </EmptyHeader>
      <Button asChild variant="outline">
        <Link href={`/tryout-sessions/${data.session.id}/result`}>Kembali ke Hasil</Link>
      </Button>
    </Empty>
  )
}

function OwnRankCard({ row }: { row: TryoutRankingRow }) {
  return (
    <Card className="border-primary/20 bg-primary/5 shadow-sm">
      <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="grid size-12 place-items-center rounded-xl bg-primary text-lg font-semibold text-primary-foreground">
            #{row.rank}
          </span>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Peringkat Kamu</p>
            <h2 className="mt-1 text-lg font-semibold text-foreground">{row.userName}</h2>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center text-sm">
          <RankMiniMetric label="Skor" value={formatNumber(row.totalScore)} />
          <RankMiniMetric label="Benar" value={row.totalCorrect} />
          <RankMiniMetric label="Durasi" value={formatDuration(row.durationUsedSeconds)} />
        </div>
      </CardContent>
    </Card>
  )
}

function RankingTableRow({ row }: { row: TryoutRankingRow }) {
  const rankMeta = getRankMeta(row.rank)

  return (
    <TableRow className={cn(row.isCurrentUser && "bg-primary/5 hover:bg-primary/10")}>
      <TableCell>
        <Badge variant="outline" className={cn("gap-1", rankMeta.className)}>
          {rankMeta.icon}
          #{row.rank}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={row.userAvatarUrl ?? undefined} alt={row.userName} />
            <AvatarFallback>{getInitials(row.userName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{row.userName}</p>
            {row.isCurrentUser ? (
              <p className="text-xs text-primary">Kamu</p>
            ) : null}
          </div>
        </div>
      </TableCell>
      <TableCell className="text-right font-semibold tabular-nums">
        {formatNumber(row.totalScore)}
      </TableCell>
      <TableCell className="text-right tabular-nums">{row.totalCorrect}</TableCell>
      <TableCell className="text-right tabular-nums">
        {formatDuration(row.durationUsedSeconds)}
      </TableCell>
    </TableRow>
  )
}

function RankMiniMetric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-background/80 px-4 py-2">
      <p className="font-semibold tabular-nums text-foreground">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

function getRankMeta(rank: number) {
  if (rank === 1) {
    return {
      icon: <CrownIcon />,
      className: "border-chart-3/35 bg-chart-3/10 text-chart-3",
    }
  }

  if (rank <= 3) {
    return {
      icon: <MedalIcon />,
      className: "border-primary/30 bg-primary/10 text-primary",
    }
  }

  return {
    icon: <TrophyIcon />,
    className: "bg-muted text-muted-foreground",
  }
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
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
