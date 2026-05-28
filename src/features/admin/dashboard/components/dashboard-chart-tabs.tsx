"use client"

import type { ReactNode } from "react"

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"
import { BarChart3Icon } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { AdminDashboardData } from "../queries"
import { formatCurrency, formatPercent } from "../utils/format"

type DashboardChartsSectionProps = {
  charts: AdminDashboardData["charts"]
}

const practiceActivityConfig = {
  practice: {
    label: "Practice sessions",
    color: "var(--chart-1)",
  },
  quiz: {
    label: "Quiz sessions",
    color: "var(--chart-2)",
  },
} as const

const tryoutParticipationConfig = {
  inProgress: {
    label: "In progress",
    color: "var(--chart-1)",
  },
  submitted: {
    label: "Submitted",
    color: "var(--chart-2)",
  },
  graded: {
    label: "Graded",
    color: "var(--chart-3)",
  },
  cancelled: {
    label: "Cancelled",
    color: "var(--chart-4)",
  },
} as const

const revenueConfig = {
  midtrans: {
    label: "Midtrans",
    color: "var(--chart-1)",
  },
  manual: {
    label: "Manual",
    color: "var(--chart-2)",
  },
} as const

const subscriptionMixConfig = {
  subscriptions: {
    label: "Subscriptions",
    color: "var(--chart-1)",
  },
} as const

const subscriptionMixColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
] as const

function getSubscriptionMixColor(index: number) {
  return subscriptionMixColors[index % subscriptionMixColors.length]
}

const questionGrowthConfig = {
  draft: {
    label: "Draft",
    color: "var(--chart-5)",
  },
  published: {
    label: "Published",
    color: "var(--chart-1)",
  },
  archived: {
    label: "Archived",
    color: "var(--chart-4)",
  },
} as const

const completionConfig = {
  completionRate: {
    label: "Completion rate",
    color: "var(--chart-2)",
  },
} as const

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)
}

function formatSeriesLabel(name: unknown) {
  const raw = String(name ?? "")

  return raw ? raw[0].toUpperCase() + raw.slice(1) : raw
}

function trimEdgeZeros<T extends Record<string, number | string>>(
  rows: T[],
  keys: Array<keyof T>,
) {
  let start = 0
  let end = rows.length - 1

  const hasValue = (row: T) =>
    keys.some((key) => {
      const value = row[key]
      return typeof value === "number" && value > 0
    })

  while (start <= end && !hasValue(rows[start]!)) {
    start += 1
  }

  while (end >= start && !hasValue(rows[end]!)) {
    end -= 1
  }

  if (start > end) {
    return rows
  }

  return rows.slice(start, end + 1)
}

export function DashboardChartsSection({ charts }: DashboardChartsSectionProps) {
  const practiceActivityData = trimEdgeZeros(charts.practiceActivity, ["practice", "quiz"])
  const tryoutParticipationData = trimEdgeZeros(charts.tryoutParticipation, [
    "inProgress",
    "submitted",
    "graded",
    "cancelled",
  ])
  const revenueData = trimEdgeZeros(charts.revenue, ["midtrans", "manual"])
  const questionGrowthData = trimEdgeZeros(charts.questionGrowth, ["draft", "published", "archived"])
  const completionRateData = trimEdgeZeros(charts.completionRate, ["completionRate"])

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Operational trends</h2>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          A quick read on learning activity, payment movement, subscription mix, content output,
          and completion quality.
        </p>
      </div>

      <div className="grid items-stretch gap-4 xl:grid-cols-3">
        <ChartPanel
          title="Learning activity"
          description="Monthly practice and quiz volume across the platform."
          hasData={practiceActivityData.some((item) => item.practice > 0 || item.quiz > 0)}
        >
          <ChartContainer config={practiceActivityConfig} className="aspect-auto h-[220px] w-full">
            <BarChart
              data={practiceActivityData}
              margin={{ top: 4, right: 12, left: 12, bottom: 0 }}
              barCategoryGap="22%"
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="period" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} tickMargin={12} allowDecimals={false} width={36} />
              <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
              <Bar dataKey="practice" fill="var(--color-practice)" radius={[8, 8, 0, 0]} />
              <Bar dataKey="quiz" fill="var(--color-quiz)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ChartContainer>
          <ChartLegend
            items={[
              { label: "Practice sessions", color: "var(--chart-1)" },
              { label: "Quiz sessions", color: "var(--chart-2)" },
            ]}
          />
        </ChartPanel>

        <ChartPanel
          title="Tryout flow"
          description="How tryout sessions move through each stage month by month."
          hasData={tryoutParticipationData.some((item) =>
            [item.inProgress, item.submitted, item.graded, item.cancelled].some((value) => value > 0),
          )}
        >
          <ChartContainer config={tryoutParticipationConfig} className="aspect-auto h-[220px] w-full">
            <BarChart
              data={tryoutParticipationData}
              margin={{ top: 4, right: 12, left: 12, bottom: 0 }}
              barCategoryGap="22%"
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="period" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} tickMargin={12} allowDecimals={false} width={36} />
              <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
              <Bar dataKey="inProgress" stackId="tryout" fill="var(--color-inProgress)" radius={[8, 8, 0, 0]} />
              <Bar dataKey="submitted" stackId="tryout" fill="var(--color-submitted)" radius={[8, 8, 0, 0]} />
              <Bar dataKey="graded" stackId="tryout" fill="var(--color-graded)" radius={[8, 8, 0, 0]} />
              <Bar dataKey="cancelled" stackId="tryout" fill="var(--color-cancelled)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ChartContainer>
          <ChartLegend
            items={[
              { label: "In progress", color: "var(--chart-1)" },
              { label: "Submitted", color: "var(--chart-2)" },
              { label: "Graded", color: "var(--chart-3)" },
              { label: "Cancelled", color: "var(--chart-4)" },
            ]}
          />
        </ChartPanel>

        <ChartPanel
          title="Revenue mix"
          description="Monthly payments split by Midtrans and manual channels."
          hasData={revenueData.some((item) => item.midtrans > 0 || item.manual > 0)}
        >
          <ChartContainer config={revenueConfig} className="aspect-auto h-[220px] w-full">
            <AreaChart data={revenueData} margin={{ top: 4, right: 12, left: 12, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="period" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={12}
                width={44}
                tickFormatter={(value) => formatCompactNumber(Number(value))}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    indicator="line"
                    formatter={(value, name) => `${formatSeriesLabel(name)}: ${formatCurrency(Number(value))}`}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="midtrans"
                stackId="revenue"
                stroke="var(--color-midtrans)"
                fill="var(--color-midtrans)"
                fillOpacity={0.18}
              />
              <Area
                type="monotone"
                dataKey="manual"
                stackId="revenue"
                stroke="var(--color-manual)"
                fill="var(--color-manual)"
                fillOpacity={0.18}
              />
            </AreaChart>
          </ChartContainer>
          <ChartLegend
            items={[
              { label: "Midtrans", color: "var(--chart-1)" },
              { label: "Manual", color: "var(--chart-2)" },
            ]}
          />
        </ChartPanel>

        <ChartPanel
          title="Package mix"
          description="Active subscriptions grouped by exam type."
          hasData={charts.subscriptionMix.some((item) => item.value > 0)}
        >
          <ChartContainer config={subscriptionMixConfig} className="mx-auto aspect-auto h-[220px] w-full max-w-[320px]">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Pie
                data={charts.subscriptionMix}
                dataKey="value"
                nameKey="label"
                innerRadius={72}
                outerRadius={106}
                paddingAngle={3}
                strokeWidth={3}
              >
                {charts.subscriptionMix.map((item, index) => (
                  <Cell key={item.key} fill={getSubscriptionMixColor(index)} />
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
                    const total = charts.subscriptionMix.reduce((sum, item) => sum + item.value, 0)

                    return (
                      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan x={cx} y={cy - 6} className="fill-foreground text-xl font-semibold">
                          {total}
                        </tspan>
                        <tspan
                          x={cx}
                          y={cy + 16}
                          className="fill-muted-foreground text-[10px] uppercase tracking-[0.16em]"
                        >
                          active packages
                        </tspan>
                      </text>
                    )
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
          <ChartLegend
            items={charts.subscriptionMix.map((item, index) => ({
              label: item.label,
              color: getSubscriptionMixColor(index),
            }))}
          />
        </ChartPanel>

        <ChartPanel
          title="Question growth"
          description="How the question bank is growing by publication status."
          hasData={questionGrowthData.some((item) =>
            [item.draft, item.published, item.archived].some((value) => value > 0),
          )}
        >
          <ChartContainer config={questionGrowthConfig} className="aspect-auto h-[220px] w-full">
            <BarChart
              data={questionGrowthData}
              margin={{ top: 4, right: 12, left: 12, bottom: 0 }}
              barCategoryGap="22%"
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="period" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} tickMargin={12} allowDecimals={false} width={36} />
              <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
              <Bar dataKey="draft" stackId="questions" fill="var(--color-draft)" radius={[8, 8, 0, 0]} />
              <Bar dataKey="published" stackId="questions" fill="var(--color-published)" radius={[8, 8, 0, 0]} />
              <Bar dataKey="archived" stackId="questions" fill="var(--color-archived)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ChartContainer>
          <ChartLegend
            items={[
              { label: "Draft", color: "var(--chart-5)" },
              { label: "Published", color: "var(--chart-1)" },
              { label: "Archived", color: "var(--chart-4)" },
            ]}
          />
        </ChartPanel>

        <ChartPanel
          title="Completion trend"
          description="The share of sessions that reach grading over time."
          hasData={completionRateData.some((item) => item.completionRate > 0)}
        >
          <ChartContainer config={completionConfig} className="aspect-auto h-[220px] w-full">
            <LineChart data={completionRateData} margin={{ top: 4, right: 12, left: 12, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="period" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={12}
                domain={[0, 100]}
                width={44}
                tickFormatter={(value) => `${value}%`}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    indicator="line"
                    formatter={(value) => `Completion rate: ${formatPercent(Number(value))}`}
                  />
                }
              />
              <Line
                type="monotone"
                dataKey="completionRate"
                stroke="var(--color-completionRate)"
                strokeWidth={3}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        </ChartPanel>
      </div>
    </section>
  )
}

function ChartPanel({
  title,
  description,
  hasData,
  children,
}: {
  title: string
  description: string
  hasData: boolean
  children: ReactNode
}) {
  return (
    <Card className="flex h-full flex-col border border-border/70 bg-card/95 shadow-sm lg:max-h-[420px]">
      <CardHeader className="space-y-1 pb-3">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3 overflow-hidden">
        <div className="flex flex-1 flex-col gap-3">
          {hasData ? (
            children
          ) : (
            <Empty className="flex-1 border border-border/60 bg-muted/20">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <BarChart3Icon />
                </EmptyMedia>
                <EmptyTitle>No data yet</EmptyTitle>
                <EmptyDescription>
                  This chart will populate once the underlying operational data exists.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent />
            </Empty>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function ChartLegend({
  items,
}: {
  items: Array<{ label: string; color: string }>
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs">
      {items.map((item) => (
        <div key={item.label} className="inline-flex items-center gap-2 text-foreground">
          <span
            className="size-3 shrink-0 rounded-[3px] shadow-sm ring-1 ring-black/10 dark:ring-white/10"
            style={{ backgroundColor: item.color }}
          />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  )
}
