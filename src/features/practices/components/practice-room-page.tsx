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
  CircleIcon,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

import {
  confirmPracticeAnswerAction,
  savePracticeAnswerAction,
  setPracticeCurrentQuestionAction,
  setPracticeQuestionFlagAction,
  submitPracticeSessionAction,
} from "../actions"
import type {
  PracticeMode,
  PracticeQuestionSnapshot,
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
  essay: "Esai",
  true_false: "Benar/Salah",
}

export function PracticeRoomPage({ session }: { session: PracticeRoomData }) {
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
  const [explanationOpen, setExplanationOpen] = useState<Record<number, boolean>>({})
  const [isFinishDialogOpen, setIsFinishDialogOpen] = useState(false)
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(() =>
    session.mode === "quiz" && session.durationMinutes
      ? getInitialRemainingSeconds(session.startedAt, session.durationMinutes)
      : null,
  )
  const [isPending, startTransition] = useTransition()
  const hasAutoSubmittedRef = useRef(false)

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

  useEffect(() => {
    if (remainingSeconds === null || session.mode !== "quiz") {
      return
    }

    if (remainingSeconds <= 0) {
      if (!hasAutoSubmittedRef.current) {
        hasAutoSubmittedRef.current = true
        toast.warning("Waktu habis. Quiz otomatis disubmit.")
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
      }
      return
    }

    const interval = window.setInterval(() => {
      setRemainingSeconds((current) => (current === null ? null : Math.max(0, current - 1)))
    }, 1000)

    return () => window.clearInterval(interval)
  }, [remainingSeconds, router, session.id, session.mode])

  useEffect(() => {
    if (session.status !== "in_progress") {
      router.replace(`/practice-sessions/${session.id}/result`)
    }
  }, [router, session.id, session.status])

  function getAnswer(questionId: number) {
    return answers[questionId] ?? createEmptyAnswer(questionId)
  }

  function moveToQuestion(index: number) {
    if (index < 0 || index >= session.questions.length || index > highestReachableIndex) {
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
  }

  function saveChoice(question: PracticeRoomQuestion, selectedOptionKeys: string[]) {
    const currentAnswer = getAnswer(question.id)

    if (session.mode === "practice" && isAnswerLocked(currentAnswer)) {
      return
    }

    const nextAnswer = {
      ...currentAnswer,
      selectedOptionKeys,
      answerText: "",
    }

    setAnswers((current) => ({
      ...current,
      [question.id]: nextAnswer,
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
        <Empty className="max-w-md border bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileTextIcon />
            </EmptyMedia>
            <EmptyTitle>Belum ada soal</EmptyTitle>
            <EmptyDescription>
              Sesi ini belum memiliki snapshot soal yang dapat dikerjakan.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </main>
    )
  }

  const activeAnswer = getAnswer(activeQuestion.id)
  const canFinish =
    session.mode === "quiz" || confirmedCount === session.questions.length
  const unansweredCount = session.totalQuestions - answeredCount
  const practiceUnconfirmedCount = session.totalQuestions - confirmedCount

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
                <StatusPill icon={<ClockIcon />}>
                  <span suppressHydrationWarning>
                    {remainingSeconds === null ? "--:--" : formatDuration(remainingSeconds)}
                  </span>
                </StatusPill>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl items-start gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[18rem_minmax(0,1fr)] lg:px-8">
        <QuestionNavigation
          mode={session.mode}
          questions={session.questions}
          answers={answers}
          activeIndex={activeQuestionIndex}
          highestReachableIndex={highestReachableIndex}
          onSelect={moveToQuestion}
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
                    <Badge variant="outline">
                      {questionTypeLabels[activeQuestion.question.type]}
                    </Badge>
                  </div>
                </div>

                {session.mode === "quiz" ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className={activeAnswer.isMarkedForReview ? "bg-chart-3/10 text-chart-3 hover:bg-chart-3/15" : undefined}
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
              <QuestionContent question={activeQuestion} />
              <AnswerControl
                mode={session.mode}
                question={activeQuestion}
                answer={activeAnswer}
                isPending={isPending}
                onChoiceChange={saveChoice}
                onTextChange={saveTextAnswer}
                onTextBlur={persistTextAnswer}
              />

              {session.mode === "practice" ? (
                <PracticeFeedback
                  question={activeQuestion}
                  answer={activeAnswer}
                  explanationOpen={Boolean(explanationOpen[activeQuestion.id])}
                  onToggleExplanation={() =>
                    setExplanationOpen((current) => ({
                      ...current,
                      [activeQuestion.id]: !current[activeQuestion.id],
                    }))
                  }
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
                  {session.mode === "practice" || session.mode === "quiz" ? (
                    <RoomPrimaryActions
                      mode={session.mode}
                      showConfirm={false}
                      activeIndex={activeQuestionIndex}
                      totalQuestions={session.questions.length}
                      highestReachableIndex={highestReachableIndex}
                      activeAnswer={activeAnswer}
                      canFinish={canFinish}
                      isPending={isPending}
                      onConfirm={() => confirmAnswer(activeQuestion)}
                      onFinish={() => setIsFinishDialogOpen(true)}
                      onNext={() => moveToQuestion(activeQuestionIndex + 1)}
                    />
                  ) : isPending ? (
                    <Loader2Icon className="animate-spin text-muted-foreground" />
                  ) : null}
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

function StatusPill({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 shadow-sm">
      <span className="text-primary [&_svg]:size-4">{icon}</span>
      <span className="text-sm font-semibold tabular-nums">{children}</span>
    </div>
  )
}

function RoomPrimaryActions({
  mode,
  showConfirm = true,
  activeIndex,
  totalQuestions,
  highestReachableIndex,
  activeAnswer,
  canFinish,
  isPending,
  onConfirm,
  onFinish,
  onNext,
}: {
  mode: PracticeMode
  showConfirm?: boolean
  activeIndex: number
  totalQuestions: number
  highestReachableIndex: number
  activeAnswer: PracticeRoomAnswer
  canFinish: boolean
  isPending: boolean
  onConfirm: () => void
  onFinish: () => void
  onNext: () => void
}) {
  return (
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
      {showConfirm && mode === "practice" && !isAnswerLocked(activeAnswer) ? (
        <Button
          type="button"
          variant="outline-primary"
          onClick={onConfirm}
          disabled={!isQuestionAnswered(activeAnswer) || isPending}
        >
          <CheckCircle2Icon data-icon="inline-start" />
          Konfirmasi
        </Button>
      ) : null}

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
          disabled={
            activeIndex >= totalQuestions - 1 ||
            activeIndex + 1 > highestReachableIndex ||
            isPending
          }
        >
          Berikutnya
          <ArrowRightIcon data-icon="inline-end" />
        </Button>
      )}
    </div>
  )
}

function QuestionNavigation({
  mode,
  questions,
  answers,
  activeIndex,
  highestReachableIndex,
  onSelect,
}: {
  mode: PracticeMode
  questions: PracticeRoomQuestion[]
  answers: AnswerMap
  activeIndex: number
  highestReachableIndex: number
  onSelect: (index: number) => void
}) {
  return (
    <aside className="min-w-0 lg:self-start">
      <Card className="max-w-full gap-0 py-0 shadow-sm">
        <CardHeader className="px-4 py-4">
          <CardTitle className="text-sm font-semibold">
            Navigasi Soal
          </CardTitle>
        </CardHeader>
        <CardContent className="min-w-0 px-3 pb-3 pt-0">
          <div className="max-w-full overflow-x-auto pb-1 lg:overflow-visible lg:pb-0">
            <div className="grid w-max grid-flow-col auto-cols-[2.5rem] gap-2 pt-1.5 lg:w-auto lg:grid-flow-row lg:grid-cols-5">
              {questions.map((question, index) => {
                const answer = answers[question.id]
                const answered = isQuestionAnswered(answer)
                const lockedAnswer = isAnswerLocked(answer)
                const wrongAnswer = mode === "practice" && lockedAnswer && answer?.isCorrect === false
                const flagged = mode === "quiz" && Boolean(answer?.isMarkedForReview)
                const active = index === activeIndex
                const locked = index > highestReachableIndex

                return (
                  <button
                    key={question.id}
                    type="button"
                    onClick={() => onSelect(index)}
                    disabled={locked}
                    aria-current={active ? "step" : undefined}
                    className={cn(
                      "relative grid size-10 place-items-center rounded-lg border text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-45",
                      wrongAnswer
                        ? active
                          ? "border-destructive bg-destructive text-white"
                          : "border-destructive/35 bg-destructive/10 text-destructive hover:bg-destructive/15"
                        : active
                        ? "border-primary bg-primary text-primary-foreground"
                        : lockedAnswer
                          ? "border-chart-2/35 bg-chart-2/10 text-chart-2 hover:bg-chart-2/15"
                          : answered
                            ? "border-primary/35 bg-primary/10 text-primary hover:bg-primary/15"
                            : "bg-background hover:bg-muted",
                    )}
                  >
                    {question.orderIndex}
                    {flagged ? (
                      <span className="absolute -right-1 -top-1 size-2.5 rounded-full bg-chart-3 ring-2 ring-card" />
                    ) : null}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3 text-[0.72rem] text-muted-foreground">
            <LegendItem className="bg-primary" label="Aktif" />
            <LegendItem className={mode === "practice" ? "bg-chart-2" : "bg-primary/20"} label={mode === "practice" ? "Selesai" : "Terjawab"} />
            {mode === "practice" ? (
              <LegendItem className="bg-destructive" label="Salah" />
            ) : (
              <LegendItem className="bg-chart-3" label="Ditandai" />
            )}
          </div>
        </CardContent>
      </Card>
    </aside>
  )
}

function LegendItem({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("size-2 rounded-full", className)} />
      {label}
    </span>
  )
}

function QuestionContent({ question }: { question: PracticeRoomQuestion }) {
  return (
    <div className="flex flex-col gap-4">
      <div
        className="max-w-none text-base leading-8 text-foreground [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5"
        dangerouslySetInnerHTML={{ __html: question.question.content }}
      />
      {question.question.imageUrl ? (
        <div className="overflow-hidden rounded-lg border bg-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={question.question.imageUrl} alt="" className="max-h-[420px] w-full object-contain" />
        </div>
      ) : null}
    </div>
  )
}

function AnswerControl({
  mode,
  question,
  answer,
  isPending,
  onChoiceChange,
  onTextChange,
  onTextBlur,
}: {
  mode: PracticeMode
  question: PracticeRoomQuestion
  answer: PracticeRoomAnswer
  isPending: boolean
  onChoiceChange: (question: PracticeRoomQuestion, selectedOptionKeys: string[]) => void
  onTextChange: (question: PracticeRoomQuestion, answerText: string) => void
  onTextBlur: (question: PracticeRoomQuestion) => void
}) {
  const locked = mode === "practice" && isAnswerLocked(answer)
  const [highlightedOption, setHighlightedOption] = useState<{
    questionId: number
    optionKey: string | null
  } | null>(null)
  const optionKeys = useMemo(() => question.options.map((option) => option.label), [question.options])
  const highlightedOptionKey =
    highlightedOption?.questionId === question.id ? highlightedOption.optionKey : null

  const setHighlightedOptionKey = useCallback((optionKey: string | null) => {
    setHighlightedOption({ questionId: question.id, optionKey })
  }, [question.id])

  const moveHighlight = useCallback((direction: 1 | -1) => {
    if (locked || isPending || optionKeys.length === 0) {
      return
    }

    setHighlightedOption((current) => {
      const currentKey = current?.questionId === question.id ? current.optionKey : null
      const currentIndex = currentKey ? optionKeys.indexOf(currentKey) : -1
      const fallbackIndex = direction === 1 ? 0 : optionKeys.length - 1
      const nextIndex =
        currentIndex === -1
          ? fallbackIndex
          : (currentIndex + direction + optionKeys.length) % optionKeys.length

      return {
        questionId: question.id,
        optionKey: optionKeys[nextIndex] ?? null,
      }
    })
  }, [isPending, locked, optionKeys, question.id])

  const selectHighlightedOption = useCallback(() => {
    if (locked || isPending || !highlightedOptionKey) {
      return
    }

    if (question.question.type === "multiple_answer") {
      const nextKeys = answer.selectedOptionKeys.includes(highlightedOptionKey)
        ? answer.selectedOptionKeys.filter((key) => key !== highlightedOptionKey)
        : [...answer.selectedOptionKeys, highlightedOptionKey]

      onChoiceChange(question, nextKeys)
      return
    }

    onChoiceChange(question, [highlightedOptionKey])
  }, [answer.selectedOptionKeys, highlightedOptionKey, isPending, locked, onChoiceChange, question])

  useEffect(() => {
    function handleKeyboardShortcut(event: KeyboardEvent) {
      if (locked || isPending || optionKeys.length === 0 || isShortcutIgnoredTarget(event.target)) {
        return
      }

      if (event.key === "ArrowDown") {
        event.preventDefault()
        moveHighlight(1)
        return
      }

      if (event.key === "ArrowUp") {
        event.preventDefault()
        moveHighlight(-1)
        return
      }

      if (event.key === "Enter") {
        event.preventDefault()
        selectHighlightedOption()
        return
      }

      if (event.key === "Escape") {
        event.preventDefault()
        setHighlightedOptionKey(null)
      }
    }

    window.addEventListener("keydown", handleKeyboardShortcut)

    return () => {
      window.removeEventListener("keydown", handleKeyboardShortcut)
    }
  }, [
    answer.selectedOptionKeys,
    highlightedOptionKey,
    isPending,
    locked,
    moveHighlight,
    onChoiceChange,
    optionKeys,
    question,
    selectHighlightedOption,
    setHighlightedOptionKey,
  ])

  if (question.question.type === "short_answer" || question.question.type === "essay") {
    return (
      <div className="flex flex-col gap-2">
        <label className="text-base font-semibold" htmlFor={`answer-${question.id}`}>
          Jawaban
        </label>
        <Textarea
          id={`answer-${question.id}`}
          value={answer.answerText}
          placeholder={question.question.type === "essay" ? "Tulis jawaban esai kamu di sini." : "Tulis jawaban singkat kamu di sini."}
          className="min-h-32 resize-y bg-background text-base"
          disabled={isPending || locked}
          onChange={(event) => onTextChange(question, event.target.value)}
          onBlur={() => onTextBlur(question)}
        />
      </div>
    )
  }

  if (question.options.length === 0) {
    return (
      <Empty className="border bg-muted/30 py-8">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileTextIcon />
          </EmptyMedia>
          <EmptyTitle>Opsi belum tersedia</EmptyTitle>
          <EmptyDescription>Soal ini belum memiliki opsi jawaban.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div
      className="flex flex-col gap-3"
      aria-describedby={`answer-keyboard-help-${question.id}`}
    >
      <div className="grid gap-2">
        {question.options.map((option) => {
          const selected = answer.selectedOptionKeys.includes(option.label)
          const multiple = question.question.type === "multiple_answer"
          const optionId = `option-${question.id}-${option.label}`
          const highlighted = highlightedOptionKey === option.label
          const feedbackClass = getFeedbackClass({
            mode,
            locked,
            selected,
            isCorrectOption: isCorrectOptionForQuestion(question, option.label, option.content),
            isAnswerCorrect: answer.isCorrect,
          })

          if (multiple) {
            return (
              <div
                key={`${question.id}-${option.label}`}
                className={cn(
                  "flex min-h-12 items-center gap-3 rounded-lg border bg-background p-3 text-base transition-colors",
                  locked || isPending ? "opacity-100" : "hover:border-primary/35 hover:bg-muted/45",
                  feedbackClass ?? (selected && "border-primary bg-primary/10"),
                  highlighted && !locked && "ring-3 ring-ring/35",
                )}
                onMouseEnter={() => setHighlightedOptionKey(option.label)}
              >
                <Checkbox
                  id={optionId}
                  checked={selected}
                  disabled={isPending || locked}
                  aria-label={`Pilih opsi ${option.label}`}
                  onFocus={() => setHighlightedOptionKey(option.label)}
                  onCheckedChange={(checked) => {
                    setHighlightedOptionKey(option.label)
                    const nextKeys =
                      checked === true
                        ? [...answer.selectedOptionKeys, option.label]
                        : answer.selectedOptionKeys.filter((key) => key !== option.label)

                    onChoiceChange(question, nextKeys)
                  }}
                />
                <label
                  htmlFor={optionId}
                  className={cn(
                    "min-w-0 flex-1 space-y-2 leading-7",
                    isPending || locked ? "cursor-default" : "cursor-pointer",
                  )}
                >
                  <span
                    className="block [&_p]:mb-2"
                    dangerouslySetInnerHTML={{ __html: option.content }}
                  />
                  {option.imageUrl ? (
                    <span className="block overflow-hidden rounded-md border bg-card">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={option.imageUrl} alt="" className="max-h-56 w-full object-contain" />
                    </span>
                  ) : null}
                </label>
              </div>
            )
          }

          return (
            <button
              key={`${question.id}-${option.label}`}
              type="button"
              disabled={isPending || locked}
              onClick={() => {
                setHighlightedOptionKey(option.label)
                onChoiceChange(question, [option.label])
              }}
              className={cn(
                "group flex min-h-12 items-center gap-3 rounded-lg border bg-background p-3 text-left text-base transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-100",
                feedbackClass ??
                  (selected ? "border-primary bg-primary/10" : "hover:border-primary/35 hover:bg-muted/45"),
                highlighted && !locked && "ring-3 ring-ring/35",
              )}
              onFocus={() => setHighlightedOptionKey(option.label)}
              onMouseEnter={() => setHighlightedOptionKey(option.label)}
            >
              <span
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-full border text-xs font-semibold",
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground group-hover:border-primary/45",
                )}
              >
                {option.label || <CircleIcon />}
              </span>
              <span className="min-w-0 flex-1 space-y-2">
                <span className="block leading-7 [&_p]:mb-2" dangerouslySetInnerHTML={{ __html: option.content }} />
                {option.imageUrl ? (
                  <span className="block overflow-hidden rounded-md border bg-card">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={option.imageUrl} alt="" className="max-h-56 w-full object-contain" />
                  </span>
                ) : null}
              </span>
            </button>
          )
        })}
      </div>
      <p
        id={`answer-keyboard-help-${question.id}`}
        className="text-center text-xs text-muted-foreground"
      >
        Gunakan tombol ↑↓ untuk pindah opsi, Enter untuk memilih, Esc untuk menghapus sorotan.
      </p>
    </div>
  )
}

function isShortcutIgnoredTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  if (target.closest('[role="dialog"], [role="alertdialog"]')) {
    return true
  }

  const tagName = target.tagName.toLowerCase()

  return (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select" ||
    target.isContentEditable
  )
}

function PracticeFeedback({
  question,
  answer,
  explanationOpen,
  onToggleExplanation,
}: {
  question: PracticeRoomQuestion
  answer: PracticeRoomAnswer
  explanationOpen: boolean
  onToggleExplanation: () => void
}) {
  if (!isAnswerLocked(answer)) {
    return null
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-muted/25 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Badge
          variant="outline"
          className={cn(
            answer.isCorrect
              ? "border-chart-2/30 bg-chart-2/10 text-chart-2"
              : "border-destructive/30 bg-destructive/10 text-destructive",
          )}
        >
          {answer.isCorrect ? "Jawaban Benar" : "Jawaban Belum Tepat"}
        </Badge>
        <Button type="button" variant="outline" size="sm" onClick={onToggleExplanation}>
          <FileTextIcon data-icon="inline-start" />
          Pembahasan
        </Button>
      </div>

      {explanationOpen ? (
        hasExplanationContent(question.question) ? (
          <ExplanationContent question={question.question} />
        ) : (
          <Empty className="border bg-background py-8">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileTextIcon />
              </EmptyMedia>
              <EmptyTitle>Pembahasan belum tersedia</EmptyTitle>
              <EmptyDescription>
                Jawaban sudah terkunci, tetapi pembahasan untuk soal ini belum diisi.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )
      ) : null}
    </div>
  )
}

function ExplanationContent({ question }: { question: PracticeQuestionSnapshot }) {
  const explanations = getExplanationItems(question)

  return (
    <div className="flex flex-col gap-3">
      {explanations.map((item) => (
        <section key={item.label} className="rounded-lg border bg-background p-4">
          <h3 className="mb-2 text-sm font-semibold">{item.label}</h3>
          <div
            className="text-sm leading-7 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5"
            dangerouslySetInnerHTML={{ __html: item.content }}
          />
        </section>
      ))}
    </div>
  )
}

function hasExplanationContent(question: PracticeQuestionSnapshot) {
  return getExplanationItems(question).length > 0
}

function getExplanationItems(question: PracticeQuestionSnapshot) {
  const items: Array<{ label: string; content: string }> = []

  if (question.manualExplanation) {
    items.push({ label: "Pembahasan Manual", content: question.manualExplanation })
  }

  if (question.aiExplanation) {
    items.push({ label: "Pembahasan AI", content: question.aiExplanation })
  }

  if (items.length === 0 && question.explanation) {
    items.push({ label: "Pembahasan", content: question.explanation })
  }

  return items
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
          {mode === "practice" ? (
            <SummaryItem label="Belum dikonfirmasi" value={unconfirmedCount} />
          ) : null}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button type="button" variant="outline">
              Batal
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button type="button" className="bg-chart-2 text-white hover:bg-chart-2/90" disabled={disabled} onClick={onConfirm}>
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

function getFeedbackClass({
  mode,
  locked,
  selected,
  isCorrectOption,
  isAnswerCorrect,
}: {
  mode: PracticeMode
  locked: boolean
  selected: boolean
  isCorrectOption: boolean
  isAnswerCorrect: boolean | null
}) {
  if (mode !== "practice" || !locked) {
    return null
  }

  const answerIsCorrect = isAnswerCorrect === true
  const answerIsWrong = isAnswerCorrect === false

  if (selected && answerIsCorrect) {
    return "border-chart-2/35 bg-chart-2/10"
  }

  if (answerIsWrong && isCorrectOption) {
    return "border-primary/35 bg-primary/10"
  }

  if (selected && answerIsWrong) {
    return "border-destructive/35 bg-destructive/10"
  }

  return "opacity-70"
}

function isCorrectOptionForQuestion(
  question: PracticeRoomQuestion,
  optionLabel: string,
  optionContent: string,
) {
  if (question.question.type !== "true_false") {
    return question.correctAnswer.optionKeys.includes(optionLabel)
  }

  const normalizedCorrectAnswer = normalizeText(question.correctAnswer.answerText)
  const normalizedOption = normalizeText(`${optionLabel} ${optionContent}`)

  if (
    normalizedCorrectAnswer === "true" ||
    normalizedCorrectAnswer === "benar" ||
    normalizedCorrectAnswer === "a"
  ) {
    return optionLabel === "A" || normalizedOption.includes("true") || normalizedOption.includes("benar")
  }

  if (
    normalizedCorrectAnswer === "false" ||
    normalizedCorrectAnswer === "salah" ||
    normalizedCorrectAnswer === "b"
  ) {
    return optionLabel === "B" || normalizedOption.includes("false") || normalizedOption.includes("salah")
  }

  return question.correctAnswer.optionKeys.includes(optionLabel)
}

function normalizeText(value: string | null | undefined) {
  return value?.trim().replace(/\s+/g, " ").toLowerCase() ?? ""
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
