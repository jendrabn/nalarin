"use client"

import {
  useEffect,
  useCallback,
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

  const answeredCount = useMemo(
    () => session.questions.filter((question) => isQuestionAnswered(answers[question.id])).length,
    [answers, session.questions],
  )
  const markedCount = useMemo(
    () => session.questions.filter((question) => answers[question.id]?.isMarkedForReview).length,
    [answers, session.questions],
  )
  const progressValue =
    session.questions.length > 0
      ? Math.round((answeredCount / session.questions.length) * 100)
      : 0
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

  useEffect(() => {
    if (session.sessionStatus !== "in_progress" || session.section.status !== "in_progress") {
      router.replace(`/tryout-sessions/${session.sessionId}`)
    }
  }, [router, session.section.status, session.sessionId, session.sessionStatus])

  useEffect(() => {
    if (remainingSeconds <= 0) {
      if (!hasAutoSubmittedRef.current) {
        hasAutoSubmittedRef.current = true
        toast.warning("Waktu section habis. Jawaban terakhir otomatis dikirim.")
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
      }
      return
    }

    const interval = window.setInterval(() => {
      setRemainingSeconds((current) => Math.max(0, current - 1))
    }, 1000)

    return () => window.clearInterval(interval)
  }, [
    activeQuestion,
    answers,
    persistAnswer,
    remainingSeconds,
    router,
    session.section.id,
    session.sessionId,
  ])

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
      const result = await setTryoutCurrentQuestionAction({
        sessionId: session.sessionId,
        sectionSessionId: session.section.id,
        orderIndex: targetQuestion.orderIndex,
      })

      if (!result.success) {
        toast.error(result.message)
      }
    })
  }

  function saveChoice(question: TryoutRoomQuestion, selectedOptionKeys: string[]) {
    const currentAnswer = getAnswer(question.id)
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
            <Progress value={progressValue} className="h-2 flex-1" />
            <div className="flex shrink-0 items-center gap-2">
              <p className="text-xs font-medium text-muted-foreground">{progressValue}%</p>
              <StatusPill icon={<ClockIcon />}>
                <span suppressHydrationWarning>{formatDuration(remainingSeconds)}</span>
              </StatusPill>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl items-start gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[18rem_minmax(0,1fr)] lg:px-8">
        <QuestionNavigation
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
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">
                    Soal {activeQuestion.displayOrder}/{session.questions.length}
                  </Badge>
                  <Badge variant="outline">
                    {questionTypeLabels[activeQuestion.question.type]}
                  </Badge>
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
                  aria-label={
                    activeAnswer.isMarkedForReview ? "Hapus tanda soal" : "Tandai soal"
                  }
                  title={activeAnswer.isMarkedForReview ? "Hapus tanda soal" : "Tandai soal"}
                >
                  <FlagIcon />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="flex flex-col gap-6 px-4 pb-5 pt-1 sm:px-5">
              <QuestionContent question={activeQuestion} />
              <AnswerControl
                question={activeQuestion}
                answer={activeAnswer}
                isPending={isPending}
                onChoiceChange={saveChoice}
                onTextChange={saveTextAnswer}
                onTextBlur={persistTextAnswer}
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
                  {isPending ? (
                    <Loader2Icon className="animate-spin text-muted-foreground" />
                  ) : null}
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
  questions,
  answers,
  activeIndex,
  highestReachableIndex,
  onSelect,
}: {
  questions: TryoutRoomQuestion[]
  answers: AnswerMap
  activeIndex: number
  highestReachableIndex: number
  onSelect: (index: number) => void
}) {
  return (
    <aside className="min-w-0 lg:self-start">
      <Card className="max-w-full gap-0 py-0 shadow-sm">
        <CardHeader className="px-4 py-4">
          <CardTitle className="text-sm font-semibold">Navigasi Soal</CardTitle>
        </CardHeader>
        <CardContent className="min-w-0 px-3 pb-3 pt-0">
          <div className="max-w-full overflow-x-auto pb-1 lg:overflow-visible lg:pb-0">
            <div className="grid w-max grid-flow-col auto-cols-[2.5rem] gap-2 pt-1.5 lg:w-auto lg:grid-flow-row lg:grid-cols-5">
              {questions.map((question, index) => {
                const answer = answers[question.id]
                const answered = isQuestionAnswered(answer)
                const flagged = Boolean(answer?.isMarkedForReview)
                const active = index === activeIndex
                const locked = index > highestReachableIndex

                return (
                  <button
                    key={question.id}
                    type="button"
                    onClick={() => onSelect(index)}
                    disabled={locked}
                    aria-current={active ? "step" : undefined}
                    aria-label={`Buka soal ${question.displayOrder}`}
                    className={cn(
                      "relative grid size-10 place-items-center rounded-lg border text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-45",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : answered
                          ? "border-primary/35 bg-primary/10 text-primary hover:bg-primary/15"
                          : "bg-background hover:bg-muted",
                    )}
                  >
                    {question.displayOrder}
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
            <LegendItem className="bg-primary/20" label="Terjawab" />
            <LegendItem className="bg-chart-3" label="Ditandai" />
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

function StatusPill({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 shadow-sm">
      <span className="text-primary [&_svg]:size-4">{icon}</span>
      <span className="text-sm font-semibold tabular-nums">{children}</span>
    </div>
  )
}

function QuestionContent({ question }: { question: TryoutRoomQuestion }) {
  return (
    <div className="flex flex-col gap-4">
      <div
        className="max-w-none text-base leading-8 text-foreground [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5"
        dangerouslySetInnerHTML={{ __html: question.question.content }}
      />
      {question.question.imageUrl ? (
        <div className="overflow-hidden rounded-lg border bg-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={question.question.imageUrl}
            alt=""
            className="max-h-[420px] w-full object-contain"
          />
        </div>
      ) : null}
    </div>
  )
}

function AnswerControl({
  question,
  answer,
  isPending,
  onChoiceChange,
  onTextChange,
  onTextBlur,
}: {
  question: TryoutRoomQuestion
  answer: TryoutRoomAnswer
  isPending: boolean
  onChoiceChange: (question: TryoutRoomQuestion, selectedOptionKeys: string[]) => void
  onTextChange: (question: TryoutRoomQuestion, answerText: string) => void
  onTextBlur: (question: TryoutRoomQuestion) => void
}) {
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
    if (isPending || optionKeys.length === 0) {
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
  }, [isPending, optionKeys, question.id])

  const selectHighlightedOption = useCallback(() => {
    if (isPending || !highlightedOptionKey) {
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
  }, [answer.selectedOptionKeys, highlightedOptionKey, isPending, onChoiceChange, question])

  useEffect(() => {
    function handleKeyboardShortcut(event: KeyboardEvent) {
      if (isPending || optionKeys.length === 0 || isShortcutIgnoredTarget(event.target)) {
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
    moveHighlight,
    onChoiceChange,
    optionKeys,
    question,
    selectHighlightedOption,
    setHighlightedOptionKey,
  ])

  if (question.question.type === "short_answer") {
    return (
      <div className="flex flex-col gap-2">
        <label className="text-base font-semibold" htmlFor={`answer-${question.id}`}>
          Jawaban
        </label>
        <Textarea
          id={`answer-${question.id}`}
          value={answer.answerText}
          placeholder="Tulis jawaban singkat kamu di sini."
          className="min-h-32 resize-y bg-background text-base"
          disabled={isPending}
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

          if (multiple) {
            return (
              <div
                key={`${question.id}-${option.label}`}
                className={cn(
                  "flex min-h-12 items-center gap-3 rounded-lg border bg-background p-3 text-base transition-colors",
                  isPending ? "opacity-100" : "hover:border-primary/35 hover:bg-muted/45",
                  selected && "border-primary bg-primary/10",
                  highlighted && "ring-3 ring-ring/35",
                )}
                onMouseEnter={() => setHighlightedOptionKey(option.label)}
              >
                <Checkbox
                  id={optionId}
                  checked={selected}
                  disabled={isPending}
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
                    isPending ? "cursor-default" : "cursor-pointer",
                  )}
                >
                  <span
                    className="block [&_p]:mb-2"
                    dangerouslySetInnerHTML={{ __html: option.content }}
                  />
                  {option.imageUrl ? (
                    <span className="block overflow-hidden rounded-md border bg-card">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={option.imageUrl}
                        alt=""
                        className="max-h-56 w-full object-contain"
                      />
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
              disabled={isPending}
              onClick={() => {
                setHighlightedOptionKey(option.label)
                onChoiceChange(question, [option.label])
              }}
              className={cn(
                "group flex min-h-12 items-center gap-3 rounded-lg border bg-background p-3 text-left text-base transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-100",
                selected
                  ? "border-primary bg-primary/10"
                  : "hover:border-primary/35 hover:bg-muted/45",
                highlighted && "ring-3 ring-ring/35",
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
                <span
                  className="block leading-7 [&_p]:mb-2"
                  dangerouslySetInnerHTML={{ __html: option.content }}
                />
                {option.imageUrl ? (
                  <span className="block overflow-hidden rounded-md border bg-card">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={option.imageUrl}
                      alt=""
                      className="max-h-56 w-full object-contain"
                    />
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
        Gunakan tombol ArrowUp/ArrowDown untuk pindah opsi, Enter untuk memilih, Esc untuk menghapus sorotan.
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
