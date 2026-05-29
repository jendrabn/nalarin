import Link from "next/link"
import {
  BarChart3Icon,
  BookOpenIcon,
  CheckCircle2Icon,
  CircleSlashIcon,
  TargetIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from "lucide-react"
import type { ReactNode } from "react"

import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

import { ActivityCard } from "./progress-activity-card"

import type {
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
          subtitle={`Pantau performa latihan dan tryout${data.activeExamType ? ` untuk ${activeExamTypeLabel}` : ""} untuk melihat topik kuat, topik prioritas, dan riwayat aktivitas.`}
        />

        <FilterPanel
          examTypes={data.examTypes}
          activeExamType={data.activeExamType}
        />

        <section className="flex flex-col gap-2">
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
      <CardContent className="flex flex-col gap-3 p-3.5 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <p className={cn("mt-1.5 text-xl font-semibold tabular-nums sm:text-2xl", toneClass.value)}>
              {value}
            </p>
          </div>
          <span
            className={cn(
              "grid size-8 shrink-0 place-items-center rounded-lg [&_svg]:size-3.5",
              toneClass.icon,
            )}
          >
            {icon}
          </span>
        </div>
        {progress !== undefined ? <Progress value={progress} className="h-1.5" /> : null}
        <p className="text-xs leading-5 text-muted-foreground sm:text-sm">{helper}</p>
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

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 1,
  }).format(value)
}
