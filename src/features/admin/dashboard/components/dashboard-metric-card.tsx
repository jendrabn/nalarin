import type { ComponentType } from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

type AccentTone = "blue" | "cyan" | "indigo" | "amber" | "emerald" | "violet" | "sky" | "teal"

const ACCENT_STYLES: Record<
  AccentTone,
  {
    strip: string
    icon: string
    glow: string
  }
> = {
  blue: {
    strip: "from-sky-500 via-blue-500 to-indigo-500",
    icon: "border-primary/15 bg-primary/10 text-primary",
    glow: "hover:border-primary/30",
  },
  cyan: {
    strip: "from-cyan-500 via-sky-500 to-blue-500",
    icon: "border-cyan-500/15 bg-cyan-500/10 text-cyan-600 dark:text-cyan-300",
    glow: "hover:border-cyan-500/30",
  },
  indigo: {
    strip: "from-indigo-500 via-blue-500 to-sky-500",
    icon: "border-indigo-500/15 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300",
    glow: "hover:border-indigo-500/30",
  },
  amber: {
    strip: "from-amber-500 via-orange-500 to-rose-500",
    icon: "border-amber-500/15 bg-amber-500/10 text-amber-600 dark:text-amber-300",
    glow: "hover:border-amber-500/30",
  },
  emerald: {
    strip: "from-emerald-500 via-cyan-500 to-sky-500",
    icon: "border-emerald-500/15 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    glow: "hover:border-emerald-500/30",
  },
  violet: {
    strip: "from-violet-500 via-indigo-500 to-sky-500",
    icon: "border-violet-500/15 bg-violet-500/10 text-violet-600 dark:text-violet-300",
    glow: "hover:border-violet-500/30",
  },
  sky: {
    strip: "from-sky-500 via-cyan-500 to-sky-400",
    icon: "border-sky-500/15 bg-sky-500/10 text-sky-600 dark:text-sky-300",
    glow: "hover:border-sky-500/30",
  },
  teal: {
    strip: "from-teal-500 via-cyan-500 to-sky-500",
    icon: "border-teal-500/15 bg-teal-500/10 text-teal-600 dark:text-teal-300",
    glow: "hover:border-teal-500/30",
  },
}

type DetailItem = {
  label: string
  value: string
}

type DashboardMetricCardProps = {
  title: string
  description: string
  value: string
  icon: ComponentType<{ className?: string }>
  accent: AccentTone
  detailItems?: DetailItem[]
  secondaryMetric?: DetailItem
  progress?: {
    label: string
    value: number
    suffix?: string
    helperText?: string
  }
}

export function DashboardMetricCard({
  title,
  description,
  value,
  icon: Icon,
  accent,
  detailItems,
  secondaryMetric,
  progress,
}: DashboardMetricCardProps) {
  const tone = ACCENT_STYLES[accent]
  const hasDetails = Boolean(secondaryMetric || detailItems?.length || progress)

  const card = (
    <Card
      className={cn(
        "relative overflow-hidden border border-border/70 bg-card/95 shadow-sm transition-all duration-200 hover:shadow-md",
        tone.glow,
      )}
    >
      <div className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", tone.strip)} />
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="min-w-0">
          <CardDescription className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            {title}
          </CardDescription>
          <CardTitle className="mt-2 text-2xl font-semibold tracking-tight text-foreground lg:text-3xl">
            {value}
          </CardTitle>
        </div>
        {hasDetails ? (
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={`View breakdown for ${title}`}
              className={cn(
                "rounded-2xl border p-2.5 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring/50",
                tone.icon,
              )}
            >
              <Icon className="size-4" />
            </button>
          </PopoverTrigger>
        ) : (
          <div className={cn("rounded-2xl border p-2.5 shadow-sm", tone.icon)}>
            <Icon className="size-4" />
          </div>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-2.5 pt-0">
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )

  if (!hasDetails) {
    return card
  }

  return (
    <Popover>
      {card}
      <PopoverContent align="start" className="w-72 p-2.5">
        <MetricDetailsContent
          secondaryMetric={secondaryMetric}
          detailItems={detailItems}
          progress={progress}
        />
      </PopoverContent>
    </Popover>
  )
}

function MetricDetailsContent({
  secondaryMetric,
  detailItems,
  progress,
}: {
  secondaryMetric?: DetailItem
  detailItems?: DetailItem[]
  progress?: {
    label: string
    value: number
    suffix?: string
    helperText?: string
  }
}) {
  const items = [
    ...(secondaryMetric ? [secondaryMetric] : []),
    ...(detailItems ?? []),
  ]

  return (
    <div className="flex flex-col gap-2.5">
      {items.length ? (
        <div className="overflow-hidden rounded-xl border border-border/60">
          {items.map((item, index) => (
            <div
              key={item.label}
              className={cn(
                "flex items-center justify-between gap-2 px-2.5 py-2",
                index > 0 && "border-t border-border/60",
              )}
            >
              <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                {item.label}
              </span>
              <span className="text-xs font-semibold tabular-nums text-foreground">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      {progress ? (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              {progress.label}
            </span>
            <span className="text-xs font-semibold tabular-nums text-foreground">
              {progress.value.toFixed(1)}
              {progress.suffix ?? "%"}
            </span>
          </div>
          <Progress value={Math.min(Math.max(progress.value, 0), 100)} />
          {progress.helperText ? (
            <p className="text-xs text-muted-foreground">{progress.helperText}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
