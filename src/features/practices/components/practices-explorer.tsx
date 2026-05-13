"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState, type ReactNode } from "react"
import {
  BookOpenCheckIcon,
  BookOpenIcon,
  ClockIcon,
  GraduationCapIcon,
  LayoutListIcon,
  LockIcon,
  ShieldCheckIcon,
  TargetIcon,
} from "lucide-react"
import { toast } from "sonner"

import type { PlanCode } from "@/config/plans"
import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { cn } from "@/lib/utils"

import type {
  PracticeDiscoveryData,
  PracticeDiscoveryPractice,
  PracticeDiscoverySubject,
  PracticeDiscoveryTopic,
} from "../queries"
import { canAccessPractice } from "../utils/access"
import {
  practiceDifficultyLabels,
  type PracticeDifficulty,
} from "../utils/difficulty"

type PracticesExplorerProps = {
  data: PracticeDiscoveryData
  user: {
    id: number
    name: string
    email: string
    isEmailVerified: boolean
  } | null
  currentPlanCode: PlanCode
}

const difficultyCardClasses: Record<PracticeDifficulty, string> = {
  easy: "ring-chart-2/20 hover:ring-chart-2/45",
  medium: "ring-chart-3/20 hover:ring-chart-3/45",
  hard: "ring-chart-4/20 hover:ring-chart-4/45",
}

const difficultyStripClasses: Record<PracticeDifficulty, string> = {
  easy: "bg-chart-2",
  medium: "bg-chart-3",
  hard: "bg-chart-4",
}

const difficultyBadgeClasses: Record<PracticeDifficulty, string> = {
  easy: "border-chart-2/25 bg-chart-2/10 text-chart-2",
  medium: "border-chart-3/25 bg-chart-3/10 text-chart-3",
  hard: "border-chart-4/25 bg-chart-4/10 text-chart-4",
}

export function PracticesExplorer({
  data,
  user,
  currentPlanCode,
}: PracticesExplorerProps) {
  const router = useRouter()
  const [activeExamTypeId, setActiveExamTypeId] = useState(
    data.examTypes[0]?.id ?? null,
  )
  const [activeSubjectId, setActiveSubjectId] = useState(() => {
    const firstExamTypeId = data.examTypes[0]?.id

    return data.subjects.find((subject) => subject.examTypeId === firstExamTypeId)?.id ?? null
  })
  const [selectedPractice, setSelectedPractice] =
    useState<PracticeDiscoveryPractice | null>(null)

  const activeExamType = useMemo(
    () => data.examTypes.find((examType) => examType.id === activeExamTypeId) ?? null,
    [activeExamTypeId, data.examTypes],
  )

  const visibleSubjects = useMemo(
    () => data.subjects.filter((subject) => subject.examTypeId === activeExamTypeId),
    [activeExamTypeId, data.subjects],
  )

  const activeSubject = useMemo(
    () => visibleSubjects.find((subject) => subject.id === activeSubjectId) ?? null,
    [activeSubjectId, visibleSubjects],
  )

  const visibleTopics = useMemo(
    () => data.topics.filter((topic) => topic.subjectId === activeSubject?.id),
    [activeSubject?.id, data.topics],
  )

  const visiblePractices = useMemo(
    () =>
      data.practices.filter(
        (practice) =>
          practice.examTypeId === activeExamType?.id &&
          practice.subjectId === activeSubject?.id,
      ),
    [activeExamType?.id, activeSubject?.id, data.practices],
  )

  function handleExamTypeChange(value: string) {
    const examTypeId = Number(value)
    const firstSubjectId =
      data.subjects.find((subject) => subject.examTypeId === examTypeId)?.id ?? null

    setActiveExamTypeId(examTypeId)
    setActiveSubjectId(firstSubjectId)
  }

  function handlePracticeStart(practice: PracticeDiscoveryPractice) {
    if (!user) {
      router.push("/login")
      return
    }

    if (!user.isEmailVerified) {
      toast.error("Verifikasi email dulu sebelum mulai latihan.")
      return
    }

    if (!canAccessPractice({ isFree: practice.isFree, planCode: currentPlanCode })) {
      toast.error("Latihan premium tersedia untuk pengguna paket Pro atau Max.")
      return
    }

    setSelectedPractice(practice)
  }

  function handleModeClick(mode: "practice" | "quiz") {
    toast.info(
      mode === "practice"
        ? "Mode Latihan belum dibuka pada tahap ini."
        : "Mode Quiz belum dibuka pada tahap ini.",
    )
    setSelectedPractice(null)
  }

  if (data.examTypes.length === 0) {
    return (
      <main className="mx-auto flex min-h-[62vh] w-full max-w-7xl items-center px-4 py-16 sm:px-6 lg:px-8">
        <Empty className="border bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <GraduationCapIcon />
            </EmptyMedia>
            <EmptyTitle>Belum ada tipe ujian</EmptyTitle>
            <EmptyDescription>
              Latihan akan muncul setelah tipe ujian dan bank soal dipublikasikan.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </main>
    )
  }

  return (
    <main>
      <section className="border-b bg-[linear-gradient(180deg,color-mix(in_oklab,var(--secondary)_62%,transparent),transparent)]">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <span className="h-9 w-1.5 rounded-full bg-primary" aria-hidden="true" />
            <h1 className="font-heading text-[1.65rem] font-semibold leading-tight tracking-normal text-balance sm:text-[1.85rem]">
              Latihan Soal
            </h1>
          </div>

          <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 lg:max-w-[68%]">
            <div
              role="tablist"
              aria-label="Pilih tipe ujian"
              className="inline-flex w-fit min-w-max snap-x items-center gap-1 rounded-lg border bg-card p-1 text-muted-foreground shadow-sm"
            >
              {data.examTypes.map((examType) => {
                const active = examType.id === activeExamTypeId

                return (
                  <button
                    key={examType.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => handleExamTypeChange(String(examType.id))}
                    className={cn(
                      "h-9 flex-none snap-start rounded-md px-3.5 text-sm font-medium whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:px-4",
                      active
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                    )}
                  >
                    {examType.name}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[18.5rem_minmax(0,1fr)] lg:px-8">
        <SubjectSidebar
          examTypeName={activeExamType?.name ?? "Tipe Ujian"}
          subjects={visibleSubjects}
          activeSubjectId={activeSubjectId}
          onSubjectChange={setActiveSubjectId}
        />

        <div className="min-w-0 space-y-6">
          <PracticeBreadcrumb examTypeName={activeExamType?.name} subjectName={activeSubject?.name} />

          {visibleSubjects.length === 0 ? (
            <Empty className="min-h-72 border bg-card">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <BookOpenIcon />
                </EmptyMedia>
                <EmptyTitle>Belum ada mata pelajaran</EmptyTitle>
                <EmptyDescription>
                  {activeExamType?.name
                    ? `${activeExamType.name} belum memiliki mata pelajaran yang tersedia.`
                    : "Tipe ujian ini belum memiliki mata pelajaran."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <>
              <TopicSlider topics={visibleTopics} />
              <PracticeList
                practices={visiblePractices}
                onPracticeStart={handlePracticeStart}
              />
            </>
          )}
        </div>
      </section>

      <ModeDialog
        practice={selectedPractice}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedPractice(null)
          }
        }}
        onModeClick={handleModeClick}
      />
    </main>
  )
}

function SubjectSidebar({
  examTypeName,
  subjects,
  activeSubjectId,
  onSubjectChange,
}: {
  examTypeName: string
  subjects: PracticeDiscoverySubject[]
  activeSubjectId: number | null
  onSubjectChange: (subjectId: number) => void
}) {
  return (
    <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
      <div className="rounded-xl border bg-card p-3 shadow-sm">
        <div className="px-2 pb-3">
          <h2 className="line-clamp-2 font-heading text-base font-semibold">
            {examTypeName}
          </h2>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">
            Pilih sub-materi yang ingin kamu kuasai.
          </p>
        </div>

        {subjects.length === 0 ? (
          <p className="rounded-lg bg-muted/60 px-3 py-4 text-sm text-muted-foreground">
            Belum tersedia.
          </p>
        ) : (
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
            {subjects.map((subject) => {
              const active = subject.id === activeSubjectId

              return (
                <button
                  key={subject.id}
                  type="button"
                  onClick={() => onSubjectChange(subject.id)}
                  className={cn(
                    "min-w-48 rounded-lg px-3 py-2.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 lg:min-w-0",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                  aria-pressed={active}
                >
                  <span className="block truncate font-medium">{subject.name}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </aside>
  )
}

function PracticeBreadcrumb({
  examTypeName,
  subjectName,
}: {
  examTypeName?: string
  subjectName?: string
}) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/">Home</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <span>{examTypeName ?? "Tipe Ujian"}</span>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{subjectName ?? "Mata Pelajaran"}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}

function TopicSlider({ topics }: { topics: PracticeDiscoveryTopic[] }) {
  return (
    <section>
      {topics.length === 0 ? (
        <Empty className="border bg-muted/30 py-8">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <TargetIcon />
            </EmptyMedia>
            <EmptyTitle>Belum ada topik</EmptyTitle>
            <EmptyDescription>
              Topik akan tampil setelah materi mata pelajaran ditambahkan.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Carousel
          opts={{
            align: "start",
            dragFree: true,
          }}
          className="relative"
        >
          <div className="absolute -top-12 right-0 hidden items-center gap-2 sm:flex">
            <CarouselPrevious className="static translate-x-0 translate-y-0" />
            <CarouselNext className="static translate-x-0 translate-y-0" />
          </div>
          <CarouselContent className="-ml-3">
            {topics.map((topic) => (
              <CarouselItem
                key={topic.id}
                className="basis-[78%] pl-3 min-[480px]:basis-1/2 lg:basis-1/3 xl:basis-1/4"
              >
                <div className="flex h-20 items-center rounded-xl border bg-card p-4 shadow-sm transition-colors hover:border-primary/35">
                  <p className="line-clamp-2 text-sm font-medium">{topic.name}</p>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      )}
    </section>
  )
}

function PracticeList({
  practices,
  onPracticeStart,
}: {
  practices: PracticeDiscoveryPractice[]
  onPracticeStart: (practice: PracticeDiscoveryPractice) => void
}) {
  return (
    <section>
      {practices.length === 0 ? (
        <Empty className="min-h-72 border bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <LayoutListIcon />
            </EmptyMedia>
            <EmptyTitle>Belum ada latihan</EmptyTitle>
            <EmptyDescription>
              Coba pilih mata pelajaran lain atau cek kembali setelah bank soal diperbarui.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {practices.map((practice) => (
            <PracticeCard
              key={practice.id}
              practice={practice}
              onStart={() => onPracticeStart(practice)}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function PracticeCard({
  practice,
  onStart,
}: {
  practice: PracticeDiscoveryPractice
  onStart: () => void
}) {
  const titleId = `practice-title-${practice.id}`
  const durationLabel =
    practice.hasQuizMode && practice.quizDurationMinutes
      ? `${practice.quizDurationMinutes}m`
      : "Tanpa timer"

  return (
    <button
      type="button"
      onClick={onStart}
      aria-labelledby={titleId}
      className="h-full w-full rounded-xl text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Card
        className={cn(
          "relative h-full gap-0 rounded-xl py-0 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-secondary/20 hover:shadow-md",
          difficultyCardClasses[practice.difficulty],
        )}
      >
        <div
          className={cn("absolute inset-x-0 top-0 h-[3px]", difficultyStripClasses[practice.difficulty])}
        />
        <CardHeader className="gap-2.5 px-4 pt-4 pb-2">
          <div className="flex min-w-0 items-center justify-between gap-2.5">
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
              <Badge variant="outline" className={difficultyBadgeClasses[practice.difficulty]}>
                {practiceDifficultyLabels[practice.difficulty]}
              </Badge>
              <PracticeMetaBadge>
                <ClockIcon />
                {durationLabel}
              </PracticeMetaBadge>
            </div>
            {practice.isFree ? null : (
              <Badge className="shrink-0 bg-primary text-primary-foreground">
                <LockIcon />
                Premium
              </Badge>
            )}
          </div>
          <CardTitle
            id={titleId}
            role="heading"
            aria-level={3}
            className="line-clamp-2 text-[0.95rem] font-semibold leading-[1.32] tracking-normal text-foreground"
          >
            {practice.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-3 px-4 pt-1 pb-4">
          <PracticeMetaBadge>
            <BookOpenIcon />
            {practice.questionCount} Soal
          </PracticeMetaBadge>
          <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
            {practice.hasPracticeMode ? (
              <PracticeMetaBadge>
                <BookOpenCheckIcon />
                Latihan
              </PracticeMetaBadge>
            ) : null}
            {practice.hasQuizMode ? (
              <PracticeMetaBadge>
                <ClockIcon />
                Quiz
              </PracticeMetaBadge>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </button>
  )
}

function PracticeMetaBadge({ children }: { children: ReactNode }) {
  return (
    <Badge
      variant="outline"
      className="h-5 gap-1 border-border/80 bg-muted/35 px-1.5 text-[0.7rem] font-medium leading-none text-muted-foreground"
    >
      {children}
    </Badge>
  )
}

function ModeDialog({
  practice,
  onOpenChange,
  onModeClick,
}: {
  practice: PracticeDiscoveryPractice | null
  onOpenChange: (open: boolean) => void
  onModeClick: (mode: "practice" | "quiz") => void
}) {
  return (
    <Dialog open={Boolean(practice)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pilih mode latihan</DialogTitle>
          <DialogDescription>
            {practice
              ? `Pilih cara mengerjakan ${practice.title}.`
              : "Pilih mode yang tersedia."}
          </DialogDescription>
        </DialogHeader>

        {practice ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {practice.hasPracticeMode ? (
              <Button
                type="button"
                variant="outline-primary"
                className="h-auto justify-start gap-3 p-4 text-left"
                onClick={() => onModeClick("practice")}
              >
                <BookOpenCheckIcon className="size-5" />
                <span>
                  <span className="block font-semibold">Mode Latihan</span>
                  <span className="block text-xs font-normal text-muted-foreground">
                    Belajar tanpa timer.
                  </span>
                </span>
              </Button>
            ) : null}
            {practice.hasQuizMode ? (
              <Button
                type="button"
                variant="outline-primary"
                className="h-auto justify-start gap-3 p-4 text-left"
                onClick={() => onModeClick("quiz")}
              >
                <ClockIcon className="size-5" />
                <span>
                  <span className="block font-semibold">Mode Quiz</span>
                  <span className="block text-xs font-normal text-muted-foreground">
                    {practice.quizDurationMinutes
                      ? `${practice.quizDurationMinutes} menit.`
                      : "Dengan batas waktu."}
                  </span>
                </span>
              </Button>
            ) : null}
          </div>
        ) : null}

        {practice ? (
          <div className="rounded-xl border bg-muted/40 p-3">
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <ShieldCheckIcon className="mt-0.5 size-4 text-primary" />
              <p>
                Akses latihan mengikuti status konten dan paket aktif akunmu.
              </p>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
