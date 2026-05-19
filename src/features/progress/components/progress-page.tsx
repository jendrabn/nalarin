import Link from "next/link"
import {
  ArrowRightIcon,
  BarChart3Icon,
  BookOpenIcon,
  CheckCircle2Icon,
  CircleSlashIcon,
  FileTextIcon,
  TargetIcon,
  TrophyIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  XCircleIcon,
} from "lucide-react"
import type { ReactNode } from "react"

import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

import type {
  ProgressActivityItem,
  ProgressExamType,
  ProgressPageData,
  ProgressSummary,
  ProgressTopicSnapshot,
} from "../types"

export function ProgressPage({ data }: { data: ProgressPageData }) {
  const activeExamTypeLabel = data.activeExamType?.name ?? "Semua Jenis Ujian"
  const strongestTopics = data.summary.strongestTopics.slice(0, 5)
  const weakestTopics = data.summary.weakestTopics.slice(0, 5)
  const hasTopicCards = strongestTopics.length > 0 || weakestTopics.length > 0

  return (
    <div className="min-h-svh bg-muted/35 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <PageHeader
          className="mb-0"
          title="Progress Belajar"
          subtitle={`Pantau performa latihan dan tryout all-time${data.activeExamType ? ` untuk ${activeExamTypeLabel}` : ""}.`}
        />

        <FilterPanel
          examTypes={data.examTypes}
          activeExamType={data.activeExamType}
        />

        <section className="flex flex-col gap-3">
          <SummaryGrid summary={data.summary} />
        </section>

        {hasTopicCards ? (
          <section
            className={cn(
              "grid gap-5",
              strongestTopics.length > 0 && weakestTopics.length > 0
                ? "xl:grid-cols-2"
                : "xl:grid-cols-1",
            )}
          >
            {strongestTopics.length > 0 ? (
              <TopicCard
                title="Topik Terkuat"
                icon={<TrendingUpIcon />}
                topics={strongestTopics}
                tone="strong"
              />
            ) : null}
            {weakestTopics.length > 0 ? (
              <TopicCard
                title="Topik Prioritas"
                icon={<TrendingDownIcon />}
                topics={weakestTopics}
                tone="weak"
              />
            ) : null}
          </section>
        ) : (
          <Empty className="border bg-card py-10 shadow-sm">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <CircleSlashIcon />
              </EmptyMedia>
              <EmptyTitle>Belum Ada Data Topik</EmptyTitle>
              <EmptyDescription>
                Topik akan muncul setelah ada sesi graded dengan jawaban terisi.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}

        <ActivityCard activities={data.activities} />
      </div>
    </div>
  )
}

function FilterPanel({
  examTypes,
  activeExamType,
}: {
  examTypes: ProgressExamType[]
  activeExamType: ProgressExamType | null
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <FilterButton href="/progress" active={!activeExamType} label="Semua" />
      {examTypes.map((examType) => (
        <FilterButton
          key={examType.id}
          href={buildProgressHref(examType.slug)}
          active={activeExamType?.id === examType.id}
          label={examType.name}
        />
      ))}
    </div>
  )
}

function FilterButton({
  href,
  active,
  label,
}: {
  href: string
  active: boolean
  label: string
}) {
  return (
    <Button
      asChild
      variant={active ? "default" : "outline"}
      size="xl"
      className={cn(
        "max-w-full justify-start rounded-full text-[0.9rem] font-medium tracking-normal shadow-sm",
        !active && "text-muted-foreground hover:border-primary/30 hover:text-foreground",
      )}
    >
      <Link href={href}>
        <BookOpenIcon data-icon="inline-start" />
        <span className="truncate">{label}</span>
      </Link>
    </Button>
  )
}

function SummaryGrid({ summary }: { summary: ProgressSummary }) {
  const accuracy = summary.accuracy ?? 0
  const averageScore = summary.averageScore ?? 0

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <SummaryCard
        icon={<TargetIcon />}
        label="Soal Dijawab"
        value={summary.totalQuestionsAnswered}
        helper={`${summary.totalCorrect} benar / ${summary.totalWrong} salah`}
        tone="primary"
      />
      <SummaryCard
        icon={<CheckCircle2Icon />}
        label="Akurasi"
        value={summary.accuracy === null ? "-" : `${accuracy}%`}
        helper="Persentase jawaban benar"
        progress={summary.accuracy === null ? undefined : accuracy}
        tone="success"
      />
      <SummaryCard
        icon={<BarChart3Icon />}
        label="Rata-Rata Skor"
        value={summary.averageScore === null ? "-" : `${formatNumber(averageScore)}%`}
        helper="Skor ternormalisasi 0-100"
        progress={summary.averageScore === null ? undefined : averageScore}
        tone="score"
      />
    </section>
  )
}

function SummaryCard({
  icon,
  label,
  value,
  helper,
  progress,
  tone,
}: {
  icon: ReactNode
  label: string
  value: ReactNode
  helper: string
  progress?: number
  tone: "primary" | "success" | "score"
}) {
  const toneClass = summaryToneClasses[tone]

  return (
    <Card className={cn("shadow-sm", toneClass.card)}>
      <CardContent className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className={cn("mt-2 text-2xl font-semibold tabular-nums", toneClass.value)}>
              {value}
            </p>
          </div>
          <span
            className={cn(
              "grid size-9 shrink-0 place-items-center rounded-lg [&_svg]:size-4",
              toneClass.icon,
            )}
          >
            {icon}
          </span>
        </div>
        {progress !== undefined ? <Progress value={progress} className="h-2" /> : null}
        <p className="text-sm leading-6 text-muted-foreground">{helper}</p>
      </CardContent>
    </Card>
  )
}

function TopicCard({
  title,
  icon,
  topics,
  tone,
}: {
  title: string
  icon: ReactNode
  topics: ProgressTopicSnapshot[]
  tone: "strong" | "weak"
}) {
  const toneClass = topicToneClasses[tone]

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{title}</CardTitle>
          </div>
          <span
            className={cn(
              "grid size-9 shrink-0 place-items-center rounded-lg [&_svg]:size-4",
              toneClass.icon,
            )}
          >
            {icon}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          {topics.map((topic) => (
            <div key={topic.topic_id} className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate font-medium text-foreground">
                  {topic.topic_name}
                </span>
                <span className={cn("font-semibold tabular-nums", toneClass.value)}>
                  {topic.accuracy}%
                </span>
              </div>
              <Progress value={topic.accuracy} className="h-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function ActivityCard({ activities }: { activities: ProgressActivityItem[] }) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Riwayat Aktivitas</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length > 0 ? (
          <div className="flex flex-col gap-3">
            {activities.map((activity) => (
              <ActivityRow key={`${activity.type}-${activity.id}`} activity={activity} />
            ))}
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
    <article className="rounded-xl border bg-background p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary [&_svg]:size-4">
            {activity.type === "practice" ? <BookOpenIcon /> : <TrophyIcon />}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={activity.type === "practice" ? "secondary" : "outline"}>
                {activityLabel}
              </Badge>
              <Badge variant="outline">{activity.examTypeName}</Badge>
            </div>
            <h2 className="mt-2 line-clamp-2 text-base font-semibold leading-snug text-foreground">
              {activity.title}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {activity.completedAt ? formatDate(activity.completedAt) : "Tanggal tidak tersedia"}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:min-w-80">
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
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
            <Button asChild variant="outline-primary" className="w-full">
              <Link href={activity.reviewHref}>
                Review
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
            </Button>
          ) : (
            <Button disabled variant="outline" className="w-full">
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
    <div className="rounded-lg bg-muted/45 p-2">
      <p className={cn("flex items-center justify-center gap-1 font-semibold tabular-nums", className)}>
        <span className="[&_svg]:size-3.5">{icon}</span>
        {value}
      </p>
      <p className="mt-1 text-muted-foreground">{label}</p>
    </div>
  )
}

const summaryToneClasses = {
  primary: {
    card: "border-primary/20 bg-primary/5",
    icon: "bg-primary/10 text-primary",
    value: "text-primary",
  },
  success: {
    card: "border-chart-2/20 bg-chart-2/5",
    icon: "bg-chart-2/10 text-chart-2",
    value: "text-chart-2",
  },
  score: {
    card: "border-chart-3/20 bg-chart-3/5",
    icon: "bg-chart-3/10 text-chart-3",
    value: "text-chart-3",
  },
}

const topicToneClasses = {
  strong: {
    icon: "bg-chart-2/10 text-chart-2",
    value: "text-chart-2",
  },
  weak: {
    icon: "bg-destructive/10 text-destructive",
    value: "text-destructive",
  },
}

function buildProgressHref(examTypeSlug: string) {
  return `/progress/${examTypeSlug}`
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
