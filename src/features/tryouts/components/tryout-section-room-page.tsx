"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react"
import { useRouter } from "next/navigation"
import {
  AlarmClockIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ClockIcon,
  FileTextIcon,
  FlagIcon,
  Loader2Icon,
  SendIcon,
} from "lucide-react"
import { toast } from "sonner"

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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Progress } from "@/components/ui/progress"

import {
  QuestionContent,
  QuestionNavigation,
  QuestionOptionField,
  QuestionStatusPill,
} from "@/features/question-room/components"

import {
  saveTryoutAnswerAction,
  setTryoutCurrentQuestionAction,
  setTryoutQuestionFlagAction,
  submitTryoutSectionAction,
} from "../actions"
import type {
  TryoutQuestionType,
  TryoutRoomAnswer,
  TryoutRoomQuestion,
  TryoutSectionRoomData,
} from "../types"

type AnswerMap = Record<number, TryoutRoomAnswer>

const questionTypeLabels: Record<TryoutQuestionType, string> = {
  multiple_choice: "Pilihan Ganda",
  multiple_answer: "Multi Jawaban",
  short_answer: "Isian Singkat",
  true_false: "Benar/Salah",
}

export function TryoutSectionRoomPage({ session }: { session: TryoutSectionRoomData }) {
  const router = useRouter()
  const [answers, setAnswers] = useState<AnswerMap>(() => createInitialAnswerMap(session))
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(
      0,
      session.questions.findIndex(
        (question) => question.orderIndex === session.section.currentQuestionOrder,
      ),
    ),
  )
  const [isFinishDialogOpen, setIsFinishDialogOpen] = useState(false)
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    session.section.startedAt
      ? getInitialRemainingSeconds(session.section.startedAt, session.section.durationMinutes)
      : session.section.durationMinutes * 60,
  )
  const [isPending, startTransition] = useTransition()
  const hasAutoSubmittedRef = useRef(false)
  const sectionTimerRef = useRef<number | null>(null)
  const remainingSecondsRef = useRef<number>(remainingSeconds)

  const answeredCount = useMemo(
    () => session.questions.filter((question) => isQuestionAnswered(answers[question.id])).length,
    [answers, session.questions],
  )
  const markedCount = useMemo(
    () => session.questions.filter((question) => answers[question.id]?.isMarkedForReview).length,
    [answers, session.questions],
  )
  const progressValue =
    session.questions.length > 0 ? Math.round((answeredCount / session.questions.length) * 100) : 0
  const highestReachableIndex = useMemo(() => {
    if (session.navigationMode === "free") {
      return session.questions.length - 1
    }

    const firstUnansweredIndex = session.questions.findIndex(
      (question) => !isQuestionAnswered(answers[question.id]),
    )

    if (firstUnansweredIndex === -1) {
      return session.questions.length - 1
    }

    return firstUnansweredIndex
  }, [answers, session.navigationMode, session.questions])
  const activeQuestionIndex =
    session.navigationMode === "sequential" ? Math.min(activeIndex, highestReachableIndex) : activeIndex
  const activeQuestion = session.questions[activeQuestionIndex] ?? null
  const legendItems = useMemo(
    () => [
      { className: "bg-primary", label: "Aktif" },
      { className: "bg-primary/20", label: "Terjawab" },
      { className: "bg-chart-3", label: "Ditandai" },
    ],
    [],
  )
  const navigatorItems = useMemo(
    () =>
      session.questions.map((question, index) => {
        const answer = answers[question.id]

        return {
          id: question.id,
          label: question.displayOrder,
          active: index === activeQuestionIndex,
          answered: isQuestionAnswered(answer),
          flagged: Boolean(answer?.isMarkedForReview),
          locked: index > highestReachableIndex,
          ariaLabel: `Buka soal ${question.displayOrder}`,
        }
      }),
    [activeQuestionIndex, answers, highestReachableIndex, session.questions],
  )
  const persistAnswer = useCallback(
    async (question: TryoutRoomQuestion, answer: TryoutRoomAnswer) =>
      saveTryoutAnswerAction({
        sessionId: session.sessionId,
        sectionSessionId: session.section.id,
        sessionQuestionId: question.id,
        selectedOptionKeys: answer.selectedOptionKeys,
        answerText: answer.answerText,
      }),
    [session.section.id, session.sessionId],
  )
  const moveToQuestion = useCallback(
    (index: number) => {
      if (index < 0 || index >= session.questions.length || index > highestReachableIndex) {
        return
      }

      if (index === activeQuestionIndex) {
        return
      }

      const targetQuestion = session.questions[index]

      setActiveIndex(index)
      startTransition(async () => {
        const result = await setTryoutCurrentQuestionAction({
          sessionId: session.sessionId,
          sectionSessionId: session.section.id,
          orderIndex: targetQuestion.orderIndex,
        })

        if (!result.success) {
          toast.error(result.message)
        }
      })
    },
    [activeQuestionIndex, highestReachableIndex, session.questions, session.section.id, session.sessionId, startTransition],
  )

  useEffect(() => {
    if (session.sessionStatus !== "in_progress" || session.section.status !== "in_progress") {
      router.replace(`/tryout-sessions/${session.sessionId}`)
    }
  }, [router, session.section.status, session.sessionId, session.sessionStatus])

  useEffect(() => {
    remainingSecondsRef.current = remainingSeconds
  }, [remainingSeconds])

  useEffect(() => {
    if (remainingSecondsRef.current <= 0 || sectionTimerRef.current !== null) {
      return
    }

    sectionTimerRef.current = window.setInterval(() => {
      const current = remainingSecondsRef.current

      if (current <= 1) {
        remainingSecondsRef.current = 0
        setRemainingSeconds(0)

        if (sectionTimerRef.current !== null) {
          window.clearInterval(sectionTimerRef.current)
          sectionTimerRef.current = null
        }

        return
      }

      const next = current - 1
      remainingSecondsRef.current = next
      setRemainingSeconds(next)
    }, 1000)

    return () => {
      if (sectionTimerRef.current !== null) {
        window.clearInterval(sectionTimerRef.current)
        sectionTimerRef.current = null
      }
    }
  }, [session.section.id, session.sessionId])

  useEffect(() => {
    if (remainingSeconds !== 0 || hasAutoSubmittedRef.current) {
      return
    }

    hasAutoSubmittedRef.current = true
    toast.warning("Waktu section habis. Jawaban terakhir otomatis dikirim.")

    if (sectionTimerRef.current !== null) {
      window.clearInterval(sectionTimerRef.current)
      sectionTimerRef.current = null
    }

    startTransition(async () => {
      if (activeQuestion) {
        await persistAnswer(activeQuestion, answers[activeQuestion.id])
      }

      const result = await submitTryoutSectionAction({
        sessionId: session.sessionId,
        sectionSessionId: session.section.id,
        autoSubmitted: true,
      })

      if (!result.success) {
        toast.error(result.message)
        return
      }

      router.replace(`/tryout-sessions/${session.sessionId}`)
    })
  }, [
    activeQuestion,
    answers,
    persistAnswer,
    remainingSeconds,
    router,
    session.section.id,
    session.sessionId,
    startTransition,
  ])

  function getAnswer(questionId: number) {
    return answers[questionId] ?? createEmptyAnswer(questionId)
  }

  function saveChoice(question: TryoutRoomQuestion, selectedOptionKeys: string[]) {
    const currentAnswer = getAnswer(question.id)

    setAnswers((current) => ({
      ...current,
      [question.id]: {
        ...currentAnswer,
        selectedOptionKeys,
        answerText: "",
      },
    }))

    startTransition(async () => {
      const result = await saveTryoutAnswerAction({
        sessionId: session.sessionId,
        sectionSessionId: session.section.id,
        sessionQuestionId: question.id,
        selectedOptionKeys,
      })

      if (!result.success) {
        toast.error(result.message)
      }
    })
  }

  function saveTextAnswer(question: TryoutRoomQuestion, answerText: string) {
    const currentAnswer = getAnswer(question.id)

    setAnswers((current) => ({
      ...current,
      [question.id]: {
        ...currentAnswer,
        answerText,
        selectedOptionKeys: [],
      },
    }))
  }

  function persistTextAnswer(question: TryoutRoomQuestion) {
    startTransition(async () => {
      const result = await persistAnswer(question, getAnswer(question.id))

      if (!result.success) {
        toast.error(result.message)
      }
    })
  }

  function toggleFlag(question: TryoutRoomQuestion) {
    const currentAnswer = getAnswer(question.id)
    const nextFlag = !currentAnswer.isMarkedForReview

    setAnswers((current) => ({
      ...current,
      [question.id]: {
        ...currentAnswer,
        isMarkedForReview: nextFlag,
      },
    }))

    startTransition(async () => {
      const result = await setTryoutQuestionFlagAction({
        sessionId: session.sessionId,
        sectionSessionId: session.section.id,
        sessionQuestionId: question.id,
        isMarkedForReview: nextFlag,
      })

      if (!result.success) {
        toast.error(result.message)
      }
    })
  }

  function submitSection() {
    startTransition(async () => {
      if (activeQuestion) {
        const saveResult = await persistAnswer(activeQuestion, getAnswer(activeQuestion.id))

        if (!saveResult.success) {
          toast.error(saveResult.message)
          return
        }
      }

      const result = await submitTryoutSectionAction({
        sessionId: session.sessionId,
        sectionSessionId: session.section.id,
      })

      if (!result.success) {
        toast.error(result.message)
        return
      }

      router.push(`/tryout-sessions/${session.sessionId}`)
    })
  }

  if (session.sessionStatus !== "in_progress" || session.section.status !== "in_progress") {
    return null
  }

  if (!activeQuestion) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-muted/35 px-4">
        <EmptyState />
      </main>
    )
  }

  const activeAnswer = getAnswer(activeQuestion.id)
  const unansweredCount = session.questions.length - answeredCount

  return (
    <main className="min-h-svh bg-muted/35">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2.5 px-4 py-2.5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <Badge variant="outline" className="gap-1.5 bg-primary/10 text-primary">
                <AlarmClockIcon />
                Mode Tryout
              </Badge>
              <span className="text-xs font-medium text-muted-foreground">
                {session.examTypeName} / {session.section.title}
              </span>
            </div>
            <h1 className="min-w-0 max-w-full truncate text-left font-heading text-sm font-semibold tracking-normal text-foreground sm:max-w-[52%] sm:text-right sm:text-base">
              {session.title}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="shrink-0"
              onClick={() => router.push(`/tryout-sessions/${session.sessionId}`)}
            >
              <ArrowLeftIcon data-icon="inline-start" />
              Kembali
            </Button>
            <Progress value={progressValue} className="h-2 flex-1" />
            <div className="flex shrink-0 items-center gap-2">
              <p className="text-xs font-medium text-muted-foreground">{progressValue}%</p>
              <QuestionStatusPill icon={<ClockIcon />}>
                <span suppressHydrationWarning>{formatDuration(remainingSeconds)}</span>
              </QuestionStatusPill>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl items-start gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[18rem_minmax(0,1fr)] lg:px-8">
        <QuestionNavigation
          items={navigatorItems}
          onSelect={moveToQuestion}
          legendItems={legendItems}
        />

        <section className="flex min-w-0 flex-col gap-4">
          <Card className="gap-0 overflow-hidden py-0 shadow-sm">
            <CardHeader className="px-4 py-4 sm:px-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">
                    Soal {activeQuestion.displayOrder}/{session.questions.length}
                  </Badge>
                  <Badge variant="outline">{questionTypeLabels[activeQuestion.question.type]}</Badge>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className={
                    activeAnswer.isMarkedForReview
                      ? "bg-chart-3/10 text-chart-3 hover:bg-chart-3/15"
                      : undefined
                  }
                  onClick={() => toggleFlag(activeQuestion)}
                  disabled={isPending}
                  aria-label={activeAnswer.isMarkedForReview ? "Hapus tanda soal" : "Tandai soal"}
                  title={activeAnswer.isMarkedForReview ? "Hapus tanda soal" : "Tandai soal"}
                >
                  <FlagIcon />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="flex flex-col gap-6 px-4 pb-5 pt-1 sm:px-5">
              <QuestionContent
                content={activeQuestion.question.content}
                imageUrl={activeQuestion.question.imageUrl}
              />

              <QuestionOptionField
                question={activeQuestion}
                answer={activeAnswer}
                feedbackMode="none"
                isPending={isPending}
                onChoiceChange={(selectedOptionKeys) => saveChoice(activeQuestion, selectedOptionKeys)}
                onTextChange={(answerText) => saveTextAnswer(activeQuestion, answerText)}
                onTextBlur={() => persistTextAnswer(activeQuestion)}
              />

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 sm:gap-4">
                <div className="flex min-w-fit justify-start">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => moveToQuestion(activeQuestionIndex - 1)}
                    disabled={activeQuestionIndex === 0 || isPending}
                  >
                    <ArrowLeftIcon data-icon="inline-start" />
                    Sebelumnya
                  </Button>
                </div>

                <div className="flex min-w-fit justify-center sm:min-w-8">
                  {isPending ? <Loader2Icon className="animate-spin text-muted-foreground" /> : null}
                </div>

                <div className="flex min-w-fit justify-end">
                  <RoomPrimaryActions
                    activeIndex={activeQuestionIndex}
                    totalQuestions={session.questions.length}
                    highestReachableIndex={highestReachableIndex}
                    isPending={isPending}
                    onFinish={() => setIsFinishDialogOpen(true)}
                    onNext={() => moveToQuestion(activeQuestionIndex + 1)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>

      <FinishDialog
        open={isFinishDialogOpen}
        onOpenChange={setIsFinishDialogOpen}
        sectionTitle={session.section.title}
        totalQuestions={session.questions.length}
        answeredCount={answeredCount}
        unansweredCount={unansweredCount}
        markedCount={markedCount}
        remainingSeconds={remainingSeconds}
        disabled={isPending}
        onConfirm={submitSection}
      />
    </main>
  )
}

function RoomPrimaryActions({
  activeIndex,
  totalQuestions,
  highestReachableIndex,
  isPending,
  onFinish,
  onNext,
}: {
  activeIndex: number
  totalQuestions: number
  highestReachableIndex: number
  isPending: boolean
  onFinish: () => void
  onNext: () => void
}) {
  return (
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
      {activeIndex >= totalQuestions - 1 ? (
        <Button
          type="button"
          className="bg-chart-2 text-white hover:bg-chart-2/90"
          onClick={onFinish}
          disabled={isPending}
        >
          <SendIcon data-icon="inline-start" />
          Selesai
        </Button>
      ) : (
        <Button
          type="button"
          onClick={onNext}
          disabled={activeIndex >= totalQuestions - 1 || activeIndex + 1 > highestReachableIndex || isPending}
        >
          Berikutnya
          <ArrowRightIcon data-icon="inline-end" />
        </Button>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <Empty className="max-w-md border bg-card">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FileTextIcon />
        </EmptyMedia>
        <EmptyTitle>Belum ada soal</EmptyTitle>
        <EmptyDescription>
          Section ini belum memiliki snapshot soal yang dapat dikerjakan.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

function FinishDialog({
  open,
  onOpenChange,
  sectionTitle,
  totalQuestions,
  answeredCount,
  unansweredCount,
  markedCount,
  remainingSeconds,
  disabled,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  sectionTitle: string
  totalQuestions: number
  answeredCount: number
  unansweredCount: number
  markedCount: number
  remainingSeconds: number
  disabled: boolean
  onConfirm: () => void
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Selesaikan section {sectionTitle}?</AlertDialogTitle>
          <AlertDialogDescription>
            Jawaban section ini akan dikirim dan tidak dapat diubah setelah submit.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <SummaryItem label="Total soal" value={totalQuestions} />
          <SummaryItem label="Sudah dijawab" value={answeredCount} />
          <SummaryItem label="Belum dijawab" value={unansweredCount} />
          <SummaryItem label="Ditandai" value={markedCount} />
          <SummaryItem label="Sisa waktu" value={formatDuration(remainingSeconds)} />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button type="button" variant="outline">
              Batal
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              type="button"
              className="bg-chart-2 text-white hover:bg-chart-2/90"
              disabled={disabled}
              onClick={onConfirm}
            >
              Selesai Section
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function SummaryItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border bg-muted/25 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold tabular-nums">{value}</p>
    </div>
  )
}

function createInitialAnswerMap(session: TryoutSectionRoomData): AnswerMap {
  const answers = Object.fromEntries(
    session.questions.map((question) => [question.id, createEmptyAnswer(question.id)]),
  ) as AnswerMap

  for (const answer of session.answers) {
    answers[answer.sessionQuestionId] = answer
  }

  return answers
}

function createEmptyAnswer(sessionQuestionId: number): TryoutRoomAnswer {
  return {
    sessionQuestionId,
    selectedOptionKeys: [],
    answerText: "",
    isMarkedForReview: false,
    isCorrect: null,
    score: null,
    maxScore: null,
    gradingStatus: "not_required",
    gradedAt: null,
  }
}

function isQuestionAnswered(answer: TryoutRoomAnswer | undefined) {
  if (!answer) {
    return false
  }

  return answer.selectedOptionKeys.length > 0 || answer.answerText.trim().length > 0
}

function getInitialRemainingSeconds(startedAt: string, durationMinutes: number) {
  const startedTime = new Date(startedAt).getTime()
  const endTime = startedTime + durationMinutes * 60 * 1000

  return Math.max(0, Math.floor((endTime - Date.now()) / 1000))
}

function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}
