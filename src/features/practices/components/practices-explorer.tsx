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
  CheckCircle2Icon,
  ClockIcon,
  GaugeIcon,
  GraduationCapIcon,
  LayoutListIcon,
  LoaderCircleIcon,
  LockIcon,
} from "lucide-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
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
  DialogDescription,
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
  premiumExamTypeIds: number[]
  selectedExamTypeSlug?: string
}

const difficultyCardClasses: Record<PracticeDifficulty, string> = {
  easy: "border-chart-2/35 shadow-chart-2/10 hover:border-chart-2/55 hover:shadow-chart-2/20",
  medium: "border-chart-3/35 shadow-chart-3/10 hover:border-chart-3/55 hover:shadow-chart-3/20",
  hard: "border-chart-4/35 shadow-chart-4/10 hover:border-chart-4/55 hover:shadow-chart-4/20",
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
  premiumExamTypeIds,
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

    if (
      !canAccessPractice({
        isFree: practice.isFree,
        hasPremiumAccess: premiumExamTypeIds.includes(practice.examTypeId),
      })
    ) {
      toast.error(`Latihan premium tersedia untuk paket ${practice.examTypeSlug.toUpperCase()}.`)
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
                premiumExamTypeIds={premiumExamTypeIds}
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
    <section className="mx-auto w-full max-w-7xl px-4 pt-6 pb-1 sm:px-6 lg:px-8">
      <PageHeader
        className="mb-0"
        title={title}
        subtitle={subtitle}
        actions={
          showBackButton ? (
            <Button asChild variant="outline" className="w-fit shrink-0">
              <Link href="/practices">
                <ArrowLeftIcon data-icon="inline-start" />
                Kembali Ke Latihan
              </Link>
            </Button>
          ) : null
        }
      />
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
          <Button
            key={examType.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onExamTypeChange(String(examType.id))}
            variant={active ? "default" : "outline"}
            className={cn(
              "shrink-0 rounded-full px-4 font-semibold tracking-normal shadow-sm",
              !active && "text-muted-foreground hover:border-primary/30 hover:text-foreground",
            )}
          >
            {examType.name}
          </Button>
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
          <Button
            key={subject.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSubjectChange(subject.id)}
            variant={active ? "default" : "outline"}
            size="xl"
            className={cn(
              "w-full min-w-0 justify-start rounded-full font-semibold tracking-normal shadow-sm",
              !active && "text-muted-foreground hover:border-primary/30 hover:text-foreground",
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
          </Button>
        )
      })}
    </aside>
  )
}

function PracticeList({
  practices,
  premiumExamTypeIds,
  onPracticeStart,
}: {
  practices: PracticeDiscoveryPractice[]
  premiumExamTypeIds: number[]
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
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {practices.map((practice) => (
            <PracticeCard
              key={practice.id}
              practice={practice}
              premiumExamTypeIds={premiumExamTypeIds}
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
  premiumExamTypeIds,
  onStart,
}: {
  practice: PracticeDiscoveryPractice
  premiumExamTypeIds: number[]
  onStart: () => void
}) {
  const titleId = `practice-title-${practice.id}`
  const durationLabel =
    practice.quizDurationMinutes
      ? `${practice.quizDurationMinutes} Menit`
      : "Tanpa Timer"
  const accessAllowed = canAccessPractice({
    isFree: practice.isFree,
    hasPremiumAccess: premiumExamTypeIds.includes(practice.examTypeId),
  })
  const actionLabel = accessAllowed ? "Mulai Latihan" : "Upgrade Untuk Akses"

  return (
    <Card
      className={cn(
        "flex h-full flex-col rounded-lg bg-card py-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg",
        difficultyCardClasses[practice.difficulty],
      )}
    >
      <CardHeader className="gap-2.5 px-5 pb-0">
        <div className="flex items-start justify-between gap-3">
          <Badge
            variant="outline"
            size="sm"
            className={cn(
              "shrink-0 rounded-full font-semibold",
              difficultyBadgeClasses[practice.difficulty],
            )}
          >
            <GaugeIcon />
            {practiceDifficultyLabels[practice.difficulty]}
          </Badge>
          {practice.isFree ? null : (
            <Badge variant="destructive" size="sm" className="shrink-0 rounded-full font-semibold">
              <LockIcon data-icon="inline-start" />
              Premium
            </Badge>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <CardTitle
            id={titleId}
            role="heading"
            aria-level={3}
            className="line-clamp-2 text-[1.05rem] font-semibold leading-6 text-foreground sm:text-[1.08rem]"
          >
            {practice.title}
          </CardTitle>
          <p className="line-clamp-3 text-[0.9rem] font-normal leading-6 text-muted-foreground sm:text-[0.925rem]">
            {practice.description ?? "Latihan soal terkurasi untuk memperkuat pemahaman materi."}
          </p>
        </div>
      </CardHeader>

      <CardContent className="mt-auto flex flex-col gap-3.5 px-5 pt-3.5">
        <div className="flex items-center justify-between gap-3">
          <PracticeMetaItem>
            <BookOpenIcon />
            {practice.questionCount} Soal
          </PracticeMetaItem>
          <PracticeMetaItem>
            <ClockIcon />
            {durationLabel}
          </PracticeMetaItem>
        </div>

        <Button
          type="button"
          aria-label={`${actionLabel} ${practice.title}`}
          onClick={onStart}
          className="w-full"
          variant={accessAllowed ? "default" : "secondary"}
          size="lg"
        >
          {!accessAllowed ? <LockIcon data-icon="inline-start" /> : null}
          {actionLabel}
          {accessAllowed ? <ArrowRightIcon data-icon="inline-end" /> : null}
        </Button>
      </CardContent>
    </Card>
  )
}

function PracticeMetaItem({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[0.8rem] font-medium leading-none text-muted-foreground [&_svg]:size-3.5">
      {children}
    </span>
  )
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
  const durationLabel = practice?.quizDurationMinutes
    ? `${practice.quizDurationMinutes} Menit`
    : "Tanpa Timer"

  return (
    <Dialog open={Boolean(practice)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="line-clamp-2">
            {practice?.title ?? "Mulai Latihan"}
          </DialogTitle>
          <DialogDescription>
            Pilih mode pengerjaan yang paling sesuai dengan target belajarmu.
          </DialogDescription>
        </DialogHeader>

        {practice ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <ModeOptionButton
              title="Mode Latihan"
              description="Cocok untuk memahami konsep dan mengecek jawaban sambil belajar."
              points={["Feedback Langsung", "Tanpa Tekanan Timer"]}
              icon={<BookOpenCheckIcon />}
              isLoading={isStarting && startingMode === "practice"}
              disabled={isStarting}
              onClick={() => onModeClick("practice")}
              tone="study"
            />
            <ModeOptionButton
              title="Mode Quiz"
              description="Cocok untuk mengukur kesiapan dengan suasana yang lebih terstruktur."
              points={[durationLabel, "Hasil Setelah Submit"]}
              icon={<ClockIcon />}
              isLoading={isStarting && startingMode === "quiz"}
              disabled={isStarting}
              onClick={() => onModeClick("quiz")}
              tone="quiz"
            />
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
  points,
  icon,
  tone,
  isLoading,
  disabled,
  onClick,
}: {
  title: string
  description: string
  points: string[]
  icon: ReactNode
  tone: "study" | "quiz"
  isLoading: boolean
  disabled: boolean
  onClick: () => void
}) {
  const styles = modeOptionToneClasses[tone]

  return (
    <Card
      className={cn(
        "group h-full min-h-60 gap-0 rounded-xl border border-border/80 bg-card py-0 text-left shadow-xs ring-0 transition-all hover:-translate-y-0.5 hover:bg-card hover:shadow-md",
        styles.card,
        disabled && "pointer-events-none opacity-70",
      )}
    >
      <CardContent className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start gap-4">
          <span className={cn("grid size-11 shrink-0 place-items-center rounded-xl [&_svg]:size-5", styles.icon)}>
            {isLoading ? <LoaderCircleIcon className="animate-spin" /> : icon}
          </span>
        </div>
        <div className="flex flex-1 flex-col gap-3">
          <span className="text-lg font-semibold leading-6 text-foreground">{title}</span>
          <span className="text-sm leading-6 text-muted-foreground">{description}</span>
          <div className="mt-auto flex flex-col gap-2">
            {points.map((point) => (
              <span
                key={point}
                className="inline-flex items-center gap-2 text-sm font-medium text-foreground"
              >
                <CheckCircle2Icon className={styles.checkIcon} />
                {point}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-0 bg-transparent px-5 pb-5 pt-0">
        <Button
          type="button"
          variant="secondary"
          className={cn("w-full shadow-none", styles.action)}
          disabled={disabled}
          onClick={onClick}
          aria-label={`Mulai ${title}`}
        >
          {isLoading ? <LoaderCircleIcon data-icon="inline-start" className="animate-spin" /> : null}
          {isLoading ? "Memulai..." : `Pilih ${title}`}
          {isLoading ? null : <ArrowRightIcon data-icon="inline-end" />}
        </Button>
      </CardFooter>
    </Card>
  )
}

const modeOptionToneClasses = {
  study: {
    action: "bg-chart-2/10 text-chart-2 hover:bg-chart-2/15",
    card: "hover:border-chart-2/45 hover:shadow-chart-2/10",
    checkIcon: "text-chart-2",
    icon: "bg-chart-2/10 text-chart-2",
  },
  quiz: {
    action: "bg-primary/10 text-primary hover:bg-primary/15",
    card: "hover:border-primary/45 hover:shadow-primary/10",
    checkIcon: "text-primary",
    icon: "bg-primary/10 text-primary",
  },
}
