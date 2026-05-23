"use client"

import Link from "next/link"
import { ArrowRightIcon, CheckCircle2Icon, FileTextIcon, TargetIcon, XCircleIcon } from "lucide-react"
import { useState } from "react"
import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { cn } from "@/lib/utils"

import type { ProgressActivityItem } from "../types"

const INITIAL_VISIBLE_COUNT = 5
const LOAD_MORE_STEP = 5

export function ActivityCard({ activities }: { activities: ProgressActivityItem[] }) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT)

  const visibleActivities = activities.slice(0, visibleCount)

  const hasMore = visibleCount < activities.length

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Riwayat Aktivitas</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {activities.length > 0 ? (
          <div className="flex flex-col gap-2">
            {visibleActivities.map((activity) => (
              <ActivityRow key={`${activity.type}-${activity.id}`} activity={activity} />
            ))}

            {hasMore ? (
              <div className="pt-1">
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="w-full justify-center px-0 text-sm font-medium text-primary/80 hover:text-primary"
                  onClick={() =>
                    setVisibleCount((current) => Math.min(current + LOAD_MORE_STEP, activities.length))
                  }
                >
                  Load More
                </Button>
              </div>
            ) : null}
          </div>
        ) : (
          <Empty className="border bg-muted/20 py-10">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileTextIcon />
              </EmptyMedia>
              <EmptyTitle>Belum Ada Aktivitas</EmptyTitle>
              <EmptyDescription>
                Aktivitas akan muncul setelah kamu menyelesaikan latihan atau tryout.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </CardContent>
    </Card>
  )
}

function ActivityRow({ activity }: { activity: ProgressActivityItem }) {
  const activityLabel = getActivityTypeLabel(activity)

  return (
    <article className="rounded-lg border bg-background/80 p-3 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 lg:flex lg:flex-col lg:justify-center">
          <h2 className="mt-2 line-clamp-2 text-sm font-semibold leading-snug text-foreground sm:text-[0.95rem]">
            {activity.title}
          </h2>
          <div className="mt-1 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
            <span>{activity.completedAt ? formatDate(activity.completedAt) : "Tanggal tidak tersedia"}</span>
            <span aria-hidden="true">•</span>
            <span>{activityLabel}</span>
            <span aria-hidden="true">•</span>
            <span className="truncate">{activity.examTypeName}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 lg:min-w-72">
          <div className="grid grid-cols-3 gap-2 text-center text-[11px] sm:text-xs">
            <ActivityMetric
              icon={<CheckCircle2Icon />}
              label="Benar"
              value={activity.correct}
              className="text-chart-2"
            />
            <ActivityMetric
              icon={<XCircleIcon />}
              label="Salah"
              value={activity.wrong}
              className="text-destructive"
            />
            <ActivityMetric
              icon={<TargetIcon />}
              label="Skor"
              value={`${formatNumber(activity.score)} / ${formatNumber(activity.maxScore)}`}
              className="text-primary"
            />
          </div>
          {activity.reviewHref ? (
            <Button asChild variant="outline-primary" size="sm" className="w-full">
              <Link href={activity.reviewHref}>
                Review
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
            </Button>
          ) : (
            <Button disabled variant="outline" size="sm" className="w-full">
              Review Belum Tersedia
            </Button>
          )}
        </div>
      </div>
    </article>
  )
}

function ActivityMetric({
  icon,
  label,
  value,
  className,
}: {
  icon: ReactNode
  label: string
  value: ReactNode
  className?: string
}) {
  return (
    <div className="rounded-md bg-muted/35 px-2 py-1.5">
      <p className={cn("flex items-center justify-center gap-1 font-semibold tabular-nums", className)}>
        <span className="[&_svg]:size-3.5">{icon}</span>
        {value}
      </p>
      <p className="mt-0.5 text-[10px] text-muted-foreground sm:text-[11px]">{label}</p>
    </div>
  )
}

function getActivityTypeLabel(activity: ProgressActivityItem) {
  if (activity.type === "tryout") {
    return "Tryout"
  }

  return activity.practiceMode === "quiz" ? "Quiz" : "Latihan"
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 1,
  }).format(value)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
  }).format(new Date(value))
}
