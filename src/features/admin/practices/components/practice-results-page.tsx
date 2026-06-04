"use client"

import { useMemo, useState, type ComponentType } from "react"
import Link from "next/link"
import {
  ArrowDownIcon,
  ArrowLeftIcon,
  BarChart3Icon,
  CheckCircle2Icon,
  Clock3Icon,
  EllipsisVerticalIcon,
  FileDownIcon,
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
  LabelList,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"

import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
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
import { cn } from "@/lib/utils"
import { formatAdminEnglishDateTime } from "@/lib/format"

import type {
  PracticeInsightData,
  PracticeInsightParticipantRow,
  PracticeSessionInsightStatus,
} from "../queries/insights"
import { formatDuration, formatInteger, formatPercent, formatScore } from "../utils/insights"
import { downloadPracticeLeaderboardWorkbook } from "../utils/leaderboard-export"

type PracticeResultsPageProps = {
  insight: PracticeInsightData
}

type ParticipantDetailState = {
  open: boolean
  participant: PracticeInsightParticipantRow | null
}

const sessionStatusLabels: Record<PracticeSessionInsightStatus, string> = {
  pending: "Pending",
  in_progress: "In progress",
  submitted: "Submitted",
  grading: "Grading",
  graded: "Graded",
  cancelled: "Cancelled",
}

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

const scoreDistributionChartConfig = {
  participants: {
    label: "Participants",
    color: "var(--chart-1)",
  },
} as const

const attemptDistributionChartConfig = {
  participants: {
    label: "Participants",
    color: "var(--chart-2)",
  },
} as const

const sessionStatusLegendItems = Object.entries(sessionStatusChartConfig).map(([status, config]) => ({
  status: status as PracticeSessionInsightStatus,
  label: config.label,
  color: config.color,
}))

export function PracticeResultsPage({ insight }: PracticeResultsPageProps) {
  const [detailState, setDetailState] = useState<ParticipantDetailState>({
    open: false,
    participant: null,
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
      Object.entries(sessionStatusLabels).map(([status, label]) => ({
        status,
        label,
        value: insight.statusCounts[status as PracticeSessionInsightStatus],
      })),
    [insight.statusCounts],
  )

  const attemptDistributionData = useMemo(
    () =>
      insight.attemptBuckets.map((bucket) => ({
        attempts: bucket.label,
        participants: bucket.count,
      })),
    [insight.attemptBuckets],
  )

  const hasScoreData = scoreDistributionData.some((item) => item.participants > 0)
  const hasStatusData = sessionStatusData.some((item) => item.value > 0)
  const hasAttemptData = attemptDistributionData.some((item) => item.participants > 0)

  const metricCards = [
    {
      icon: UsersIcon,
      label: "Unique Participants",
      value: formatInteger(insight.metrics.uniqueParticipants),
      description: "Distinct users who have started this practice.",
    },
    {
      icon: BarChart3Icon,
      label: "Total Sessions",
      value: formatInteger(insight.metrics.totalSessions),
      description: "All practice attempts recorded in the admin panel.",
    },
    {
      icon: CheckCircle2Icon,
      label: "Graded Sessions",
      value: formatInteger(insight.metrics.gradedSessions),
      description: "Sessions that already have a final score.",
    },
    {
      icon: PercentIcon,
      label: "Completion Rate",
      value: formatPercent(insight.metrics.completionRate),
      description: "Share of sessions that reached grading.",
    },
    {
      icon: TrophyIcon,
      label: "Average Score",
      value: formatScore(insight.metrics.averageScore),
      description: "Mean score across graded attempts.",
    },
    {
      icon: MedalIcon,
      label: "Median Score",
      value: formatScore(insight.metrics.medianScore),
      description: "Middle score across graded attempts.",
    },
    {
      icon: CheckCircle2Icon,
      label: "Average Accuracy",
      value: formatPercent(insight.metrics.averageAccuracy),
      description: "Correct-answer rate across graded attempts.",
    },
    {
      icon: Clock3Icon,
      label: "Average Duration",
      value: formatDuration(Math.round(insight.metrics.averageDurationSeconds)),
      description: "Average time spent per graded session.",
    },
    {
      icon: TrophyIcon,
      label: "Highest Score",
      value: formatScore(insight.metrics.topScore),
      description: "Best graded session score recorded.",
    },
    {
      icon: ArrowDownIcon,
      label: "Lowest Score",
      value: formatScore(insight.metrics.bottomScore),
      description: "Lowest graded session score recorded.",
    },
    {
      icon: PercentIcon,
      label: "Average Max Score",
      value: formatScore(insight.metrics.averageMaxScore),
      description: "Average total possible score per graded session.",
    },
    {
      icon: BarChart3Icon,
      label: "Avg Attempts / Participant",
      value: formatScore(insight.metrics.averageAttemptsPerParticipant),
      description: "Average number of sessions started per participant.",
    },
  ] as const

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Results & Analytics - ${insight.practice.title}`}
        subtitle="Review practice results to analyze participant performance and session trends."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href={`/admin/practices/${insight.practice.id}`}>
                <ArrowLeftIcon data-icon="inline-start" />
                Back
              </Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((card) => (
          <InsightMetricCard
            key={card.label}
            icon={card.icon}
            label={card.label}
            value={card.value}
            description={card.description}
          />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="border border-border/70 bg-card/95 shadow-sm">
          <CardHeader className="flex flex-col gap-1.5">
            <CardTitle className="text-lg">Score Distribution</CardTitle>
            <CardDescription>Share of graded sessions across score bands.</CardDescription>
          </CardHeader>
          <CardContent>
            {hasScoreData ? (
              <ChartContainer config={scoreDistributionChartConfig} className="min-h-[260px] w-full">
                <BarChart
                  data={scoreDistributionData}
                  margin={{ left: 0, right: 0, top: 8, bottom: 0 }}
                  accessibilityLayer
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="bucket"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    interval={0}
                  />
                  <YAxis hide />
                  <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                  <Bar
                    dataKey="participants"
                    fill="var(--color-participants)"
                    radius={[8, 8, 0, 0]}
                    maxBarSize={42}
                  >
                    <LabelList dataKey="participants" position="top" className="fill-foreground" />
                  </Bar>
                </BarChart>
              </ChartContainer>
            ) : (
              <EmptyState title="No Graded Sessions Yet" />
            )}
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-card/95 shadow-sm">
          <CardHeader className="flex flex-col gap-1.5">
            <CardTitle className="text-lg">Session Status</CardTitle>
            <CardDescription>Distribution of all practice sessions by status.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {hasStatusData ? (
              <>
                <ChartContainer
                  config={sessionStatusChartConfig}
                  className="mx-auto h-[240px] w-full max-w-[240px]"
                >
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <Pie
                      data={sessionStatusData}
                      dataKey="value"
                      nameKey="label"
                      innerRadius={68}
                      outerRadius={94}
                      strokeWidth={3}
                      paddingAngle={2}
                    >
                      {sessionStatusData.map((entry) => (
                        <Cell key={entry.status} fill={sessionStatusChartConfig[entry.status as PracticeSessionInsightStatus].color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <div className="flex flex-wrap gap-2">
                  {sessionStatusLegendItems.map((item) => (
                    <div
                      key={item.status}
                      className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background px-3 py-1.5 text-xs font-medium text-foreground"
                    >
                      <span
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span>{item.label}</span>
                      <span className="text-muted-foreground tabular-nums">
                        {formatInteger(insight.statusCounts[item.status])}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <EmptyState title="No Session Status Yet" />
            )}
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-card/95 shadow-sm">
          <CardHeader className="flex flex-col gap-1.5">
            <CardTitle className="text-lg">Attempt Frequency</CardTitle>
            <CardDescription>Participant count grouped by total practice attempts.</CardDescription>
          </CardHeader>
          <CardContent>
            {hasAttemptData ? (
              <ChartContainer
                config={attemptDistributionChartConfig}
                className="min-h-[260px] w-full"
              >
                <BarChart
                  data={attemptDistributionData}
                  margin={{ left: 0, right: 0, top: 8, bottom: 0 }}
                  accessibilityLayer
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="attempts"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                  />
                  <YAxis hide />
                  <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                  <Bar
                    dataKey="participants"
                    fill="var(--color-participants)"
                    radius={[8, 8, 0, 0]}
                    maxBarSize={42}
                  >
                    <LabelList dataKey="participants" position="top" className="fill-foreground" />
                  </Bar>
                </BarChart>
              </ChartContainer>
            ) : (
              <EmptyState title="No Participant Data Yet" />
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border border-border/70 bg-card/95 shadow-sm">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1.5">
            <CardTitle className="text-lg">Leaderboard</CardTitle>
            <CardDescription>
              Participants are ordered by performance, with repeated attempts grouped under each
              learner.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => downloadPracticeLeaderboardWorkbook(insight)}
          >
            <FileDownIcon data-icon="inline-start" />
            Export Excel
          </Button>
        </CardHeader>
        <CardContent>
          {insight.participants.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-border/60">
              <Table className="min-w-[1120px]">
                <TableHeader>
                  <TableRow className="bg-muted/35">
                    <TableHead className="w-16 text-[11px] font-semibold uppercase tracking-[0.16em]">
                      Rank
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em]">
                      Participant
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em]">
                      Sessions
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em]">
                      Graded
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em]">
                      Best Score
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em]">
                      Avg Score
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em]">
                      Correct
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em]">
                      Wrong
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em]">
                      Blank
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em]">
                      Duration
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em]">
                      Latest Status
                    </TableHead>
                    <TableHead className="text-right text-[11px] font-semibold uppercase tracking-[0.16em]">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {insight.participants.map((participant) => (
                    <TableRow key={participant.userId}>
                      <TableCell className="font-medium tabular-nums">
                        {participant.rank}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {participant.userName}
                      </TableCell>
                      <TableCell className="tabular-nums">{participant.sessionCount}</TableCell>
                      <TableCell className="tabular-nums">{participant.gradedSessionCount}</TableCell>
                      <TableCell className="tabular-nums">
                        {formatScore(participant.bestScore)}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {formatScore(participant.averageScore)}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {formatInteger(participant.totalCorrect)}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {formatInteger(participant.totalWrong)}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {formatInteger(participant.totalUnanswered)}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {formatDuration(Math.round(participant.averageDurationSeconds))}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="soft"
                          className={cn(
                            "capitalize",
                            getStatusBadgeClass(participant.latestStatus),
                          )}
                        >
                          {sessionStatusLabels[participant.latestStatus]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="rounded-full"
                              aria-label={`Open attempts for ${participant.userName}`}
                            >
                              <EllipsisVerticalIcon />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={() =>
                                setDetailState({
                                  open: true,
                                  participant,
                                })
                              }
                            >
                              View attempts
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyState title="No Participant Sessions Yet" className="py-12" />
          )}
        </CardContent>
      </Card>

      <ParticipantDetailDialog
        open={detailState.open}
        participant={detailState.participant}
        onOpenChange={(open) => {
          if (!open) {
            setDetailState({ open: false, participant: null })
          }
        }}
      />
    </div>
  )
}

function ParticipantDetailDialog({
  open,
  participant,
  onOpenChange,
}: {
  open: boolean
  participant: PracticeInsightParticipantRow | null
  onOpenChange: (open: boolean) => void
}) {
  if (!participant) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Attempt Breakdown</DialogTitle>
            <DialogDescription>Participant session history.</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Attempt Breakdown - {participant.userName}</DialogTitle>
          <DialogDescription>
            This view groups all sessions for the same participant and lists each attempt in
            chronological order.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryStat label="Sessions" value={formatInteger(participant.sessionCount)} />
          <SummaryStat label="Graded" value={formatInteger(participant.gradedSessionCount)} />
          <SummaryStat label="Best Score" value={formatScore(participant.bestScore)} />
          <SummaryStat label="Average Score" value={formatScore(participant.averageScore)} />
        </div>

        <div className="overflow-x-auto rounded-xl border border-border/60">
          <Table className="min-w-[920px]">
            <TableHeader>
              <TableRow className="bg-muted/35">
                <TableHead className="w-20 text-[11px] font-semibold uppercase tracking-[0.16em]">
                  Attempt
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em]">
                  Status
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em]">
                  Score
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em]">
                  Correct
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em]">
                  Wrong
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em]">
                  Blank
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em]">
                  Duration
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em]">
                  Started
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em]">
                  Submitted
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em]">
                  Graded
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {participant.attempts.map((attempt) => (
                <TableRow key={attempt.sessionId}>
                  <TableCell className="font-medium tabular-nums">
                    #{attempt.attemptNumber}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="soft"
                      className={cn("capitalize", getStatusBadgeClass(attempt.status))}
                    >
                      {sessionStatusLabels[attempt.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="tabular-nums">{formatScore(attempt.totalScore)}</TableCell>
                  <TableCell className="tabular-nums">
                    {formatInteger(attempt.totalCorrect)}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {formatInteger(attempt.totalWrong)}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {formatInteger(attempt.totalUnanswered)}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {formatDuration(attempt.durationSeconds)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDateTime(attempt.startedAt)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDateTime(attempt.submittedAt)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDateTime(attempt.gradedAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  )
}

function InsightMetricCard({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: string
  description: string
}) {
  return (
    <Card className="border border-border/70 bg-card/95 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <CardDescription className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            {label}
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tracking-tight text-foreground">
            {value}
          </CardTitle>
        </div>
        <div className="rounded-2xl border border-primary/15 bg-primary/10 p-2.5 text-primary">
          <Icon className="size-4" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

function getStatusBadgeClass(status: PracticeSessionInsightStatus) {
  switch (status) {
    case "pending":
      return "border-border/60 bg-muted/25 text-muted-foreground"
    case "in_progress":
      return "border-primary/20 bg-primary/10 text-primary"
    case "submitted":
      return "border-chart-2/20 bg-chart-2/10 text-chart-2"
    case "grading":
      return "border-chart-3/20 bg-chart-3/10 text-chart-3"
    case "graded":
      return "border-chart-4/20 bg-chart-4/10 text-chart-4"
    case "cancelled":
      return "border-destructive/20 bg-destructive/10 text-destructive"
    default:
      return "border-border/60 bg-muted/25 text-muted-foreground"
  }
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "-"
  }

  return formatAdminEnglishDateTime(value)
}
