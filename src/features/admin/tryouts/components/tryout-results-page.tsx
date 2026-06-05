"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ArrowLeftIcon,
  BarChart3Icon,
  CheckCircle2Icon,
  EllipsisVerticalIcon,
  Clock3Icon,
  DownloadIcon,
  MedalIcon,
  PercentIcon,
  TrophyIcon,
  UsersIcon,
} from "lucide-react"
import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  Label,
  LabelList,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"

import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { InsightMetricCard } from "./tryout-insight-metric-card"
import type {
  AdminTryoutInsightData,
  AdminTryoutLeaderboardRow,
} from "../queries/insights"
import {
  formatDuration,
  formatInteger,
  formatPercent,
  formatScore,
} from "../utils/insights"
import * as XLSX from "xlsx"

type TryoutResultsPageProps = {
  insight: AdminTryoutInsightData
}

type SessionDetailState = {
  open: boolean
  row: AdminTryoutLeaderboardRow | null
}

const statusLabels = {
  pending: "Pending",
  in_progress: "In progress",
  submitted: "Submitted",
  grading: "Grading",
  graded: "Graded",
  cancelled: "Cancelled",
} as const

const scoreDistributionChartConfig = {
  participants: {
    label: "Participants",
    color: "var(--chart-1)",
  },
} as const

const sessionStatusChartConfig = {
  pending: {
    label: "Pending",
    color: "var(--chart-5)",
  },
  in_progress: {
    label: "In progress",
    color: "var(--chart-1)",
  },
  submitted: {
    label: "Submitted",
    color: "var(--chart-2)",
  },
  grading: {
    label: "Grading",
    color: "var(--chart-3)",
  },
  graded: {
    label: "Graded",
    color: "var(--chart-4)",
  },
  cancelled: {
    label: "Cancelled",
    color: "var(--chart-5)",
  },
} as const

const sessionStatusLegendItems = Object.entries(sessionStatusChartConfig).map(
  ([status, config]) => ({
    status,
    label: config.label,
    color: config.color,
  }),
)

const subtestPerformanceChartConfig = {
  averagePercentage: {
    label: "Average percentage",
    color: "var(--chart-1)",
  },
} as const

export function TryoutResultsPage({ insight }: TryoutResultsPageProps) {
  const isIrtScoring = insight.tryout.scoringMethod === "irt_3pl"
  const scoreLabel = isIrtScoring ? "IRT Score" : "Score"
  const maxScoreLabel = isIrtScoring ? "Scale Max" : "Max"
  const scorePhrase = isIrtScoring ? "IRT score" : "score"
  const [detailState, setDetailState] = useState<SessionDetailState>({
    open: false,
    row: null,
  })

  const scoreDistributionData = useMemo(
    () =>
      insight.scoreBuckets.map((bucket) => ({
        bucket: bucket.label,
        participants: bucket.count,
      })),
    [insight.scoreBuckets],
  )

  const sessionStatusData = useMemo(
    () =>
      Object.entries(statusLabels).map(([status, label]) => ({
        status,
        label,
        value: insight.statusCounts[status as keyof typeof statusLabels],
      })),
    [insight.statusCounts],
  )

  const subtestPerformanceData = useMemo(
    () =>
      insight.sectionAnalytics.map((section) => ({
        sectionTitle: section.sectionTitle,
        subjectName: section.subjectName,
        averagePercentage: Number(section.averagePercentage.toFixed(1)),
        averageScore: Number(section.averageScore.toFixed(2)),
        medianScore: Number(section.medianScore.toFixed(2)),
        sessionCount: section.sessionCount,
        averageDurationSeconds: Math.round(section.averageDurationSeconds),
      })),
    [insight.sectionAnalytics],
  )

  const gradedSessionCount = insight.leaderboard.length

  const handleExportLeaderboard = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      insight.leaderboard.map((row) => {
        const blank = Math.max(0, row.totalQuestions - row.totalCorrect - row.totalWrong)

        return {
          Rank: row.rank,
          Participant: row.userName,
          [scoreLabel]: row.totalScore,
          Correct: row.totalCorrect,
          Wrong: row.totalWrong,
          Blank: blank,
          Duration: formatDuration(row.durationUsedSeconds),
          "Questions Total": row.totalQuestions,
        }
      }),
    )

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leaderboard")
    const safeTitle = insight.tryout.title.replace(/[\\/:*?"<>|]/g, "-")
    XLSX.writeFile(workbook, `${safeTitle}-leaderboard.xlsx`)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Results & Analytics - ${insight.tryout.title}`}
        subtitle="Review tryout results to analyze rankings, session status, and subtest performance."
        actions={
          <Button asChild variant="outline">
            <Link href={`/admin/tryouts/${insight.tryout.id}`}>
              <ArrowLeftIcon data-icon="inline-start" />
              Back
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <InsightMetricCard
          icon={UsersIcon}
          label="Participants"
          value={formatInteger(insight.metrics.totalSessions)}
          description="Total sessions recorded for this tryout."
        />
        <InsightMetricCard
          icon={CheckCircle2Icon}
          label="Completed"
          value={formatInteger(insight.metrics.gradedSessions)}
          description={`${formatPercent(insight.metrics.completionRate)} of all sessions.`}
        />
        <InsightMetricCard
          icon={BarChart3Icon}
          label={`Average ${isIrtScoring ? "IRT Score" : "score"}`}
          value={formatScore(insight.metrics.averageScore)}
          description={`Average ${scorePhrase} among graded participants.`}
        />
        <InsightMetricCard
          icon={MedalIcon}
          label={`Median ${isIrtScoring ? "IRT Score" : "score"}`}
          value={formatScore(insight.metrics.medianScore)}
          description="Middle value that reduces outlier bias."
        />
        <InsightMetricCard
          icon={PercentIcon}
          label="Accuracy"
          value={formatPercent(insight.metrics.averageAccuracy)}
          description="Average correct-answer rate across graded sessions."
        />
        <InsightMetricCard
          icon={Clock3Icon}
          label="Average duration"
          value={formatDuration(insight.metrics.averageDurationSeconds)}
          description="Mean time spent per graded session."
        />
        <InsightMetricCard
          icon={ArrowDownIcon}
          label={`Lowest ${isIrtScoring ? "IRT Score" : "score"}`}
          value={formatScore(insight.metrics.bottomScore)}
          description="Smallest score recorded in this tryout."
        />
        <InsightMetricCard
          icon={ArrowUpIcon}
          label={`Highest ${isIrtScoring ? "IRT Score" : "score"}`}
          value={formatScore(insight.metrics.topScore)}
          description="Largest score recorded in this tryout."
        />
        <InsightMetricCard
          icon={TrophyIcon}
          label={`Avg ${maxScoreLabel.toLowerCase()}`}
          value={formatScore(insight.metrics.averageMaxScore)}
          description="Average maximum score available per session."
        />
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-3">
        <Card className="border border-border/70 bg-card/95 shadow-sm">
          <CardHeader className="space-y-1 pb-3">
            <CardTitle>Session Status</CardTitle>
            <CardDescription>Distribution of all tryout sessions by status.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {insight.metrics.totalSessions > 0 ? (
              <ChartContainer
                config={sessionStatusChartConfig}
                className="aspect-auto h-[220px] w-full"
              >
                <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent nameKey="status" indicator="dot" />}
                  />
                  <Pie
                    data={sessionStatusData}
                    dataKey="value"
                    nameKey="status"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={3}
                  >
                    {sessionStatusData.map((item) => (
                      <Cell key={item.status} fill={`var(--color-${item.status})`} />
                    ))}
                    <Label
                      content={({ viewBox }) => {
                        if (
                          !viewBox ||
                          typeof viewBox !== "object" ||
                          !("cx" in viewBox) ||
                          !("cy" in viewBox)
                        ) {
                          return null
                        }

                        const cx = Number(viewBox.cx)
                        const cy = Number(viewBox.cy)

                        return (
                          <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                            <tspan
                              x={cx}
                              y={cy - 6}
                              className="fill-foreground text-xl font-semibold"
                            >
                              {formatInteger(insight.metrics.totalSessions)}
                            </tspan>
                            <tspan
                              x={cx}
                              y={cy + 16}
                              className="fill-muted-foreground text-[10px] uppercase tracking-[0.16em]"
                            >
                              sessions
                            </tspan>
                          </text>
                        )
                      }}
                    />
                  </Pie>
                </PieChart>
              </ChartContainer>
            ) : (
              <EmptyState title="No Session Status Yet" className="min-h-[220px]" />
            )}
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs">
              {sessionStatusLegendItems.map((item) => (
                <div key={item.status} className="inline-flex items-center gap-2 text-foreground">
                  <span
                    className="size-3 shrink-0 rounded-[3px] shadow-sm ring-1 ring-black/10 dark:ring-white/10"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="whitespace-nowrap">{item.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-card/95 shadow-sm">
          <CardHeader className="space-y-1 pb-3">
            <CardTitle>Score Distribution</CardTitle>
            <CardDescription>
              Share of graded participants across {isIrtScoring ? "IRT score" : "score"} bands.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {gradedSessionCount > 0 ? (
              <ChartContainer
                config={scoreDistributionChartConfig}
                className="aspect-auto h-[220px] w-full"
              >
                <BarChart
                  data={scoreDistributionData}
                  margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="bucket"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={6}
                    interval={0}
                  />
                  <YAxis hide domain={[0, "dataMax"]} allowDecimals={false} />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="line" />}
                  />
                  <Bar
                    dataKey="participants"
                    fill="var(--color-participants)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={32}
                  >
                    <LabelList
                      dataKey="participants"
                      position="top"
                      className="fill-muted-foreground text-[10px] font-medium"
                    />
                  </Bar>
                </BarChart>
              </ChartContainer>
            ) : (
              <EmptyState title="No Score Data Yet" className="min-h-[220px]" />
            )}
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-card/95 shadow-sm">
          <CardHeader className="space-y-1 pb-3">
            <CardTitle>Subtest Performance</CardTitle>
            <CardDescription>
              Average {scorePhrase} and pace across all graded subtests.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {subtestPerformanceData.length > 0 ? (
              <ChartContainer
                config={subtestPerformanceChartConfig}
                className="aspect-auto h-[220px] w-full"
              >
                <BarChart
                  data={subtestPerformanceData}
                  layout="vertical"
                  margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                >
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <YAxis
                    type="category"
                    dataKey="sectionTitle"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={4}
                    width={76}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="line" />}
                  />
                  <Bar
                    dataKey="averagePercentage"
                    fill="var(--color-averagePercentage)"
                    radius={[0, 6, 6, 0]}
                    maxBarSize={24}
                  />
                </BarChart>
              </ChartContainer>
            ) : (
              <EmptyState title="No Subtest Analytics Yet" className="min-h-[220px]" />
            )}
          </CardContent>
        </Card>
      </div>


      <Card className="border border-border/70 bg-card/95 shadow-sm">
        <CardHeader className="space-y-1 pb-3 sm:flex sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:space-y-0">
          <div className="space-y-1">
            <CardTitle>Leaderboard</CardTitle>
            <CardDescription>
              Participant rankings are ordered by {scorePhrase}, with a detailed
              subtest view available from the action menu.
            </CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={handleExportLeaderboard}>
            <DownloadIcon data-icon="inline-start" />
            Export Excel
          </Button>
        </CardHeader>
        <CardContent>
          {insight.leaderboard.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Rank
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Participant
                  </TableHead>
                  <TableHead className="w-28 text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {scoreLabel}
                  </TableHead>
                  <TableHead className="w-24 text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Correct
                  </TableHead>
                  <TableHead className="w-24 text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Wrong
                  </TableHead>
                  <TableHead className="w-24 text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Blank
                  </TableHead>
                  <TableHead className="w-28 text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Duration
                  </TableHead>
                  <TableHead className="w-16 text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {insight.leaderboard.map((row) => {
                  const blank = Math.max(0, row.totalQuestions - row.totalCorrect - row.totalWrong)

                  return (
                    <TableRow key={row.sessionId} className="data-[state=selected]:bg-muted/40">
                      <TableCell className="font-medium tabular-nums text-foreground">
                        #{row.rank}
                      </TableCell>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">{row.userName}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatInteger(row.totalQuestions)} questions
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums text-foreground">
                        {formatScore(row.totalScore)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-foreground">
                        {formatInteger(row.totalCorrect)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-foreground">
                        {formatInteger(row.totalWrong)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-foreground">
                        {formatInteger(blank)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-foreground">
                        {formatDuration(row.durationUsedSeconds)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="rounded-full"
                              aria-label={`Open actions for ${row.userName}`}
                            >
                              <EllipsisVerticalIcon />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem
                              onClick={() =>
                                setDetailState({
                                  open: true,
                                  row,
                                })
                              }
                            >
                              <BarChart3Icon />
                              {scoreLabel} details
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <EmptyState title="No Leaderboard Yet" className="min-h-[280px]" />
          )}
        </CardContent>
      </Card>

      <Dialog
        open={detailState.open}
        onOpenChange={(open) => {
          if (!open) {
            setDetailState({ open: false, row: null })
          }
        }}
      >
        <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {scoreLabel} details {detailState.row ? `- ${detailState.row.userName}` : ""}
            </DialogTitle>
            <DialogDescription>
              Participant {scorePhrase} breakdown by subtest, including correct, wrong,
              blank, and duration.
            </DialogDescription>
          </DialogHeader>

          {detailState.row ? (
            <div className="flex flex-col gap-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <DialogStat label={`Total ${scorePhrase}`} value={formatScore(detailState.row.totalScore)} />
                <DialogStat label="Correct" value={formatInteger(detailState.row.totalCorrect)} />
                <DialogStat label="Wrong" value={formatInteger(detailState.row.totalWrong)} />
                <DialogStat label="Duration" value={formatDuration(detailState.row.durationUsedSeconds)} />
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Subtest
                    </TableHead>
                    <TableHead className="w-28 text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      {scoreLabel}
                    </TableHead>
                    <TableHead className="w-24 text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      {maxScoreLabel}
                    </TableHead>
                    <TableHead className="w-20 text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Correct
                    </TableHead>
                    <TableHead className="w-20 text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Wrong
                    </TableHead>
                    <TableHead className="w-20 text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Blank
                    </TableHead>
                    <TableHead className="w-28 text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Duration
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detailState.row.sections.map((section) => {
                    const blank = Math.max(
                      0,
                      section.totalQuestions - section.correctCount - section.wrongCount,
                    )

                    return (
                      <TableRow key={section.sectionSessionId}>
                        <TableCell>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground">
                              {section.sectionTitle}
                            </p>
                            <p className="text-xs text-muted-foreground">{section.subjectName}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums text-foreground">
                          {formatScore(section.score)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-foreground">
                          {formatScore(section.maxScore)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-foreground">
                          {formatInteger(section.correctCount)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-foreground">
                          {formatInteger(section.wrongCount)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-foreground">
                          {formatInteger(blank)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-foreground">
                          {formatDuration(section.durationUsedSeconds)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DialogStat({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  )
}

