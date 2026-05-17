"use client"

import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useMemo, useState, useTransition, type ReactNode } from "react"
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BookOpenCheckIcon,
  BookOpenIcon,
  ClockIcon,
  GraduationCapIcon,
  LayoutListIcon,
  LockIcon,
} from "lucide-react"
import { toast } from "sonner"

import type { PlanCode } from "@/config/plans"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
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

import { startPracticeSessionAction } from "../actions"
import type { PracticeMode } from "../types"
import type {
  PracticeDiscoveryData,
  PracticeDiscoveryPractice,
  PracticeDiscoverySubject,
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
  selectedExamTypeSlug?: string
}

const difficultyCardClasses: Record<PracticeDifficulty, string> = {
  easy: "group-hover:border-chart-2/35",
  medium: "group-hover:border-chart-3/35",
  hard: "group-hover:border-chart-4/35",
}

const difficultyBadgeClasses: Record<PracticeDifficulty, string> = {
  easy: "border-chart-2/25 bg-chart-2/10 text-chart-2",
  medium: "border-chart-3/25 bg-chart-3/10 text-chart-3",
  hard: "border-chart-4/25 bg-chart-4/10 text-chart-4",
}

const modeLabels: Record<PracticeMode, string> = {
  practice: "Mode Latihan",
  quiz: "Mode Quiz",
}

export function PracticesExplorer({
  data,
  user,
  currentPlanCode,
  selectedExamTypeSlug,
}: PracticesExplorerProps) {
  const router = useRouter()
  const selectedExamType = selectedExamTypeSlug
    ? data.examTypes.find((examType) => examType.slug === selectedExamTypeSlug)
    : null
  const [activeExamTypeId, setActiveExamTypeId] = useState(
    selectedExamType?.id ?? data.examTypes[0]?.id ?? null,
  )
  const [activeSubjectId, setActiveSubjectId] = useState(() => {
    const firstExamTypeId = selectedExamType?.id ?? data.examTypes[0]?.id

    return data.subjects.find((subject) => subject.examTypeId === firstExamTypeId)?.id ?? null
  })
  const [selectedPractice, setSelectedPractice] =
    useState<PracticeDiscoveryPractice | null>(null)
  const [startingMode, setStartingMode] = useState<PracticeMode | null>(null)
  const [existingSession, setExistingSession] = useState<{
    practice: PracticeDiscoveryPractice
    mode: PracticeMode
    sessionId: number
  } | null>(null)
  const [isStarting, startTransition] = useTransition()
  const isExamTypeLocked = Boolean(selectedExamTypeSlug)

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

  const visiblePractices = useMemo(
    () =>
      data.practices.filter(
        (practice) =>
          practice.examTypeId === activeExamType?.id &&
          practice.subjectId === activeSubject?.id,
      ),
    [activeExamType?.id, activeSubject?.id, data.practices],
  )
  const pageTitle = activeExamType ? `Latihan Soal ${activeExamType.name}` : "Latihan Soal"
  const pageSubtitle = activeExamType
    ? `Pilih mata pelajaran ${activeExamType.name}, lalu mulai latihan sesuai kebutuhan belajarmu.`
    : "Pilih tipe ujian dan mata pelajaran untuk membuka kumpulan latihan yang tersedia."

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

  function handleModeClick(mode: PracticeMode) {
    const practice = selectedPractice

    if (!practice) {
      return
    }

    setStartingMode(mode)
    startTransition(async () => {
      const result = await startPracticeSessionAction({
        practiceId: practice.id,
        mode,
      })

      setStartingMode(null)

      if (!result.success) {
        toast.error(result.message)
        return
      }

      if (result.data.resumed) {
        if (result.data.needsDecision) {
          setExistingSession({
            practice,
            mode,
            sessionId: result.data.sessionId,
          })
          return
        }

        toast.info("Sesi sebelumnya dilanjutkan.")
      }

      setSelectedPractice(null)
      router.push(`/practice-sessions/${result.data.sessionId}`)
    })
  }

  function handleRestartExistingSession() {
    const pending = existingSession

    if (!pending) {
      return
    }

    setStartingMode(pending.mode)
    startTransition(async () => {
      const result = await startPracticeSessionAction({
        practiceId: pending.practice.id,
        mode: pending.mode,
        restartExisting: true,
      })

      setStartingMode(null)

      if (!result.success) {
        toast.error(result.message)
        return
      }

      setExistingSession(null)
      setSelectedPractice(null)
      router.push(`/practice-sessions/${result.data.sessionId}`)
    })
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
      <PracticePageHeader
        title={pageTitle}
        subtitle={pageSubtitle}
        showBackButton={isExamTypeLocked}
      />

      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pt-4 pb-8 sm:px-6 lg:px-8">
        {!isExamTypeLocked ? (
          <ExamTypeTabs
            examTypes={data.examTypes}
            activeExamTypeId={activeExamTypeId}
            onExamTypeChange={handleExamTypeChange}
          />
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start">
          <SubjectTabs
            subjects={visibleSubjects}
            activeSubjectId={activeSubjectId}
            onSubjectChange={setActiveSubjectId}
          />

          <div className="min-w-0">
            {visibleSubjects.length === 0 ? (
              <Empty className="min-h-72 border bg-card">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <BookOpenIcon />
                  </EmptyMedia>
                  <EmptyTitle>Belum Ada Mata Pelajaran</EmptyTitle>
                  <EmptyDescription>
                    {activeExamType?.name
                      ? `${activeExamType.name} belum memiliki mata pelajaran yang tersedia.`
                      : "Tipe ujian ini belum memiliki mata pelajaran."}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <PracticeList
                practices={visiblePractices}
                currentPlanCode={currentPlanCode}
                onPracticeStart={handlePracticeStart}
              />
            )}
          </div>
        </div>
      </section>

      <ModeDialog
        practice={selectedPractice}
        onOpenChange={(open) => {
          if (isStarting) {
            return
          }

          if (!open) {
            setSelectedPractice(null)
          }
        }}
        onModeClick={handleModeClick}
        isStarting={isStarting}
        startingMode={startingMode}
      />

      <AlertDialog
        open={Boolean(existingSession)}
        onOpenChange={(open) => {
          if (!open && !isStarting) {
            setExistingSession(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sesi masih berjalan</AlertDialogTitle>
            <AlertDialogDescription>
              Kamu punya sesi {existingSession ? modeLabels[existingSession.mode] : "latihan"} yang belum selesai.
              Lanjutkan sesi tersebut atau mulai baru dengan membatalkan sesi lama.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button type="button" variant="outline" disabled={isStarting}>
                Batal
              </Button>
            </AlertDialogCancel>
            <Button
              type="button"
              variant="outline"
              disabled={isStarting}
              onClick={() => {
                const sessionId = existingSession?.sessionId

                if (sessionId) {
                  setExistingSession(null)
                  setSelectedPractice(null)
                  router.push(`/practice-sessions/${sessionId}`)
                }
              }}
            >
              Lanjutkan
            </Button>
            <AlertDialogAction asChild>
              <Button type="button" disabled={isStarting} onClick={handleRestartExistingSession}>
                Mulai Baru
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}

function PracticePageHeader({
  title,
  subtitle,
  showBackButton,
}: {
  title: string
  subtitle: string
  showBackButton: boolean
}) {
  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 pt-6 pb-1 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
      <div className="flex max-w-2xl flex-col gap-1.5">
        <h1 className="font-heading text-[1.7rem] font-semibold leading-tight tracking-normal text-foreground/95 sm:text-[2rem]">
          {title}
        </h1>
        <p className="max-w-xl text-[0.925rem] leading-6 text-muted-foreground">
          {subtitle}
        </p>
      </div>
      {showBackButton ? (
        <Button asChild variant="outline" className="w-fit shrink-0">
          <Link href="/practices">
            <ArrowLeftIcon data-icon="inline-start" />
            Kembali Ke Latihan
          </Link>
        </Button>
      ) : null}
    </section>
  )
}

function ExamTypeTabs({
  examTypes,
  activeExamTypeId,
  onExamTypeChange,
}: {
  examTypes: PracticeDiscoveryData["examTypes"]
  activeExamTypeId: number | null
  onExamTypeChange: (value: string) => void
}) {
  return (
    <div
      role="tablist"
      aria-label="Pilih Tipe Ujian"
      className="flex w-full flex-wrap gap-2 pb-1"
    >
      {examTypes.map((examType) => {
        const active = examType.id === activeExamTypeId

        return (
          <button
            key={examType.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onExamTypeChange(String(examType.id))}
            className={cn(
              "inline-flex h-10 shrink-0 items-center rounded-full border px-4 text-sm font-semibold tracking-normal shadow-sm transition-all focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              active
                ? "border-primary bg-primary text-primary-foreground shadow-primary/20"
                : "border-border/80 bg-card text-muted-foreground hover:border-primary/30 hover:bg-secondary hover:text-foreground",
            )}
          >
            {examType.name}
          </button>
        )
      })}
    </div>
  )
}

function SubjectTabs({
  subjects,
  activeSubjectId,
  onSubjectChange,
}: {
  subjects: PracticeDiscoverySubject[]
  activeSubjectId: number | null
  onSubjectChange: (subjectId: number) => void
}) {
  return (
    <aside
      role="tablist"
      aria-label="Pilih Mata Pelajaran"
      className="flex w-full flex-col gap-2 lg:sticky lg:top-24"
    >
      {subjects.map((subject) => {
        const active = subject.id === activeSubjectId

        return (
          <button
            key={subject.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSubjectChange(subject.id)}
            className={cn(
              "inline-flex h-10 w-full min-w-0 items-center justify-start gap-2 rounded-full border px-4 text-sm font-semibold tracking-normal shadow-sm transition-all focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              active
                ? "border-primary bg-primary text-primary-foreground shadow-primary/20"
                : "border-border/80 bg-card text-muted-foreground hover:border-primary/30 hover:bg-secondary hover:text-foreground",
            )}
          >
            <span className="flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-sm [&_svg]:size-4">
              {subject.logoUrl ? (
                <Image
                  src={subject.logoUrl}
                  alt=""
                  width={20}
                  height={20}
                  unoptimized
                  className="size-full object-contain"
                />
              ) : (
                <BookOpenIcon />
              )}
            </span>
            <span className="min-w-0 truncate text-left">{subject.name}</span>
          </button>
        )
      })}
    </aside>
  )
}

function PracticeList({
  practices,
  currentPlanCode,
  onPracticeStart,
}: {
  practices: PracticeDiscoveryPractice[]
  currentPlanCode: PlanCode
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
              currentPlanCode={currentPlanCode}
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
  currentPlanCode,
  onStart,
}: {
  practice: PracticeDiscoveryPractice
  currentPlanCode: PlanCode
  onStart: () => void
}) {
  const titleId = `practice-title-${practice.id}`
  const durationLabel =
    practice.hasQuizMode && practice.quizDurationMinutes
      ? `${practice.quizDurationMinutes} Menit`
      : "Tanpa Timer"
  const accessAllowed = canAccessPractice({
    isFree: practice.isFree,
    planCode: currentPlanCode,
  })
  const actionLabel = accessAllowed ? "Mulai Latihan" : "Upgrade Untuk Akses"

  return (
    <button
      type="button"
      onClick={onStart}
      aria-labelledby={titleId}
      className="group h-full w-full rounded-lg text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Card
        className={cn(
          "flex h-full flex-col rounded-lg border-border/75 bg-card py-5 shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)]",
          difficultyCardClasses[practice.difficulty],
        )}
      >
        <CardHeader className="gap-4 px-5 pb-0">
          <div className="flex items-start justify-between gap-3">
            <Badge
              variant="outline"
              className={cn("h-7 shrink-0 rounded-full px-3 text-xs font-semibold", difficultyBadgeClasses[practice.difficulty])}
            >
              {practiceDifficultyLabels[practice.difficulty]}
            </Badge>
            {practice.isFree ? (
              <Badge variant="soft" className="h-7 shrink-0 rounded-full px-3 text-xs font-semibold">
                Gratis
              </Badge>
            ) : (
              <Badge className="h-7 shrink-0 rounded-full bg-primary px-3 text-xs font-semibold text-primary-foreground">
                <LockIcon data-icon="inline-start" />
                Premium
              </Badge>
            )}
          </div>

          <div className="flex flex-col gap-2.5">
            <CardTitle
              id={titleId}
              role="heading"
              aria-level={3}
              className="line-clamp-2 text-[1.08rem] font-semibold leading-6 text-foreground"
            >
              {practice.title}
            </CardTitle>
            <p className="line-clamp-3 min-h-[4.5rem] text-[0.925rem] leading-6 text-muted-foreground">
              {practice.description ?? "Latihan soal terkurasi untuk memperkuat pemahaman materi."}
            </p>
          </div>
        </CardHeader>

        <CardContent className="mt-auto flex flex-1 flex-col px-5 pt-4">
          <div className="grid grid-cols-3 gap-2">
            <PracticeMetric label="Soal" value={practice.questionCount.toString()} />
            <PracticeMetric label="Timer" value={durationLabel} />
            <PracticeMetric label="Mode" value={formatPracticeModes(practice)} />
          </div>

          <span
            className={cn(
              "mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold shadow-sm transition-colors [&_svg]:size-4",
              accessAllowed
                ? "border-primary/25 bg-primary text-primary-foreground group-hover:bg-primary/90"
                : "border-border bg-secondary text-muted-foreground shadow-none group-hover:bg-secondary/80",
            )}
          >
            {!accessAllowed ? <LockIcon /> : null}
            {actionLabel}
            {accessAllowed ? <ArrowRightIcon aria-hidden="true" /> : null}
          </span>
        </CardContent>
      </Card>
    </button>
  )
}

function PracticeMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/70 bg-background/70 px-2.5 py-2">
      <span className="block truncate text-sm font-semibold text-foreground">{value}</span>
      <span className="mt-0.5 block truncate text-xs font-medium text-muted-foreground">
        {label}
      </span>
    </div>
  )
}

function formatPracticeModes(practice: PracticeDiscoveryPractice) {
  if (practice.hasPracticeMode && practice.hasQuizMode) {
    return "2 Mode"
  }

  if (practice.hasQuizMode) {
    return "Quiz"
  }

  return "Latihan"
}

function ModeDialog({
  practice,
  onOpenChange,
  onModeClick,
  isStarting,
  startingMode,
}: {
  practice: PracticeDiscoveryPractice | null
  onOpenChange: (open: boolean) => void
  onModeClick: (mode: PracticeMode) => void
  isStarting: boolean
  startingMode: PracticeMode | null
}) {
  return (
    <Dialog open={Boolean(practice)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pilih Mode Latihan</DialogTitle>
        </DialogHeader>

        {practice ? (
          <div className="grid gap-3">
            {practice.hasPracticeMode ? (
              <ModeOptionButton
                title="Mode Latihan"
                description="Belajar bertahap dengan feedback langsung setelah jawaban dikonfirmasi."
                icon={<BookOpenCheckIcon />}
                isLoading={isStarting && startingMode === "practice"}
                disabled={isStarting}
                onClick={() => onModeClick("practice")}
                tone="study"
              />
            ) : null}
            {practice.hasQuizMode ? (
              <ModeOptionButton
                title="Mode Quiz"
                description="Simulasi singkat dengan timer, navigasi bebas, dan hasil setelah submit."
                icon={<ClockIcon />}
                isLoading={isStarting && startingMode === "quiz"}
                disabled={isStarting}
                onClick={() => onModeClick("quiz")}
                tone="quiz"
              />
            ) : null}
          </div>
        ) : null}

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="ghost" disabled={isStarting}>
              Batal
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ModeOptionButton({
  title,
  description,
  icon,
  tone,
  isLoading,
  disabled,
  onClick,
}: {
  title: string
  description: string
  icon: ReactNode
  tone: "study" | "quiz"
  isLoading: boolean
  disabled: boolean
  onClick: () => void
}) {
  const styles = modeOptionToneClasses[tone]

  return (
    <button
      type="button"
      className={cn(
        "group rounded-xl border bg-card p-4 text-left transition-colors hover:bg-muted/35 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-60",
        styles.card,
      )}
      disabled={disabled}
      onClick={onClick}
      aria-label={`Mulai ${title}`}
    >
      <div className="flex items-start gap-4">
        <span className={cn("grid size-10 shrink-0 place-items-center rounded-lg [&_svg]:size-5", styles.icon)}>
          {isLoading ? <ClockIcon className="animate-spin" /> : icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="text-base font-semibold text-foreground">{title}</span>
          <span className="mt-1 block text-sm leading-6 text-muted-foreground">
            {description}
          </span>
        </span>
      </div>
    </button>
  )
}

const modeOptionToneClasses = {
  study: {
    card: "hover:border-chart-2/45",
    icon: "bg-chart-2/10 text-chart-2",
  },
  quiz: {
    card: "hover:border-primary/45",
    icon: "bg-primary/10 text-primary",
  },
}
