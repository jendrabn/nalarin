"use client"

import Link from "next/link"
import type { PointerEvent } from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  ArrowLeftIcon,
  CheckIcon,
  LightbulbIcon,
  Settings2Icon,
  XIcon,
  RotateCcwIcon,
  SparklesIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { cn } from "@/lib/utils"

import { vocabularyGameTypeLabels } from "../constants"
import {
  buildVocabularyGameSearchParams,
  getVocabularyGameAccuracy,
} from "../utils"
import type {
  VocabularyGameAnswer,
  VocabularyGameSession,
} from "../types"

type VocabularyPlayPageProps = {
  session: VocabularyGameSession
}

type AnswerFeedback = {
  side: "left" | "right"
  isCorrect: boolean
  selectedMeaning: string
}

type DragState = {
  x: number
  y: number
}

const swipeThreshold = 0.3
const advanceQuestionDelayMs = 1000
const maxSwipeDistanceRatio = 0.75
const maxSwipeDistancePx = 300

export function VocabularyPlayPage({ session }: VocabularyPlayPageProps) {
  return <VocabularyGameStage session={session} />
}

function VocabularyGameStage({ session }: { session: VocabularyGameSession }) {
  if (session.totalQuestions === 0) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <Empty className="w-full">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SparklesIcon />
            </EmptyMedia>
            <EmptyTitle>Belum Ada Kosakata Yang Cocok</EmptyTitle>
            <EmptyDescription>
              Coba ubah konfigurasi agar sistem menemukan sesi kosakata yang tersedia.
            </EmptyDescription>
          </EmptyHeader>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <Button asChild>
              <Link href="/vocabulary">
                <Settings2Icon data-icon="inline-start" />
                Ubah Konfigurasi
              </Link>
            </Button>
          </div>
        </Empty>
      </main>
    )
  }

  return <VocabularyGamePlayer session={session} />
}

function VocabularyGamePlayer({ session }: { session: VocabularyGameSession }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [dragState, setDragState] = useState<DragState>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null)
  const [answers, setAnswers] = useState<VocabularyGameAnswer[]>([])
  const [correctCount, setCorrectCount] = useState(0)
  const [wrongCount, setWrongCount] = useState(0)
  const [showExampleSentence, setShowExampleSentence] = useState(false)
  const [sessionKey] = useState(() => String(Date.now()))
  const pointerRef = useRef<{
    pointerId: number | null
    startX: number
    startY: number
    width: number
  }>({
    pointerId: null,
    startX: 0,
    startY: 0,
    width: 1,
  })
  const timeoutRef = useRef<number | null>(null)

  const activeQuestion = session.questions[currentIndex] ?? null
  const answeredCount = answers.length
  const correctPercent = getVocabularyGameAccuracy(correctCount, answeredCount)
  const progressPercent =
    session.totalQuestions === 0 ? 0 : Math.min((answeredCount / session.totalQuestions) * 100, 100)
  const finished = currentIndex >= session.totalQuestions || activeQuestion === null
  const restartHref = useMemo(
    () => `/vocabulary/play?${buildVocabularyGameSearchParams(session.config, sessionKey)}`,
    [session.config, sessionKey],
  )
  const configHref = useMemo(
    () => `/vocabulary?${buildVocabularyGameSearchParams(session.config)}`,
    [session.config],
  )

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const clearActiveTimer = () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  const advanceQuestion = () => {
    clearActiveTimer()
    setDragState({ x: 0, y: 0 })
    setIsDragging(false)
    setIsLocked(false)
    setFeedback(null)
    setShowExampleSentence(false)
    setCurrentIndex((value) => value + 1)
  }

  const commitAnswer = (side: "left" | "right") => {
    if (!activeQuestion || isLocked) {
      return
    }

    const selectedMeaning = side === "left" ? activeQuestion.leftOption : activeQuestion.rightOption
    const isCorrect = side === activeQuestion.correctSide

    setIsLocked(true)
    setAnswers((value) => [
      ...value,
      {
        questionId: activeQuestion.vocabularyId,
        selectedSide: side,
        isCorrect,
      },
    ])
    setFeedback({
      side,
      isCorrect,
      selectedMeaning,
    })
    setDragState({ x: 0, y: 0 })

    if (isCorrect) {
      setCorrectCount((value) => value + 1)
    } else {
      setWrongCount((value) => value + 1)
    }

    clearActiveTimer()
    timeoutRef.current = window.setTimeout(() => {
      advanceQuestion()
    }, advanceQuestionDelayMs)
  }

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!activeQuestion || isLocked) {
      return
    }

    const rect = event.currentTarget.getBoundingClientRect()
    pointerRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      width: Math.max(rect.width, 1),
    }

    setIsDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!isDragging || pointerRef.current.pointerId !== event.pointerId || !activeQuestion || isLocked) {
      return
    }

    const deltaX = event.clientX - pointerRef.current.startX
    const maxDragDistance = Math.min(
      pointerRef.current.width * maxSwipeDistanceRatio,
      maxSwipeDistancePx,
    )

    setDragState({
      x: Math.max(Math.min(deltaX, maxDragDistance), -maxDragDistance),
      y: 0,
    })
  }

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (pointerRef.current.pointerId !== event.pointerId) {
      return
    }

    const width = Math.max(pointerRef.current.width, 1)
    const ratio = Math.abs(dragState.x) / width
    const direction = dragState.x < 0 ? "left" : "right"

    setIsDragging(false)
    pointerRef.current.pointerId = null

    if (ratio >= swipeThreshold) {
      commitAnswer(direction)
      return
    }

    setDragState({ x: 0, y: 0 })
  }

  const handlePointerCancel = (event: PointerEvent<HTMLDivElement>) => {
    if (pointerRef.current.pointerId !== event.pointerId) {
      return
    }

    pointerRef.current.pointerId = null
    setIsDragging(false)
    setDragState({ x: 0, y: 0 })
  }

  if (finished) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-xl items-center px-4 py-6 sm:px-6 lg:px-8">
        <div className="w-full space-y-4">
        <div className="flex items-center gap-3">
            <Button asChild variant="ghost">
              <Link href={configHref} aria-label="Back to vocabulary config">
                <ArrowLeftIcon />
                Kembali
              </Link>
            </Button>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-border/70 bg-card/95 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.2)] backdrop-blur dark:shadow-[0_24px_60px_-34px_rgba(0,0,0,0.45)]">
            <div className="space-y-5 p-5 sm:p-6">
              <div className="space-y-5 text-center">
                <div className="text-5xl font-black tracking-tight text-foreground sm:text-6xl">
                  {correctPercent}%
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <SummaryTile label="Benar" value={correctCount.toString()} tone="emerald" />
                  <SummaryTile label="Salah" value={wrongCount.toString()} tone="rose" />
                  <SummaryTile label="Total" value={answeredCount.toString()} tone="violet" />
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <Button asChild size="lg" className="h-11 w-full rounded-full">
                  <Link href={restartHref}>
                    <RotateCcwIcon data-icon="inline-start" />
                    Main Lagi
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-11 w-full rounded-full">
                  <Link href={configHref}>
                    <Settings2Icon data-icon="inline-start" />
                    Ubah Konfigurasi
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (!activeQuestion) {
    return null
  }

  const cardTransform = `translate3d(${dragState.x}px, ${dragState.y}px, 0) rotate(${Math.max(
    Math.min(dragState.x / 22, 12),
    -12,
  )}deg)`
  const currentMeaning = activeQuestion.correctMeaning
  const cardTone = feedback
    ? feedback.isCorrect
      ? "success"
      : "danger"
    : dragState.x < 0
      ? "left"
      : dragState.x > 0
        ? "right"
        : "neutral"
  const cardAccentClasses = getWordCardAccentClasses(cardTone)

  return (
    <main className="relative isolate mx-auto flex min-h-screen w-full max-w-xl flex-col px-4 pb-10 pt-4 sm:px-6 lg:px-8">
      <div className="fixed inset-x-0 top-0 z-50 h-[5px] bg-border/80">
        <div
          className="h-full bg-gradient-to-r from-rose-500 via-amber-400 via-yellow-300 via-emerald-400 via-sky-500 to-violet-500 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="relative z-10 grid grid-cols-[auto_1fr_auto] items-center gap-3 pt-3">
        <Button asChild variant="ghost" size="icon-sm" className="rounded-full text-foreground hover:bg-accent/60">
          <Link href="/vocabulary" aria-label="Back to vocabulary">
            <ArrowLeftIcon />
          </Link>
        </Button>

        <div className="text-center leading-tight">
          <div className="text-[1.55rem] font-semibold tracking-tight text-foreground sm:text-2xl">
            {correctPercent}%
          </div>
        </div>

        <div className="text-right text-sm font-medium text-muted-foreground sm:text-[0.95rem]">
          {currentIndex + 1}/{session.totalQuestions}
        </div>
      </div>

      <section className="relative z-10 mt-3.5 flex flex-1 items-center justify-center">
        <div className="w-full max-w-md">
          <div className="grid grid-cols-2 gap-2.5 py-3.5 sm:gap-4 sm:py-4">
            <AnswerOptionButton
              meaning={activeQuestion.leftOption}
              side="left"
              onClick={() => commitAnswer("left")}
              disabled={isLocked}
              active={feedback?.side === "left" || (dragState.x < 0 && !feedback)}
            />
            <AnswerOptionButton
              meaning={activeQuestion.rightOption}
              side="right"
              onClick={() => commitAnswer("right")}
              disabled={isLocked}
              active={feedback?.side === "right" || (dragState.x > 0 && !feedback)}
            />
          </div>

            <div
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerCancel}
              className={cn(
              "touch-none px-1 py-4 transition-transform duration-150 ease-out sm:px-0 sm:py-5",
              isDragging && "cursor-grabbing transition-none",
              !isDragging && "cursor-grab",
              isDragging && "select-none",
              feedback?.isCorrect === true && "vocab-cling",
              feedback?.isCorrect === false && "vocab-shake",
            )}
            style={{ transform: cardTransform }}
          >
            <div className="mx-auto w-full max-w-md">
              <div
                className={cn(
                  "relative overflow-hidden rounded-[2rem] border px-6 py-8 text-center transition-colors duration-200 sm:px-10 sm:py-10",
                  cardAccentClasses,
                )}
              >
                <div
                  className={cn(
                    "absolute inset-x-0 top-0 h-20 bg-gradient-to-b transition-colors duration-200 sm:h-24",
                    cardTone === "left" && "from-sky-500/15 to-transparent dark:from-sky-400/20",
                    cardTone === "right" &&
                      "from-violet-500/15 to-transparent dark:from-violet-400/20",
                    cardTone === "danger" && "from-rose-500/20 to-transparent dark:from-rose-400/20",
                    cardTone === "success" &&
                      "from-emerald-500/20 to-transparent dark:from-emerald-400/20",
                    cardTone === "neutral" && "from-slate-500/10 to-transparent dark:from-white/10",
                  )}
                />
                <div
                  className={cn(
                    "absolute -right-8 top-4 size-24 rounded-full blur-2xl",
                    cardTone === "left" && "bg-sky-300/50 dark:bg-sky-400/15",
                    cardTone === "right" && "bg-violet-300/50 dark:bg-violet-400/15",
                    cardTone === "danger" && "bg-rose-300/45 dark:bg-rose-400/15",
                    cardTone === "success" && "bg-emerald-300/45 dark:bg-emerald-400/15",
                    cardTone === "neutral" && "bg-slate-200/80 dark:bg-white/10",
                  )}
                />
                <div
                  className={cn(
                    "absolute -left-10 bottom-0 size-28 rounded-full blur-3xl",
                    cardTone === "left" && "bg-sky-200/70 dark:bg-sky-500/15",
                    cardTone === "right" && "bg-violet-200/70 dark:bg-violet-500/15",
                    cardTone === "danger" && "bg-rose-200/60 dark:bg-rose-500/15",
                    cardTone === "success" && "bg-emerald-200/60 dark:bg-emerald-500/15",
                    cardTone === "neutral" && "bg-slate-50/80 dark:bg-white/5",
                  )}
                />

                <div className="relative flex flex-col items-center gap-4">
                  <div className="text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-muted-foreground sm:text-xs sm:tracking-[0.32em]">
                    {vocabularyGameTypeLabels[activeQuestion.type]}
                  </div>

                  <div className="text-balance text-[2.5rem] font-black tracking-tight text-foreground sm:text-5xl">
                    {activeQuestion.word}
                  </div>

                  {feedback ? (
                  <div
                    className={cn(
                      "mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold text-foreground shadow-sm",
                      feedback.isCorrect
                        ? "vocab-cling border-emerald-400 bg-emerald-100 text-emerald-950 dark:border-emerald-300/30 dark:bg-emerald-500/20 dark:text-emerald-50"
                        : "vocab-shake border-rose-400 bg-rose-100 text-rose-950 dark:border-rose-300/30 dark:bg-rose-500/20 dark:text-rose-50",
                    )}
                  >
                      {feedback.isCorrect ? (
                        <CheckIcon className="size-4 shrink-0" />
                      ) : (
                        <XIcon className="size-4 shrink-0" />
                      )}
                      <span className="truncate">
                        {feedback.isCorrect ? currentMeaning : `Jawaban: ${currentMeaning}`}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {activeQuestion.exampleSentence && !showExampleSentence ? (
            <div className="mt-4.5 flex flex-col items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mx-auto h-8 rounded-full border border-border bg-background px-3 text-xs font-medium text-muted-foreground shadow-sm transition-colors hover:border-border hover:bg-accent hover:text-foreground dark:bg-card dark:hover:bg-accent/30"
                onClick={() => setShowExampleSentence(true)}
              >
                <LightbulbIcon data-icon="inline-start" className="size-3.5" />
                Lihat contoh kalimat
              </Button>
            </div>
          ) : null}

          {showExampleSentence ? (
            <div className="mx-auto mt-4.5 max-w-md text-center text-sm italic leading-7 text-foreground/80 dark:text-foreground/75">
              {activeQuestion.exampleSentence}
            </div>
          ) : null}

        </div>
      </section>
    </main>
  )
}

function AnswerOptionButton({
  meaning,
  side,
  onClick,
  disabled,
  active,
}: {
  meaning: string
  side: "left" | "right"
  onClick: () => void
  disabled: boolean
  active: boolean
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "min-h-16 w-full justify-center rounded-[1.35rem] border px-2.5 py-2.5 text-center text-xs leading-5 whitespace-normal transition-colors sm:min-h-18 sm:px-3 sm:py-3 sm:text-sm sm:leading-6",
        side === "left" &&
          "border-sky-400 bg-sky-200 text-sky-950 hover:border-sky-500 hover:bg-sky-300/80 dark:border-sky-300/30 dark:bg-sky-500/20 dark:text-sky-50 dark:hover:bg-sky-500/30",
        side === "right" &&
          "border-violet-400 bg-violet-200 text-violet-950 hover:border-violet-500 hover:bg-violet-300/80 dark:border-violet-300/30 dark:bg-violet-500/20 dark:text-violet-50 dark:hover:bg-violet-500/30",
        active && side === "left" && "ring-2 ring-sky-400/60 dark:ring-sky-300/30",
        active && side === "right" && "ring-2 ring-violet-400/60 dark:ring-violet-300/30",
      )}
    >
      {meaning}
    </Button>
  )
}

function getWordCardAccentClasses(
  tone: "neutral" | "left" | "right" | "success" | "danger",
) {
  if (tone === "left") {
    return "border-sky-400/70 bg-gradient-to-br from-sky-100 via-white to-sky-50 shadow-[0_24px_60px_-34px_rgba(14,165,233,0.34)] dark:border-sky-300/25 dark:from-sky-500/20 dark:via-card dark:to-card dark:shadow-[0_24px_60px_-34px_rgba(56,189,248,0.22)]"
  }

  if (tone === "right") {
    return "border-violet-400/70 bg-gradient-to-br from-violet-100 via-white to-violet-50 shadow-[0_24px_60px_-34px_rgba(139,92,246,0.34)] dark:border-violet-300/25 dark:from-violet-500/20 dark:via-card dark:to-card dark:shadow-[0_24px_60px_-34px_rgba(167,139,250,0.22)]"
  }

  if (tone === "danger") {
    return "border-rose-400/80 bg-gradient-to-br from-rose-100 via-rose-50 to-white shadow-[0_24px_60px_-34px_rgba(244,63,94,0.34)] dark:border-rose-300/25 dark:from-rose-500/20 dark:via-card dark:to-card dark:shadow-[0_24px_60px_-34px_rgba(251,113,133,0.22)]"
  }

  if (tone === "success") {
    return "border-emerald-400/80 bg-gradient-to-br from-emerald-100 via-emerald-50 to-white shadow-[0_24px_60px_-34px_rgba(16,185,129,0.34)] dark:border-emerald-300/25 dark:from-emerald-500/20 dark:via-card dark:to-card dark:shadow-[0_24px_60px_-34px_rgba(74,222,128,0.22)]"
  }

  return "border-border/80 bg-card shadow-[0_24px_60px_-34px_rgba(15,23,42,0.14)] dark:shadow-[0_24px_60px_-34px_rgba(0,0,0,0.35)]"
}

function SummaryTile({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: "emerald" | "rose" | "violet"
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-3 py-3 text-center",
        tone === "emerald" &&
          "border-emerald-400/40 bg-emerald-100/80 text-emerald-950 dark:border-emerald-300/20 dark:bg-emerald-500/15 dark:text-emerald-50",
        tone === "rose" &&
          "border-rose-400/40 bg-rose-100/80 text-rose-950 dark:border-rose-300/20 dark:bg-rose-500/15 dark:text-rose-50",
        tone === "violet" &&
          "border-violet-400/40 bg-violet-100/80 text-violet-950 dark:border-violet-300/20 dark:bg-violet-500/15 dark:text-violet-50",
      )}
    >
      <div className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] opacity-70">
        {label}
      </div>
      <div className="mt-1 text-2xl font-black tracking-tight">{value}</div>
    </div>
  )
}
