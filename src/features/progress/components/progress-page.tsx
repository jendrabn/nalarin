import Link from "next/link"
import {
  ArrowRightIcon,
  BarChart3Icon,
  BookOpenIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  CircleSlashIcon,
  FlameIcon,
  FileTextIcon,
  TargetIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  TrophyIcon,
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
  ProgressPeriod,
  ProgressSubject,
  ProgressSummary,
  ProgressStreak,
  ProgressStreakDay,
  ProgressTopicSnapshot,
} from "../types"
import { PROGRESS_PERIOD_OPTIONS } from "../utils/period"

export function ProgressPage({ data }: { data: ProgressPageData }) {
  const scopeTitle = getScopeTitle(data.activeExamType, data.activeSubject)
  const basePath = getProgressBasePath(data.activeExamType, data.activeSubject)

  return (
    <div className="min-h-svh bg-muted/35 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <PageHeader
          className="mb-0"
          title="Progress Belajar"
          subtitle={`Pantau performa latihan dan tryout${scopeTitle ? ` untuk ${scopeTitle}` : ""}.`}
        />

        <section className="flex flex-col gap-5">
          <FilterPanel
            examTypes={data.examTypes}
            subjects={data.subjects}
            activeExamType={data.activeExamType}
            activeSubject={data.activeSubject}
            activePeriod={data.activePeriod}
            basePath={basePath}
          />

          <div className="flex min-w-0 flex-col gap-5">
            <SummaryGrid summary={data.summary} />
            <DailyStreakCard streak={data.streak} />

            <section className="grid gap-5 xl:grid-cols-2">
              <TopicCard
                title="Topik Terkuat"
                description="Akurasi tertinggi dari snapshot progress terakhir."
                icon={<TrendingUpIcon />}
                topics={data.summary.strongestTopics}
                tone="strong"
              />
              <TopicCard
                title="Topik Prioritas"
                description="Area dengan akurasi terendah untuk diprioritaskan."
                icon={<TrendingDownIcon />}
                topics={data.summary.weakestTopics}
                tone="weak"
              />
            </section>

            <ActivityCard
              activities={data.activities}
            />
          </div>
        </section>
      </div>
    </div>
  )
}

function FilterPanel({
  examTypes,
  subjects,
  activeExamType,
  activeSubject,
  activePeriod,
  basePath,
}: {
  examTypes: ProgressExamType[]
  subjects: ProgressSubject[]
  activeExamType: ProgressExamType | null
  activeSubject: ProgressSubject | null
  activePeriod: ProgressPeriod
  basePath: string
}) {
  return (
    <Card className="border-border/70 bg-card/80 shadow-sm backdrop-blur">
      <CardHeader className="gap-2">
        <CardTitle className="text-base">Filter Progress</CardTitle>
        <p className="text-sm leading-6 text-muted-foreground">
          Pilih jenis ujian, subtes, dan periode yang ingin dilihat.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <FilterGroup title="Jenis Ujian">
          <div className="flex flex-wrap gap-2">
            <FilterButton
              href={withPeriod("/progress", activePeriod)}
              active={!activeExamType}
              label="Semua"
            />
            {examTypes.map((examType) => (
              <FilterButton
                key={examType.id}
                href={withPeriod(`/progress/${examType.slug}`, activePeriod)}
                active={activeExamType?.id === examType.id && !activeSubject}
                label={examType.name}
              />
            ))}
          </div>
        </FilterGroup>

        {activeExamType ? (
          <FilterGroup title="Subtes">
            <div className="flex flex-wrap gap-2">
              <FilterButton
                href={withPeriod(`/progress/${activeExamType.slug}`, activePeriod)}
                active={!activeSubject}
                label="Semua Subtes"
              />
              {subjects.map((subject) => (
                <FilterButton
                  key={subject.id}
                  href={withPeriod(
                    `/progress/${activeExamType.slug}/${subject.slug}`,
                    activePeriod,
                  )}
                  active={activeSubject?.id === subject.id}
                  label={subject.name}
                />
              ))}
            </div>
          </FilterGroup>
        ) : null}

        <FilterGroup title="Periode">
          <div className="flex flex-wrap gap-2">
            {PROGRESS_PERIOD_OPTIONS.map((period) => {
              const active = activePeriod === period.value

              return (
                <Button
                  key={period.value}
                  asChild
                  variant={active ? "default" : "outline"}
                  size="xl"
                  className={cn(
                    "rounded-full text-[0.9rem] font-medium tracking-normal shadow-sm",
                    !active && "text-muted-foreground hover:border-primary/30 hover:text-foreground",
                  )}
                >
                  <Link href={withPeriod(basePath, period.value)}>{period.label}</Link>
                </Button>
              )
            })}
          </div>
        </FilterGroup>
      </CardContent>
    </Card>
  )
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      <div>{children}</div>
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
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <SummaryCard
        icon={<TargetIcon />}
        label="Soal Dijawab"
        value={summary.totalQuestionsAnswered}
        helper={`${summary.totalCorrect} Benar / ${summary.totalWrong} Salah`}
        tone="primary"
      />
      <SummaryCard
        icon={<CheckCircle2Icon />}
        label="Akurasi"
        value={summary.accuracy === null ? "-" : `${accuracy}%`}
        helper="Benar dibanding soal terjawab"
        progress={accuracy}
        tone="success"
      />
      <SummaryCard
        icon={<BarChart3Icon />}
        label="Rata-Rata Skor"
        value={summary.averageScore === null ? "-" : `${formatNumber(averageScore)}%`}
        helper="Skor ternormalisasi 0-100"
        progress={averageScore}
        tone="score"
      />
      <SummaryCard
        icon={<CalendarDaysIcon />}
        label="Update Terakhir"
        value={summary.snapshotDate ? formatDate(summary.snapshotDate) : "-"}
        helper="Berdasarkan sesi graded"
        tone="neutral"
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
  tone: "primary" | "success" | "score" | "neutral"
}) {
  const toneClass = summaryToneClasses[tone]

  return (
    <Card className={cn("shadow-sm", toneClass.card)}>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className={cn("mt-2 text-2xl font-semibold tabular-nums", toneClass.value)}>
              {value}
            </p>
          </div>
          <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg [&_svg]:size-4", toneClass.icon)}>
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
  description,
  icon,
  topics,
  tone,
}: {
  title: string
  description: string
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
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
          <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg [&_svg]:size-4", toneClass.icon)}>
            {icon}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {topics.length > 0 ? (
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
        ) : (
          <Empty className="border bg-muted/20 py-8">
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
      </CardContent>
    </Card>
  )
}

function DailyStreakCard({ streak }: { streak: ProgressStreak }) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle>Streak Harianku</CardTitle>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Aktivitas harian dari latihan dan tryout selama 12 minggu terakhir.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <StreakMetric label="Streak" value={`${streak.currentStreak} Hari`} />
            <StreakMetric label="Terpanjang" value={`${streak.longestStreak} Hari`} />
            <StreakMetric label="Hari Aktif" value={streak.activeDays} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="overflow-x-auto pb-1">
          <div className="grid w-max grid-flow-col grid-rows-7 gap-1">
            {streak.days.map((day) => (
              <StreakDayCell key={day.date} day={day} />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <FlameIcon className="size-4 text-primary" />
            <span>{streak.totalSessions} sesi selesai dalam periode ini.</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Lebih sedikit</span>
            {[0, 1, 2, 3, 4].map((level) => (
              <span
                key={level}
                className={cn(
                  "size-3 rounded-[3px] ring-1 ring-border/70",
                  streakLevelClasses[level as ProgressStreakDay["level"]],
                )}
              />
            ))}
            <span>Lebih banyak</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function StreakMetric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg bg-muted/45 px-3 py-2">
      <p className="font-semibold tabular-nums text-foreground">{value}</p>
      <p className="mt-0.5 text-muted-foreground">{label}</p>
    </div>
  )
}

function StreakDayCell({ day }: { day: ProgressStreakDay }) {
  return (
    <span
      aria-label={`${formatDate(day.date)}: ${day.count} sesi`}
      title={`${formatDate(day.date)} - ${day.count} sesi`}
      className={cn(
        "size-3 rounded-[3px] ring-1 ring-border/70",
        streakLevelClasses[day.level],
      )}
    />
  )
}

function ActivityCard({
  activities,
}: {
  activities: ProgressActivityItem[]
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle>Riwayat Aktivitas</CardTitle>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Latihan dan tryout yang sudah selesai dinilai.
            </p>
          </div>
        </div>
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
  const scorePercentage =
    activity.maxScore > 0 ? Math.round((activity.score / activity.maxScore) * 100) : 0

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
                {activity.type === "practice" ? "Latihan" : "Tryout"}
              </Badge>
              <Badge variant="outline">{activity.examTypeName}</Badge>
              {activity.subjectName ? <Badge variant="outline">{activity.subjectName}</Badge> : null}
            </div>
            <h2 className="mt-2 line-clamp-2 text-base font-semibold leading-snug text-foreground">
              {activity.title}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {activity.completedAt ? formatDate(activity.completedAt) : "Tanggal tidak tersedia"}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:min-w-72">
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
              value={`${scorePercentage}%`}
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
  neutral: {
    card: "border-border bg-card",
    icon: "bg-muted text-muted-foreground",
    value: "text-foreground",
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

const streakLevelClasses: Record<ProgressStreakDay["level"], string> = {
  0: "bg-muted",
  1: "bg-primary/20",
  2: "bg-primary/40",
  3: "bg-primary/70",
  4: "bg-primary",
}

function withPeriod(path: string, period: ProgressPeriod) {
  const currentPath = path || "#"

  return period === "30d" ? currentPath : `${currentPath}?period=${period}`
}

function getScopeTitle(examType: ProgressExamType | null, subject: ProgressSubject | null) {
  if (examType && subject) {
    return `${examType.name} - ${subject.name}`
  }

  return examType?.name ?? ""
}

function getProgressBasePath(
  examType: ProgressExamType | null,
  subject: ProgressSubject | null,
) {
  if (examType && subject) {
    return `/progress/${examType.slug}/${subject.slug}`
  }

  if (examType) {
    return `/progress/${examType.slug}`
  }

  return "/progress"
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
