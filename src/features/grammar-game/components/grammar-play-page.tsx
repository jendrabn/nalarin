"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState, type DragEvent } from "react"
import {
  ArrowLeftIcon,
  CheckIcon,
  RotateCcwIcon,
  Settings2Icon,
  SparklesIcon,
  XIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { cn } from "@/lib/utils"

import { gradeGrammarQuestionAction } from "../actions"
import type {
  GrammarGameChip,
  GrammarGameQuestion,
  GrammarGameSession,
  GrammarQuestionSubmissionResult,
} from "../types"
import {
  buildGrammarGameSearchParams,
  getGrammarGameAccuracy,
  parseGrammarSentenceTemplate,
} from "../utils"

type GrammarPlayPageProps = {
  session: GrammarGameSession
}

type BoardState = {
  availableChips: GrammarGameChip[]
  placements: Record<number, GrammarGameChip | null>
}

const advanceQuestionDelayMs = 2000

export function GrammarPlayPage({ session }: GrammarPlayPageProps) {
  return <GrammarGameStage session={session} />
}

function GrammarGameStage({ session }: { session: GrammarGameSession }) {
  if (session.totalQuestions === 0) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <Empty className="w-full">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SparklesIcon />
            </EmptyMedia>
            <EmptyTitle>Belum Ada Soal Yang Cocok</EmptyTitle>
            <EmptyDescription>
              Coba ubah konfigurasi agar sistem menemukan soal grammar yang tersedia.
            </EmptyDescription>
          </EmptyHeader>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <Button asChild>
              <Link href="/grammar">
                <Settings2Icon data-icon="inline-start" />
                Ubah Konfigurasi
              </Link>
            </Button>
          </div>
        </Empty>
      </main>
    )
  }

  return <GrammarGamePlayer session={session} />
}

function GrammarGamePlayer({ session }: { session: GrammarGameSession }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [board, setBoard] = useState<BoardState>(() => createBoardState(session.questions[0]))
  const [selectedChipId, setSelectedChipId] = useState<string | null>(null)
  const [hoverBlankOrder, setHoverBlankOrder] = useState<number | null>(null)
  const [hoverPool, setHoverPool] = useState(false)
  const [feedback, setFeedback] = useState<GrammarQuestionSubmissionResult | null>(null)
  const [isLocked, setIsLocked] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [correctBlankCount, setCorrectBlankCount] = useState(0)
  const [wrongBlankCount, setWrongBlankCount] = useState(0)
  const [completedQuestions, setCompletedQuestions] = useState(0)
  const timeoutRef = useRef<number | null>(null)

  const activeQuestion = session.questions[currentIndex] ?? null
  const finished = currentIndex >= session.totalQuestions || activeQuestion === null
  const parseResult = useMemo(
    () => parseGrammarSentenceTemplate(activeQuestion?.sentenceTemplate ?? ""),
    [activeQuestion?.sentenceTemplate],
  )
  const chipToneIndexById = useMemo(
    () => new Map((activeQuestion?.chips ?? []).map((chip, index) => [chip.id, index])),
    [activeQuestion?.chips],
  )
  const blankOrders = parseResult.placeholderOrders
  const answeredCount = completedQuestions
  const accuracy = getGrammarGameAccuracy(correctBlankCount, correctBlankCount + wrongBlankCount)
  const currentQuestionNumber = Math.min(currentIndex + 1, session.totalQuestions)

  const configHref = useMemo(
    () => `/grammar?${buildGrammarGameSearchParams(session.config)}`,
    [session.config],
  )
  const restartHref = useMemo(
    () => `/grammar/play?${buildGrammarGameSearchParams(session.config)}`,
    [session.config],
  )
  const sortAvailableChips = (chips: GrammarGameChip[]) =>
    [...chips].sort(
      (first, second) =>
        (chipToneIndexById.get(first.id) ?? Number.MAX_SAFE_INTEGER) -
        (chipToneIndexById.get(second.id) ?? Number.MAX_SAFE_INTEGER),
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
    const nextIndex = currentIndex + 1

    if (nextIndex >= session.totalQuestions) {
      setCurrentIndex(session.totalQuestions)
      setBoard(createBoardState(null))
      setSelectedChipId(null)
      setHoverBlankOrder(null)
      setHoverPool(false)
      setFeedback(null)
      setIsLocked(false)
      setIsSubmitting(false)
      return
    }

    setCurrentIndex(nextIndex)
    setBoard(createBoardState(session.questions[nextIndex]))
    setSelectedChipId(null)
    setHoverBlankOrder(null)
    setHoverPool(false)
    setFeedback(null)
    setIsLocked(false)
    setIsSubmitting(false)
  }

  const handleChipPick = (chipId: string) => {
    if (!activeQuestion || isLocked) {
      return
    }

    setSelectedChipId((current) => (current === chipId ? null : chipId))
  }

  const handleBlankClick = (order: number) => {
    if (!activeQuestion || isLocked) {
      return
    }

    const selectedChip =
      selectedChipId !== null
        ? board.availableChips.find((chip) => chip.id === selectedChipId) ?? null
        : null

    const existingChip = board.placements[order]

    if (!selectedChip && existingChip) {
      setBoard((current) => {
        const availableChips = [...current.availableChips]
        const placements = { ...current.placements }

        placements[order] = null

        return {
          availableChips: sortAvailableChips([...availableChips, existingChip]),
          placements,
        }
      })

      setSelectedChipId(null)
      return
    }

    if (!selectedChip) {
      return
    }

    setBoard((current) => {
      const availableChips = current.availableChips.filter((chip) => chip.id !== selectedChip.id)
      const placements = { ...current.placements }
      const displaced = placements[order]

      if (displaced && displaced.id !== selectedChip.id) {
        availableChips.push(displaced)
      }

      placements[order] = selectedChip

      return {
        availableChips: sortAvailableChips(availableChips),
        placements,
      }
    })

    setSelectedChipId(null)
  }

  const moveChipById = (chipId: string, target: "pool" | number) => {
    if (!activeQuestion || isLocked) {
      return
    }

    const sourceChip =
      board.availableChips.find((chip) => chip.id === chipId) ??
      Object.values(board.placements).find((chip) => chip?.id === chipId) ??
      null

    if (!sourceChip) {
      return
    }

    setBoard((current) => {
      const availableChips = current.availableChips.filter((chip) => chip.id !== chipId)
      const placements = { ...current.placements }

      Object.keys(placements).forEach((key) => {
        const order = Number(key)
        if (placements[order]?.id === chipId) {
          placements[order] = null
        }
      })

      if (target === "pool") {
        availableChips.push(sourceChip)
      } else {
        const displaced = placements[target]
        if (displaced && displaced.id !== chipId) {
          availableChips.push(displaced)
        }
        placements[target] = sourceChip
      }

      return {
        availableChips: sortAvailableChips(availableChips),
        placements,
      }
    })

    setSelectedChipId(null)
  }

  const handleSubmitQuestion = async () => {
    if (!activeQuestion || isLocked || isSubmitting) {
      return
    }

    const missingBlank = blankOrders.find((order) => !board.placements[order])

    if (missingBlank) {
      toast.error("Isi semua blank terlebih dahulu.")
      return
    }

    setIsSubmitting(true)

    try {
      const result = await gradeGrammarQuestionAction({
        questionId: activeQuestion.id,
        answers: blankOrders.map((order) => ({
          order,
          answer: board.placements[order]?.text ?? "",
        })),
      })

      if (!result.success) {
        toast.error(result.message)
        return
      }

      setFeedback(result.data)
      setIsLocked(true)
      setCorrectBlankCount((value) => value + result.data.correctCount)
      setWrongBlankCount((value) => value + (result.data.totalCount - result.data.correctCount))
      setCompletedQuestions((value) => value + 1)
      clearActiveTimer()
      timeoutRef.current = window.setTimeout(() => {
        advanceQuestion()
      }, advanceQuestionDelayMs)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (finished) {
    return (
      <GrammarGameResult
        configHref={configHref}
        restartHref={restartHref}
        totalQuestions={session.totalQuestions}
        correctBlankCount={correctBlankCount}
        wrongBlankCount={wrongBlankCount}
        accuracy={accuracy}
      />
    )
  }

  const feedbackMap = new Map(feedback?.blankResults.map((item) => [item.order, item]))
  const isComplete = blankOrders.every((order) => Boolean(board.placements[order]))
  const progressPercent =
    session.totalQuestions === 0 ? 0 : Math.min((answeredCount / session.totalQuestions) * 100, 100)

  return (
    <main className="relative isolate mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 pb-10 pt-4 text-foreground sm:px-6 lg:px-8">
      <div className="fixed inset-x-0 top-0 z-50 h-[5px] bg-border/80">
        <div
          className="h-full bg-gradient-to-r from-rose-500 via-amber-400 via-yellow-300 via-emerald-400 via-sky-500 to-violet-500 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="relative z-10 grid grid-cols-[auto_1fr_auto] items-center gap-3 pt-3">
        <Button asChild variant="ghost" size="icon-sm" className="rounded-full text-foreground hover:bg-accent/60">
          <Link href={configHref} aria-label="Back to grammar config">
            <ArrowLeftIcon />
          </Link>
        </Button>

        <div className="text-center leading-tight">
          <div className="text-[1.55rem] font-semibold tracking-tight text-foreground sm:text-2xl">
            {accuracy}%
          </div>
        </div>

        <div className="text-right text-sm font-medium tabular-nums text-muted-foreground sm:text-[0.95rem]">
          {currentQuestionNumber}/{session.totalQuestions}
        </div>
      </div>

      <section className="relative z-10 mt-3.5 flex flex-1 items-center justify-center py-4">
        <div className="w-full max-w-3xl">
          <div className="flex flex-col gap-6">
            <SentenceRenderer
              template={activeQuestion.sentenceTemplate}
              placements={board.placements}
              feedbackMap={feedbackMap}
              chipToneIndexById={chipToneIndexById}
              hoverBlankOrder={hoverBlankOrder}
              isLocked={isLocked}
              onBlankClick={handleBlankClick}
              onBlankDragEnter={(order) => setHoverBlankOrder(order)}
              onBlankDragLeave={() => setHoverBlankOrder(null)}
              onBlankDrop={(order, chipId) => moveChipById(chipId, order)}
              onChipDragEnd={() => {
                setHoverBlankOrder(null)
                setHoverPool(false)
              }}
            />

            <div
              className={cn(
                "flex flex-wrap gap-2.5 rounded-2xl transition-colors",
                hoverPool && "bg-primary/5 outline outline-1 outline-primary/20",
              )}
              onDragOver={(event) => event.preventDefault()}
              onDragEnter={() => setHoverPool(true)}
              onDragLeave={() => setHoverPool(false)}
              onDrop={(event) => {
                event.preventDefault()
                setHoverPool(false)
                const chipId = event.dataTransfer.getData("text/plain")
                if (chipId) {
                  moveChipById(chipId, "pool")
                }
              }}
            >
              {board.availableChips.length > 0 ? (
                board.availableChips.map((chip, index) => {
                  return (
                    <Button
                      key={chip.id}
                      type="button"
                      variant="outline"
                      size="lg"
                      className={cn(
                        "min-h-11 rounded-full border px-4 text-sm font-semibold whitespace-normal transition-all active:translate-y-0",
                        getAnswerChipButtonToneClasses(chipToneIndexById.get(chip.id) ?? index),
                        isLocked && "pointer-events-none opacity-80",
                      )}
                      draggable={!isLocked}
                      onDragStart={(event) => {
                        if (isLocked) {
                          return
                        }
                        event.dataTransfer.setData("text/plain", chip.id)
                        event.dataTransfer.effectAllowed = "move"
                      }}
                      onDragEnd={() => {
                        setHoverBlankOrder(null)
                        setHoverPool(false)
                      }}
                      onClick={() => handleChipPick(chip.id)}
                    >
                      {chip.text}
                    </Button>
                  )
                })
              ) : (
                <span className="rounded-full border border-primary/15 bg-background/70 px-4 py-2 text-sm text-muted-foreground">
                  Semua jawaban sudah ditempatkan.
                </span>
              )}
            </div>

            {feedback ? (
              <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                <div className="flex flex-wrap items-center justify-end gap-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <CheckIcon className="size-4" />
                      {feedback.correctCount} benar
                    </span>
                    <span className="inline-flex items-center gap-1 text-destructive">
                      <XIcon className="size-4" />
                      {feedback.totalCount - feedback.correctCount} salah
                    </span>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              {feedback ? (
                <Button type="button" variant="outline" size="lg" className="h-11 rounded-full px-5" onClick={advanceQuestion}>
                  Lanjut
                </Button>
              ) : null}
              <Button
                type="button"
                size="lg"
                className="h-11 rounded-full px-5"
                onClick={() => void handleSubmitQuestion()}
                disabled={!isComplete || isLocked || isSubmitting}
              >
                {isSubmitting ? "Memeriksa..." : "Submit"}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

function getAnswerChipTone(index: number) {
  const tones = [
    {
      base: "border-sky-400/45 bg-sky-100 text-sky-950 shadow-sm dark:border-sky-300/25 dark:bg-sky-500/20 dark:text-sky-50",
      stable: "hover:border-sky-400/45 hover:bg-sky-100 hover:text-sky-950 dark:hover:border-sky-300/25 dark:hover:bg-sky-500/20 dark:hover:text-sky-50",
    },
    {
      base: "border-emerald-400/45 bg-emerald-100 text-emerald-950 shadow-sm dark:border-emerald-300/25 dark:bg-emerald-500/20 dark:text-emerald-50",
      stable: "hover:border-emerald-400/45 hover:bg-emerald-100 hover:text-emerald-950 dark:hover:border-emerald-300/25 dark:hover:bg-emerald-500/20 dark:hover:text-emerald-50",
    },
    {
      base: "border-amber-400/50 bg-amber-100 text-amber-950 shadow-sm dark:border-amber-300/25 dark:bg-amber-500/20 dark:text-amber-50",
      stable: "hover:border-amber-400/50 hover:bg-amber-100 hover:text-amber-950 dark:hover:border-amber-300/25 dark:hover:bg-amber-500/20 dark:hover:text-amber-50",
    },
    {
      base: "border-violet-400/45 bg-violet-100 text-violet-950 shadow-sm dark:border-violet-300/25 dark:bg-violet-500/20 dark:text-violet-50",
      stable: "hover:border-violet-400/45 hover:bg-violet-100 hover:text-violet-950 dark:hover:border-violet-300/25 dark:hover:bg-violet-500/20 dark:hover:text-violet-50",
    },
    {
      base: "border-rose-400/45 bg-rose-100 text-rose-950 shadow-sm dark:border-rose-300/25 dark:bg-rose-500/20 dark:text-rose-50",
      stable: "hover:border-rose-400/45 hover:bg-rose-100 hover:text-rose-950 dark:hover:border-rose-300/25 dark:hover:bg-rose-500/20 dark:hover:text-rose-50",
    },
  ]

  return tones[index % tones.length]
}

function getAnswerChipButtonToneClasses(index: number) {
  const tone = getAnswerChipTone(index)

  return `${tone.base} ${tone.stable}`
}

function getAnswerChipSlotToneClasses(index: number) {
  return getAnswerChipTone(index).base
}

function SentenceRenderer({
  template,
  placements,
  feedbackMap,
  chipToneIndexById,
  hoverBlankOrder,
  isLocked,
  onBlankClick,
  onBlankDragEnter,
  onBlankDragLeave,
  onBlankDrop,
  onChipDragEnd,
}: {
  template: string
  placements: Record<number, GrammarGameChip | null>
  feedbackMap: Map<number, GrammarQuestionSubmissionResult["blankResults"][number]>
  chipToneIndexById: Map<string, number>
  hoverBlankOrder: number | null
  isLocked: boolean
  onBlankClick: (order: number) => void
  onBlankDragEnter: (order: number) => void
  onBlankDragLeave: () => void
  onBlankDrop: (order: number, chipId: string) => void
  onChipDragEnd: () => void
}) {
  const parsed = useMemo(() => parseGrammarSentenceTemplate(template), [template])

  return (
    <div className="select-none rounded-[1.75rem] border border-primary/15 bg-gradient-to-br from-primary/5 via-card to-secondary/60 p-5 shadow-[0_20px_55px_-42px_rgba(15,23,42,0.35)] sm:p-6">
      <p className="flex flex-wrap items-center gap-x-2 gap-y-3 text-lg leading-8 text-foreground">
        {parsed.segments.map((segment, index) => {
          if (segment.type === "text") {
            return (
              <span key={`${segment.type}-${index}`} className="whitespace-pre-wrap">
                {segment.text}
              </span>
            )
          }

          const chip = placements[segment.order] ?? null

          return (
            <BlankSlot
              key={`${segment.type}-${index}`}
              order={segment.order}
              chip={chip}
              feedback={feedbackMap.get(segment.order) ?? null}
              chipToneClass={
                chip
                  ? getAnswerChipSlotToneClasses(chipToneIndexById.get(chip.id) ?? 0)
                  : undefined
              }
              isHovered={hoverBlankOrder === segment.order}
              isLocked={isLocked}
              onClick={() => onBlankClick(segment.order)}
              onDragEnter={() => onBlankDragEnter(segment.order)}
              onDragLeave={onBlankDragLeave}
              onDragOver={(event) => event.preventDefault()}
              onChipDragEnd={onChipDragEnd}
              onDrop={(event) => {
                event.preventDefault()
                const chipId = event.dataTransfer.getData("text/plain")
                if (chipId) {
                  onBlankDrop(segment.order, chipId)
                }
                onBlankDragLeave()
              }}
            />
          )
        })}
      </p>
    </div>
  )
}

function BlankSlot({
  order,
  chip,
  feedback,
  chipToneClass,
  isHovered,
  isLocked,
  onClick,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onChipDragEnd,
  onDrop,
}: {
  order: number
  chip: GrammarGameChip | null
  feedback: GrammarQuestionSubmissionResult["blankResults"][number] | null
  chipToneClass?: string
  isHovered: boolean
  isLocked: boolean
  onClick: () => void
  onDragEnter: () => void
  onDragLeave: () => void
  onDragOver: (event: DragEvent<HTMLSpanElement>) => void
  onChipDragEnd: () => void
  onDrop: (event: DragEvent<HTMLSpanElement>) => void
}) {
  const isCorrect = feedback?.isCorrect ?? false
  const hasFeedback = Boolean(feedback)

  return (
    <span
      className={cn(
        "inline-flex min-h-11 min-w-24 items-center justify-center rounded-2xl border px-3 text-sm font-medium transition-all",
        chip
          ? chipToneClass
          : "border-dashed border-primary/25 bg-primary/5 text-muted-foreground",
        !chip && isHovered && "border-primary/50 bg-primary/10",
        hasFeedback && isCorrect && "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
        hasFeedback && !isCorrect && "border-destructive/30 bg-destructive/10 text-destructive",
        chip && !isLocked && "cursor-grab",
        isLocked && "cursor-default",
      )}
      draggable={Boolean(chip) && !isLocked}
      onClick={onClick}
      onDragStart={(event) => {
        if (!chip || isLocked) {
          return
        }

        event.dataTransfer.setData("text/plain", chip.id)
        event.dataTransfer.effectAllowed = "move"
      }}
      onDragEnd={onChipDragEnd}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {chip ? (
        <span className="flex flex-col items-center gap-0.5 leading-tight">
          <span>{chip.text}</span>
          {hasFeedback && !isCorrect ? (
            <span className="text-[0.65rem] font-normal text-muted-foreground">
              {feedback?.correctAnswer}
            </span>
          ) : null}
        </span>
      ) : (
        <span className="text-xs tracking-[0.2em]">{order}</span>
      )}
    </span>
  )
}

function GrammarGameResult({
  configHref,
  restartHref,
  totalQuestions,
  correctBlankCount,
  wrongBlankCount,
  accuracy,
}: {
  configHref: string
  restartHref: string
  totalQuestions: number
  correctBlankCount: number
  wrongBlankCount: number
  accuracy: number
}) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl items-center px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex w-full flex-col gap-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="rounded-full px-3 text-foreground hover:bg-accent/60">
            <Link href={configHref} aria-label="Back to grammar config">
              <ArrowLeftIcon />
              Kembali
            </Link>
          </Button>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-border/70 bg-card/95 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.2)] backdrop-blur dark:shadow-[0_24px_60px_-34px_rgba(0,0,0,0.45)]">
          <div className="flex flex-col gap-5 p-5 sm:p-6">
            <div className="text-center text-5xl font-black tracking-tight text-foreground sm:text-6xl">
              {accuracy}%
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <SummaryTile label="Benar" value={String(correctBlankCount)} tone="emerald" />
              <SummaryTile label="Salah" value={String(wrongBlankCount)} tone="rose" />
              <SummaryTile label="Total Soal" value={String(totalQuestions)} tone="violet" />
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

function SummaryTile({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: "emerald" | "rose" | "violet"
}) {
  const toneClasses =
    tone === "emerald"
      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      : tone === "rose"
        ? "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300"
        : "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300"

  return (
    <div className={cn("rounded-2xl border px-4 py-4 text-center", toneClasses)}>
      <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{label}</div>
      <div className="mt-2 text-3xl font-semibold tabular-nums text-foreground">{value}</div>
    </div>
  )
}

function createBoardState(question: GrammarGameQuestion | null): BoardState {
  return {
    availableChips: question?.chips ?? [],
    placements: {},
  }
}
