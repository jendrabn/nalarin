"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState, type DragEvent } from "react"
import {
  ArrowLeftIcon,
  CheckIcon,
  Settings2Icon,
  SparklesIcon,
  XIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

import { gradeGrammarQuestionAction } from "../actions"
import { grammarGameDifficultyLabels, grammarGameLanguageLabels } from "../constants"
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
        availableChips.unshift(existingChip)

        return {
          availableChips,
          placements,
        }
      })

      setSelectedChipId(existingChip.id)
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
        availableChips.unshift(displaced)
      }

      placements[order] = selectedChip

      return {
        availableChips,
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
        availableChips.unshift(sourceChip)
      } else {
        const displaced = placements[target]
        if (displaced && displaced.id !== chipId) {
          availableChips.unshift(displaced)
        }
        placements[target] = sourceChip
      }

      return {
        availableChips,
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
  const currentProgress = session.totalQuestions === 0 ? 0 : (answeredCount / session.totalQuestions) * 100

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <Button asChild variant="ghost" className="rounded-full">
            <Link href={configHref}>
              <ArrowLeftIcon data-icon="inline-start" />
              Kembali
            </Link>
          </Button>

          <div className="flex flex-col items-center gap-1 text-center">
            <span className="text-2xl font-semibold tabular-nums text-foreground">
              {accuracy}%
            </span>
            <span className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Benar
            </span>
          </div>

          <div className="text-sm font-medium tabular-nums text-muted-foreground">
            {currentQuestionNumber}/{session.totalQuestions}
          </div>
        </div>

        <Progress value={currentProgress} className="h-[5px]" />

        <div className="flex flex-1 items-center justify-center py-4">
          <div className="w-full space-y-6">
            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">
                  Soal {currentQuestionNumber}
                </CardTitle>
                <CardDescription>
                  {grammarGameLanguageLabels[session.config.language]} •{" "}
                  {grammarGameDifficultyLabels[session.config.difficulty]}
                  {session.config.category !== "all" ? ` • ${session.config.category}` : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <SentenceRenderer
                  template={activeQuestion.sentenceTemplate}
                  placements={board.placements}
                  feedbackMap={feedbackMap}
                  hoverBlankOrder={hoverBlankOrder}
                  selectedChipId={selectedChipId}
                  isLocked={isLocked}
                  onBlankClick={handleBlankClick}
                  onBlankDragEnter={(order) => setHoverBlankOrder(order)}
                  onBlankDragLeave={() => setHoverBlankOrder(null)}
                  onBlankDrop={(order, chipId) => moveChipById(chipId, order)}
                />

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-foreground">Jawaban</p>
                    <p className="text-xs text-muted-foreground">
                      {isComplete ? "Siap submit" : "Isi semua blank dulu"}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "rounded-3xl border border-border/60 bg-muted/20 p-4 transition-colors",
                      hoverPool && "border-primary/40 bg-primary/5",
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
                    <div className="flex flex-wrap gap-2">
                      {board.availableChips.length > 0 ? (
                        board.availableChips.map((chip) => {
                          const selected = selectedChipId === chip.id
                          const feedbackClass =
                            isLocked && feedback
                              ? undefined
                              : undefined

                          return (
                            <Button
                              key={chip.id}
                              type="button"
                              variant="outline"
                              className={cn(
                                "h-11 rounded-full px-4 text-sm font-medium transition-all",
                                selected &&
                                  "border-primary bg-primary text-primary-foreground shadow-sm",
                                !selected &&
                                  "border-border/70 bg-background text-foreground hover:-translate-y-px hover:border-primary/30 hover:bg-background",
                                isLocked && "pointer-events-none opacity-80",
                                feedbackClass,
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
                        <span className="text-sm text-muted-foreground">
                          Semua jawaban sudah ditempatkan.
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {feedback ? (
                  <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-foreground">Hasil Blank</p>
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
                    <Button type="button" variant="outline" onClick={advanceQuestion}>
                      Lanjut
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    onClick={() => void handleSubmitQuestion()}
                    disabled={!isComplete || isLocked || isSubmitting}
                  >
                    {isSubmitting ? "Memeriksa..." : "Submit"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}

function SentenceRenderer({
  template,
  placements,
  feedbackMap,
  hoverBlankOrder,
  selectedChipId,
  isLocked,
  onBlankClick,
  onBlankDragEnter,
  onBlankDragLeave,
  onBlankDrop,
}: {
  template: string
  placements: Record<number, GrammarGameChip | null>
  feedbackMap: Map<number, GrammarQuestionSubmissionResult["blankResults"][number]>
  hoverBlankOrder: number | null
  selectedChipId: string | null
  isLocked: boolean
  onBlankClick: (order: number) => void
  onBlankDragEnter: (order: number) => void
  onBlankDragLeave: () => void
  onBlankDrop: (order: number, chipId: string) => void
}) {
  const parsed = useMemo(() => parseGrammarSentenceTemplate(template), [template])

  return (
    <div className="rounded-3xl border border-border/60 bg-background p-5 sm:p-6">
      <p className="flex flex-wrap items-center gap-x-2 gap-y-3 text-lg leading-8 text-foreground">
        {parsed.segments.map((segment, index) =>
          segment.type === "text" ? (
            <span key={`${segment.type}-${index}`} className="whitespace-pre-wrap">
              {segment.text}
            </span>
          ) : (
            <BlankSlot
              key={`${segment.type}-${index}`}
              order={segment.order}
              chip={placements[segment.order] ?? null}
              feedback={feedbackMap.get(segment.order) ?? null}
              isHovered={hoverBlankOrder === segment.order}
              isSelected={selectedChipId !== null && placements[segment.order]?.id === selectedChipId}
              isLocked={isLocked}
              onClick={() => onBlankClick(segment.order)}
              onDragEnter={() => onBlankDragEnter(segment.order)}
              onDragLeave={onBlankDragLeave}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault()
                const chipId = event.dataTransfer.getData("text/plain")
                if (chipId) {
                  onBlankDrop(segment.order, chipId)
                }
                onBlankDragLeave()
              }}
            />
          ),
        )}
      </p>
    </div>
  )
}

function BlankSlot({
  order,
  chip,
  feedback,
  isHovered,
  isSelected,
  isLocked,
  onClick,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
}: {
  order: number
  chip: GrammarGameChip | null
  feedback: GrammarQuestionSubmissionResult["blankResults"][number] | null
  isHovered: boolean
  isSelected: boolean
  isLocked: boolean
  onClick: () => void
  onDragEnter: () => void
  onDragLeave: () => void
  onDragOver: (event: DragEvent<HTMLSpanElement>) => void
  onDrop: (event: DragEvent<HTMLSpanElement>) => void
}) {
  const isCorrect = feedback?.isCorrect ?? false
  const hasFeedback = Boolean(feedback)

  return (
    <span
      className={cn(
        "inline-flex min-h-11 min-w-24 items-center justify-center rounded-2xl border px-3 text-sm font-medium transition-all",
        chip ? "bg-background" : "border-dashed border-border/60 bg-muted/30 text-muted-foreground",
        isHovered && "border-primary/50 bg-primary/5",
        isSelected && "border-primary bg-primary/5 text-primary",
        hasFeedback && isCorrect && "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
        hasFeedback && !isCorrect && "border-destructive/30 bg-destructive/10 text-destructive",
        isLocked && "cursor-default",
      )}
      onClick={onClick}
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
              Jawaban: {feedback?.correctAnswer}
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
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-6 sm:px-6 lg:px-8">
      <Card className="w-full border-border/60 shadow-sm">
        <CardHeader className="text-center">
          <CardDescription>Hasil permainan</CardDescription>
          <CardTitle className="text-4xl font-semibold tabular-nums text-foreground sm:text-5xl">
            {accuracy}%
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <SummaryTile label="Benar" value={String(correctBlankCount)} tone="emerald" />
            <SummaryTile label="Salah" value={String(wrongBlankCount)} tone="rose" />
            <SummaryTile label="Total Soal" value={String(totalQuestions)} tone="violet" />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild variant="outline">
              <Link href={configHref}>
                <Settings2Icon data-icon="inline-start" />
                Ubah Konfigurasi
              </Link>
            </Button>
            <Button asChild>
              <Link href={restartHref}>Main Lagi</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
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
