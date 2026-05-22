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
  BookOpenCheckIcon,
  CheckCircle2Icon,
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
import { cn } from "@/lib/utils"

import {
  QuestionContent,
  QuestionExplanationPanel,
  QuestionNavigation,
  QuestionOptionField,
  QuestionStatusPill,
} from "@/features/question-room/components"

import {
  confirmPracticeAnswerAction,
  savePracticeAnswerAction,
  setPracticeCurrentQuestionAction,
  setPracticeQuestionFlagAction,
  submitPracticeSessionAction,
} from "../actions"
import type {
  PracticeMode,
  PracticeQuestionType,
  PracticeRoomAnswer,
  PracticeRoomData,
  PracticeRoomQuestion,
} from "../types"

type AnswerMap = Record<number, PracticeRoomAnswer>

const modeLabels: Record<PracticeMode, string> = {
  practice: "Mode Latihan",
  quiz: "Mode Quiz",
}

const questionTypeLabels: Record<PracticeQuestionType, string> = {
  multiple_choice: "Pilihan Ganda",
  multiple_answer: "Multi Jawaban",
  short_answer: "Isian Singkat",
  true_false: "Benar/Salah",
}

export function PracticeRoomPage({
  session,
  aiExplanationEnabled = false,
}: {
  session: PracticeRoomData
  aiExplanationEnabled?: boolean
}) {
  const router = useRouter()
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(
      0,
      session.questions.findIndex(
        (question) => question.orderIndex === session.currentQuestionOrder,
      ),
    ),
  )
  const [answers, setAnswers] = useState<AnswerMap>(() => createInitialAnswerMap(session))
  const [isFinishDialogOpen, setIsFinishDialogOpen] = useState(false)
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(() =>
    session.mode === "quiz" && session.durationMinutes
      ? getInitialRemainingSeconds(session.startedAt, session.durationMinutes)
      : null,
  )
  const [isPending, startTransition] = useTransition()
  const hasAutoSubmittedRef = useRef(false)
  const quizTimerRef = useRef<number | null>(null)
  const remainingSecondsRef = useRef<number | null>(remainingSeconds)

  const answeredCount = useMemo(
    () => session.questions.filter((question) => isQuestionAnswered(answers[question.id])).length,
    [answers, session.questions],
  )
  const confirmedCount = useMemo(
    () => session.questions.filter((question) => isAnswerLocked(answers[question.id])).length,
    [answers, session.questions],
  )
  const progressBase = session.mode === "practice" ? confirmedCount : answeredCount
  const progressValue =
    session.totalQuestions > 0 ? Math.round((progressBase / session.totalQuestions) * 100) : 0
  const highestReachableIndex = useMemo(() => {
    if (session.mode === "quiz") {
      return session.questions.length - 1
    }

    const firstUnconfirmedIndex = session.questions.findIndex(
      (question) => !isAnswerLocked(answers[question.id]),
    )

    if (firstUnconfirmedIndex === -1) {
      return session.questions.length - 1
    }

    return firstUnconfirmedIndex
  }, [answers, session.mode, session.questions])
  const activeQuestionIndex =
    session.mode === "practice" ? Math.min(activeIndex, highestReachableIndex) : activeIndex
  const activeQuestion = session.questions[activeQuestionIndex] ?? null
  const legendItems = useMemo(
    () =>
      session.mode === "practice"
        ? [
            { className: "bg-primary", label: "Aktif" },
            { className: "bg-chart-2", label: "Selesai" },
            { className: "bg-destructive", label: "Salah" },
          ]
        : [
            { className: "bg-primary", label: "Aktif" },
            { className: "bg-primary/20", label: "Terjawab" },
            { className: "bg-chart-3", label: "Ditandai" },
          ],
    [session.mode],
  )
  const navigatorItems = useMemo(
    () =>
      session.questions.map((question, index) => {
        const answer = answers[question.id]
        const answered = isQuestionAnswered(answer)
        const lockedAnswer = isAnswerLocked(answer)
        const wrongAnswer = session.mode === "practice" && lockedAnswer && answer?.isCorrect === false
        const active = index === activeQuestionIndex
        const locked = index > highestReachableIndex

        return {
          id: question.id,
          label: question.orderIndex,
          active,
          answered,
          locked,
          flagged: session.mode === "quiz" && Boolean(answer?.isMarkedForReview),
          status: wrongAnswer ? "wrong" : lockedAnswer ? "correct" : undefined,
          ariaLabel: `Buka soal ${question.orderIndex}`,
        } satisfies {
          id: number
          label: number
          active: boolean
          answered: boolean
          locked: boolean
          flagged: boolean
          status?: "correct" | "wrong" | "pending" | "unanswered"
          ariaLabel: string
        }
      }),
    [activeQuestionIndex, answers, highestReachableIndex, session.mode, session.questions],
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
        const result = await setPracticeCurrentQuestionAction({
          sessionId: session.id,
          orderIndex: targetQuestion.orderIndex,
        })

        if (!result.success) {
          toast.error(result.message)
        }
      })
    },
    [activeQuestionIndex, highestReachableIndex, session.id, session.questions, startTransition],
  )

  useEffect(() => {
    remainingSecondsRef.current = remainingSeconds
  }, [remainingSeconds])

  useEffect(() => {
    if (session.mode !== "quiz" || remainingSecondsRef.current === null || quizTimerRef.current !== null) {
      return
    }

    quizTimerRef.current = window.setInterval(() => {
      const current = remainingSecondsRef.current

      if (current === null) {
        return
      }

      if (current <= 1) {
        remainingSecondsRef.current = 0
        setRemainingSeconds(0)

        if (quizTimerRef.current !== null) {
          window.clearInterval(quizTimerRef.current)
          quizTimerRef.current = null
        }

        return
      }

      const next = current - 1
      remainingSecondsRef.current = next
      setRemainingSeconds(next)
    }, 1000)

    return () => {
      if (quizTimerRef.current !== null) {
        window.clearInterval(quizTimerRef.current)
        quizTimerRef.current = null
      }
    }
  }, [session.id, session.mode])

  useEffect(() => {
    if (session.mode !== "quiz" || remainingSeconds !== 0 || hasAutoSubmittedRef.current) {
      return
    }

    hasAutoSubmittedRef.current = true
    toast.warning("Waktu habis. Quiz otomatis disubmit.")

    if (quizTimerRef.current !== null) {
      window.clearInterval(quizTimerRef.current)
      quizTimerRef.current = null
    }

    startTransition(async () => {
      const result = await submitPracticeSessionAction({
        sessionId: session.id,
        autoSubmitted: true,
      })

      if (!result.success) {
        toast.error(result.message)
        return
      }

      router.replace(`/practice-sessions/${session.id}/result`)
    })
  }, [remainingSeconds, router, session.id, session.mode, startTransition])

  useEffect(() => {
    if (session.status !== "in_progress") {
      router.replace(`/practice-sessions/${session.id}/result`)
    }
  }, [router, session.id, session.status])

  function getAnswer(questionId: number) {
    return answers[questionId] ?? createEmptyAnswer(questionId)
  }

  function saveChoice(question: PracticeRoomQuestion, selectedOptionKeys: string[]) {
    const currentAnswer = getAnswer(question.id)

    if (session.mode === "practice" && isAnswerLocked(currentAnswer)) {
      return
    }

    setAnswers((current) => ({
      ...current,
      [question.id]: {
        ...currentAnswer,
        selectedOptionKeys,
        answerText: "",
      },
    }))

    startTransition(async () => {
      const result = await savePracticeAnswerAction({
        sessionId: session.id,
        sessionQuestionId: question.id,
        selectedOptionKeys,
      })

      if (!result.success) {
        toast.error(result.message)
      }
    })
  }

  function saveTextAnswer(question: PracticeRoomQuestion, answerText: string) {
    const currentAnswer = getAnswer(question.id)

    if (session.mode === "practice" && isAnswerLocked(currentAnswer)) {
      return
    }

    setAnswers((current) => ({
      ...current,
      [question.id]: {
        ...currentAnswer,
        answerText,
        selectedOptionKeys: [],
      },
    }))
  }

  function persistTextAnswer(question: PracticeRoomQuestion) {
    const answer = getAnswer(question.id)

    if (session.mode === "practice" && isAnswerLocked(answer)) {
      return
    }

    startTransition(async () => {
      const result = await savePracticeAnswerAction({
        sessionId: session.id,
        sessionQuestionId: question.id,
        answerText: answer.answerText,
      })

      if (!result.success) {
        toast.error(result.message)
      }
    })
  }

  function confirmAnswer(question: PracticeRoomQuestion) {
    const answer = getAnswer(question.id)

    startTransition(async () => {
      const result = await confirmPracticeAnswerAction({
        sessionId: session.id,
        sessionQuestionId: question.id,
        selectedOptionKeys: answer.selectedOptionKeys,
        answerText: answer.answerText,
      })

      if (!result.success) {
        toast.error(result.message)
        return
      }

      setAnswers((current) => ({
        ...current,
        [question.id]: {
          ...answer,
          isCorrect: result.data.isCorrect,
          score: result.data.score,
          maxScore: result.data.maxScore,
          gradingStatus: "graded",
          gradedAt: new Date().toISOString(),
        },
      }))
    })
  }

  function toggleFlag(question: PracticeRoomQuestion) {
    if (session.mode !== "quiz") {
      return
    }

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
      const result = await setPracticeQuestionFlagAction({
        sessionId: session.id,
        sessionQuestionId: question.id,
        isMarkedForReview: nextFlag,
      })

      if (!result.success) {
        toast.error(result.message)
      }
    })
  }

  function submitSession() {
    startTransition(async () => {
      const result = await submitPracticeSessionAction({ sessionId: session.id })

      if (!result.success) {
        toast.error(result.message)
        return
      }

      router.push(`/practice-sessions/${session.id}/result`)
    })
  }

  if (session.status !== "in_progress") {
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
  const canFinish = session.mode === "quiz" || confirmedCount === session.questions.length
  const unansweredCount = session.totalQuestions - answeredCount
  const practiceUnconfirmedCount = session.totalQuestions - confirmedCount
  const feedbackMode = session.mode === "practice" ? "practice" : "none"

  return (
    <main className="min-h-svh bg-muted/35">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2.5 px-4 py-2.5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <Badge variant="outline" className="gap-1.5 bg-primary/10 text-primary">
                {session.mode === "practice" ? <BookOpenCheckIcon /> : <AlarmClockIcon />}
                {modeLabels[session.mode]}
              </Badge>
              <span className="text-xs font-medium text-muted-foreground">
                {session.examTypeName} / {session.subjectName}
              </span>
            </div>
            <h1 className="min-w-0 max-w-full truncate text-left font-heading text-sm font-semibold tracking-normal text-foreground sm:max-w-[52%] sm:text-right sm:text-base">
              {session.title}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Progress value={progressValue} className="h-2 flex-1" />
            <div className="flex shrink-0 items-center gap-2">
              <p className="text-xs font-medium text-muted-foreground">{progressValue}%</p>
              {session.mode === "quiz" ? (
                <QuestionStatusPill icon={<ClockIcon />}>
                  <span suppressHydrationWarning>
                    {remainingSeconds === null ? "--:--" : formatDuration(remainingSeconds)}
                  </span>
                </QuestionStatusPill>
              ) : null}
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
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">
                      Soal {activeQuestion.orderIndex}/{session.totalQuestions}
                    </Badge>
                    <Badge variant="outline">{questionTypeLabels[activeQuestion.question.type]}</Badge>
                  </div>
                </div>

                {session.mode === "quiz" ? (
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
                ) : null}
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
                feedbackMode={feedbackMode}
                isPending={isPending}
                onChoiceChange={(selectedOptionKeys) => saveChoice(activeQuestion, selectedOptionKeys)}
                onTextChange={(answerText) => saveTextAnswer(activeQuestion, answerText)}
                onTextBlur={() => persistTextAnswer(activeQuestion)}
              />

              {session.mode === "practice" ? (
                <PracticeFeedback
                  question={activeQuestion}
                  answer={activeAnswer}
                  sessionId={session.id}
                  aiExplanationEnabled={aiExplanationEnabled}
                />
              ) : null}

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

                <div className={cn("flex min-w-fit justify-center", session.mode === "practice" && "sm:min-w-8")}>
                  {session.mode === "practice" && !isAnswerLocked(activeAnswer) ? (
                    <Button
                      type="button"
                      variant="outline-primary"
                      onClick={() => confirmAnswer(activeQuestion)}
                      disabled={!isQuestionAnswered(activeAnswer) || isPending}
                    >
                      <CheckCircle2Icon data-icon="inline-start" />
                      Konfirmasi
                    </Button>
                  ) : isPending ? (
                    <Loader2Icon className="animate-spin text-muted-foreground" />
                  ) : null}
                </div>

                <div className="flex min-w-fit justify-end">
                  <RoomPrimaryActions
                    activeIndex={activeQuestionIndex}
                    totalQuestions={session.questions.length}
                    highestReachableIndex={highestReachableIndex}
                    canFinish={canFinish}
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
        mode={session.mode}
        totalQuestions={session.totalQuestions}
        answeredCount={answeredCount}
        unansweredCount={unansweredCount}
        unconfirmedCount={practiceUnconfirmedCount}
        durationSeconds={getElapsedSeconds(session.startedAt)}
        disabled={!canFinish || isPending}
        onConfirm={submitSession}
      />
    </main>
  )
}

function RoomPrimaryActions({
  activeIndex,
  totalQuestions,
  highestReachableIndex,
  canFinish,
  isPending,
  onFinish,
  onNext,
}: {
  activeIndex: number
  totalQuestions: number
  highestReachableIndex: number
  canFinish: boolean
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
          disabled={!canFinish || isPending}
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

function PracticeFeedback({
  question,
  answer,
  sessionId,
  aiExplanationEnabled,
}: {
  question: PracticeRoomQuestion
  answer: PracticeRoomAnswer
  sessionId: number
  aiExplanationEnabled: boolean
}) {
  if (!isAnswerLocked(answer)) {
    return null
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-muted/25 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span
          className={cn(
            "inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
            answer.isCorrect
              ? "border-chart-2/35 bg-chart-2/10 text-chart-2"
              : "border-destructive/35 bg-destructive/10 text-destructive",
          )}
        >
          <FileTextIcon className="size-3.5" />
          {answer.isCorrect ? "Jawaban Benar" : "Jawaban Belum Tepat"}
        </span>
      </div>

      <QuestionExplanationPanel
        question={question}
        aiExplanation={{
          enabled: aiExplanationEnabled,
          sessionType: "practice",
          sessionId,
          sessionQuestionId: question.id,
        }}
        emptyTitle="Pembahasan belum tersedia"
        emptyDescription="Jawaban sudah terkunci, tetapi pembahasan untuk soal ini belum diisi."
      />
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
        <EmptyDescription>Sesi ini belum memiliki snapshot soal yang dapat dikerjakan.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

function FinishDialog({
  open,
  onOpenChange,
  mode,
  totalQuestions,
  answeredCount,
  unansweredCount,
  unconfirmedCount,
  durationSeconds,
  disabled,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: PracticeMode
  totalQuestions: number
  answeredCount: number
  unansweredCount: number
  unconfirmedCount: number
  durationSeconds: number
  disabled: boolean
  onConfirm: () => void
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Selesaikan {modeLabels[mode]}?</AlertDialogTitle>
          <AlertDialogDescription>
            Periksa ringkasan pengerjaan sebelum mengirim jawaban.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <SummaryItem label="Total soal" value={totalQuestions} />
          <SummaryItem label="Total dijawab" value={answeredCount} />
          <SummaryItem label="Belum dijawab" value={unansweredCount} />
          <SummaryItem label="Waktu" value={formatDuration(durationSeconds)} />
          {mode === "practice" ? <SummaryItem label="Belum dikonfirmasi" value={unconfirmedCount} /> : null}
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
              Selesai
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

function createInitialAnswerMap(session: PracticeRoomData): AnswerMap {
  const answers = Object.fromEntries(
    session.questions.map((question) => [question.id, createEmptyAnswer(question.id)]),
  ) as AnswerMap

  for (const answer of session.answers) {
    answers[answer.sessionQuestionId] = answer
  }

  return answers
}

function createEmptyAnswer(sessionQuestionId: number): PracticeRoomAnswer {
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

function isQuestionAnswered(answer: PracticeRoomAnswer | undefined) {
  if (!answer) {
    return false
  }

  return answer.selectedOptionKeys.length > 0 || answer.answerText.trim().length > 0
}

function isAnswerLocked(answer: PracticeRoomAnswer | undefined) {
  return Boolean(answer?.gradedAt)
}

function getInitialRemainingSeconds(startedAt: string, durationMinutes: number) {
  const startedTime = new Date(startedAt).getTime()
  const endTime = startedTime + durationMinutes * 60 * 1000

  return Math.max(0, Math.floor((endTime - Date.now()) / 1000))
}

function getElapsedSeconds(startedAt: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000))
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
