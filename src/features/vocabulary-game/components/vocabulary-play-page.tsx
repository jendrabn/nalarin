"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import type { PointerEvent, ReactNode } from "react"
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  Clock3Icon,
  RotateCcwIcon,
  SparklesIcon,
  TargetIcon,
  TrophyIcon,
  TriangleAlertIcon,
} from "lucide-react"

import { SiteFooter } from "@/components/site-footer"
import { SiteNavbar } from "@/components/site-navbar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { cn } from "@/lib/utils"

import type { CurrentUser } from "@/features/auth/services/session"

import {
  buildVocabularyGameSearchParams,
  getVocabularyGameAccuracy,
} from "../utils"
import {
  vocabularyGameDifficultyLabels,
  vocabularyGameLanguageLabels,
  vocabularyGameTypeLabels,
} from "../constants"
import type {
  VocabularyGameAnswer,
  VocabularyGameQuestion,
  VocabularyGameSession,
} from "../types"

type VocabularyPlayPageProps = {
  user: CurrentUser | null
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

export function VocabularyPlayPage({ user, session }: VocabularyPlayPageProps) {
  const siteUser = user
    ? {
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        role: user.role,
      }
    : null

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNavbar user={siteUser} />
      <VocabularyGameStage session={session} />
      <SiteFooter />
    </div>
  )
}

function VocabularyGameStage({ session }: { session: VocabularyGameSession }) {
  if (session.totalQuestions === 0) {
    return (
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-10 sm:px-6 lg:px-8">
        <Empty className="min-h-[60vh] border bg-card/80 shadow-sm">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <TargetIcon />
            </EmptyMedia>
            <EmptyTitle>Tidak ada kosakata yang cocok</EmptyTitle>
            <EmptyDescription>
              Filter yang kamu pilih belum menemukan kosakata published yang valid. Ubah konfigurasi
              untuk mencoba kombinasi lain.
            </EmptyDescription>
          </EmptyHeader>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <Button asChild>
              <Link href="/vocabulary">
                <ArrowLeftIcon data-icon="inline-start" />
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
  const [animatingSide, setAnimatingSide] = useState<"left" | "right" | null>(null)
  const [sessionKey] = useState(() => String(Date.now()))
  const pointerRef = useRef<{
    pointerId: number | null
    startX: number
    startY: number
    lastX: number
    lastY: number
  }>({
    pointerId: null,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
  })
  const timeoutRef = useRef<number | null>(null)

  const activeQuestion = session.questions[currentIndex] ?? null
  const answeredCount = answers.length
  const progress = session.totalQuestions === 0 ? 0 : answeredCount / session.totalQuestions
  const finished = currentIndex >= session.totalQuestions || activeQuestion === null
  const accuracy = getVocabularyGameAccuracy(correctCount, answeredCount)
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
    setAnimatingSide(null)
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
    const exitDistance =
      typeof window !== "undefined" ? Math.max(window.innerWidth * 0.9, 520) : 720
    setDragState({
      x: side === "left" ? -exitDistance : exitDistance,
      y: 0,
    })
    setAnimatingSide(side)

    if (isCorrect) {
      setCorrectCount((value) => value + 1)
    } else {
      setWrongCount((value) => value + 1)
    }

    clearActiveTimer()
    timeoutRef.current = window.setTimeout(() => {
      advanceQuestion()
    }, isCorrect ? 420 : 760)
  }

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!activeQuestion || isLocked) {
      return
    }

    pointerRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
    }

    setIsDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!isDragging || pointerRef.current.pointerId !== event.pointerId || !activeQuestion || isLocked) {
      return
    }

    const deltaX = event.clientX - pointerRef.current.startX
    const deltaY = event.clientY - pointerRef.current.startY

    pointerRef.current.lastX = event.clientX
    pointerRef.current.lastY = event.clientY
    setDragState({
      x: deltaX,
      y: deltaY * 0.35,
    })
  }

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (pointerRef.current.pointerId !== event.pointerId) {
      return
    }

    const width = Math.max((event.currentTarget as HTMLElement).getBoundingClientRect().width, 1)
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

  const currentMeaning = activeQuestion ? activeQuestion.correctMeaning : ""
  const topState = getTopBarState(activeQuestion, feedback, animatingSide, dragState.x)

  if (finished) {
    return (
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-8 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-[radial-gradient(circle_at_top_right,_rgba(34,197,94,0.12),transparent_30%),radial-gradient(circle_at_top_left,_rgba(250,204,21,0.1),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.95),rgba(248,250,252,0.92))] px-5 py-6 shadow-lg shadow-primary/5 sm:px-7 sm:py-8">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.03)_1px,transparent_1px)] bg-[size:30px_30px] opacity-45" />
          <div className="relative">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="rounded-full">
                <TrophyIcon data-icon="inline-start" />
                Sesi Selesai
              </Badge>
              <Badge variant="outline" className="rounded-full">
                <SparklesIcon data-icon="inline-start" />
                Akurasi {accuracy}%
              </Badge>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  Kamu sudah menyelesaikan sesi kosakata.
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                  Ringkasan ini dihitung di browser saja. Tidak ada progres sesi yang disimpan ke database,
                  jadi setiap refresh atau sesi baru akan memulai ulang dari awal.
                </p>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Button asChild size="lg" className="sm:w-auto">
                    <Link href={restartHref}>
                      <RotateCcwIcon data-icon="inline-start" />
                      Main Lagi
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="sm:w-auto">
                    <Link href={configHref}>
                      <ArrowLeftIcon data-icon="inline-start" />
                      Ubah Konfigurasi
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <SummaryMetric label="Total Soal" value={answeredCount.toString()} icon={<TargetIcon />} />
                <SummaryMetric label="Benar" value={correctCount.toString()} icon={<CheckCircle2Icon />} />
                <SummaryMetric label="Salah" value={wrongCount.toString()} icon={<TriangleAlertIcon />} />
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <InfoStrip
                label="Bahasa"
                value={vocabularyGameLanguageLabels[session.config.language]}
              />
              <InfoStrip
                label="Kesulitan"
                value={vocabularyGameDifficultyLabels[session.config.difficulty]}
              />
              <InfoStrip label="Tipe" value={vocabularyGameTypeLabels[session.config.type]} />
            </div>
          </div>
        </section>
      </main>
    )
  }

  if (!activeQuestion) {
    return null
  }

  const cardTransform = `translate3d(${dragState.x}px, ${dragState.y}px, 0) rotate(${Math.max(
    Math.min(dragState.x / 18, 14),
    -14,
  )}deg)`
  const leftHighlight = dragState.x < 0 ? 1 : 0
  const rightHighlight = dragState.x > 0 ? 1 : 0
  const activeSide = dragState.x < 0 ? "left" : dragState.x > 0 ? "right" : null
  const selectedSide = feedback?.side ?? activeSide
  const feedbackClassName = feedback
    ? feedback.isCorrect
      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700"
      : "border-rose-500/25 bg-rose-500/10 text-rose-700"
    : "border-border/70 bg-card"

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8">
      <section className="grid gap-5 lg:grid-cols-[1fr_390px] lg:items-start">
        <div className="space-y-4">
          <Card className="overflow-hidden border-border/70 bg-card/95 shadow-sm">
            <CardContent className="p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="rounded-full">
                    {vocabularyGameLanguageLabels[session.config.language]}
                  </Badge>
                  <Badge variant="outline" className="rounded-full">
                    {vocabularyGameDifficultyLabels[session.config.difficulty]}
                  </Badge>
                  <Badge variant="outline" className="rounded-full">
                    {vocabularyGameTypeLabels[session.config.type]}
                  </Badge>
                </div>
                <Badge variant="soft" className="rounded-full">
                  Soal {currentIndex + 1}/{session.totalQuestions}
                </Badge>
              </div>

              <div className="mt-4 flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Kata</div>
                  <h2 className="mt-1 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                    {activeQuestion.word}
                  </h2>
                </div>
                <div className="rounded-2xl border border-border/70 bg-secondary/35 px-4 py-3 text-right">
                  <div className="text-[0.7rem] uppercase tracking-[0.24em] text-muted-foreground">
                    Akurasi
                  </div>
                  <div className="mt-1 text-2xl font-semibold text-foreground">{accuracy}%</div>
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <AnswerLane
                  side="left"
                  title="Pilihan Kiri"
                  meaning={activeQuestion.leftOption}
                  isActive={selectedSide === "left"}
                  isCorrect={feedback ? feedback.side === "left" && feedback.isCorrect : activeQuestion.correctSide === "left" && dragState.x < 0}
                  isWrong={feedback ? feedback.side === "left" && !feedback.isCorrect : false}
                  progress={Math.min(leftHighlight + Math.abs(dragState.x) / 300, 1)}
                />
                <AnswerLane
                  side="right"
                  title="Pilihan Kanan"
                  meaning={activeQuestion.rightOption}
                  isActive={selectedSide === "right"}
                  isCorrect={feedback ? feedback.side === "right" && feedback.isCorrect : activeQuestion.correctSide === "right" && dragState.x > 0}
                  isWrong={feedback ? feedback.side === "right" && !feedback.isCorrect : false}
                  progress={Math.min(rightHighlight + Math.abs(dragState.x) / 300, 1)}
                />
              </div>

              <div className="relative mt-5">
                <div className="absolute inset-x-4 top-0 h-1 rounded-full bg-muted/70">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary via-chart-2 to-chart-1 transition-all duration-300"
                    style={{ width: `${Math.max(progress * 100, 4)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between pt-3 text-sm text-muted-foreground">
                  <span>{currentIndex + 1} / {session.totalQuestions}</span>
                  <span>{answeredCount} dijawab</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
            <Card className={cn("border shadow-sm transition-colors", feedbackClassName)}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Kartu Geser</CardTitle>
              </CardHeader>
              <CardContent className="pb-5">
                <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch">
                  <ActionButton
                    side="left"
                    label="Kiri"
                    meaning={activeQuestion.leftOption}
                    active={selectedSide === "left"}
                    correct={feedback ? feedback.side === "left" && feedback.isCorrect : false}
                    wrong={feedback ? feedback.side === "left" && !feedback.isCorrect : false}
                    onClick={() => commitAnswer("left")}
                    disabled={isLocked}
                  />

                  <div className="hidden items-center justify-center sm:flex">
                    <div className="flex h-full min-h-24 flex-col items-center justify-center gap-2 rounded-full border border-dashed border-border/70 px-3 py-4 text-muted-foreground">
                      <ArrowLeftIcon className="size-4" />
                      <div className="text-[0.7rem] uppercase tracking-[0.24em]">Swipe</div>
                      <ArrowRightIcon className="size-4" />
                    </div>
                  </div>

                  <ActionButton
                    side="right"
                    label="Kanan"
                    meaning={activeQuestion.rightOption}
                    active={selectedSide === "right"}
                    correct={feedback ? feedback.side === "right" && feedback.isCorrect : false}
                    wrong={feedback ? feedback.side === "right" && !feedback.isCorrect : false}
                    onClick={() => commitAnswer("right")}
                    disabled={isLocked}
                  />
                </div>

                <div className="mt-4 flex flex-col gap-2">
                  {feedback ? (
                    <div
                      className={cn(
                        "rounded-2xl border px-4 py-3 text-sm leading-6",
                        feedback.isCorrect
                          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700"
                          : "border-rose-500/20 bg-rose-500/10 text-rose-700",
                      )}
                    >
                      <div className="font-semibold">
                        {feedback.isCorrect ? "Jawaban benar." : "Jawaban belum tepat."}
                      </div>
                      <div className="mt-1">
                        {feedback.isCorrect
                          ? `Makna "${feedback.selectedMeaning}" benar untuk kata ${activeQuestion.word}.`
                          : `Jawaban benar adalah "${currentMeaning}". Pilihan yang kamu pilih: "${feedback.selectedMeaning}".`}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-border/70 bg-secondary/25 px-4 py-3 text-sm leading-6 text-muted-foreground">
                      Klik tombol kiri/kanan atau geser kartu ke arah jawaban yang kamu pilih.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-border/70 bg-card/95 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-base">Kartu Utama</CardTitle>
                  <Badge
                    variant={
                      topState === "correct"
                        ? "default"
                        : topState === "wrong"
                          ? "destructive"
                          : "outline"
                    }
                    className="rounded-full"
                  >
                    {topState === "correct"
                      ? "Jawaban benar"
                      : topState === "wrong"
                        ? "Jawaban salah"
                        : topState === "left"
                          ? "Geser kiri"
                          : topState === "right"
                            ? "Geser kanan"
                            : "Siap dimainkan"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-5">
                <div className="relative min-h-[22rem]">
                  <div
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerCancel}
                    className={cn(
                      "absolute inset-0 flex cursor-grab flex-col justify-between rounded-[2rem] border border-border/70 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.96),rgba(248,250,252,0.92))] p-5 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.35)] transition-transform duration-150 ease-out",
                      isDragging && "cursor-grabbing transition-none",
                      animatingSide === "left" && "ring-2 ring-rose-500/30",
                      animatingSide === "right" && "ring-2 ring-emerald-500/30",
                    )}
                    style={{
                      transform: cardTransform,
                      opacity: feedback && !feedback.isCorrect ? 0.96 : 1,
                      boxShadow: `0 24px 70px -36px rgba(15, 23, 42, 0.35), ${
                        dragState.x < 0
                          ? `-24px 0 0 -18px rgba(244,63,94,${Math.min(Math.abs(dragState.x) / 420, 0.3)})`
                          : dragState.x > 0
                            ? `24px 0 0 -18px rgba(34,197,94,${Math.min(Math.abs(dragState.x) / 420, 0.3)})`
                            : "none"
                      }`,
                    }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <Badge variant="outline" className="rounded-full bg-background/80">
                        {session.config.type === "all"
                          ? "Campuran"
                          : vocabularyGameTypeLabels[session.config.type]}
                      </Badge>
                      <div className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
                        Geser untuk menjawab
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col items-center justify-center gap-4">
                      <div className="flex flex-wrap justify-center gap-2">
                        <Badge variant="soft" className="rounded-full">
                          {vocabularyGameLanguageLabels[session.config.language]}
                        </Badge>
                        <Badge variant="soft" className="rounded-full">
                          {vocabularyGameDifficultyLabels[session.config.difficulty]}
                        </Badge>
                      </div>
                      <div className="max-w-full text-balance text-center text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                        {activeQuestion.word}
                      </div>
                      <div className="max-w-[24rem] text-center text-sm leading-7 text-muted-foreground">
                        Pilih makna yang paling tepat. Kartu ini bisa ditarik ke kiri atau ke kanan,
                        dan posisi jawaban benar diacak di setiap soal.
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <MiniAnswerChip
                        side="left"
                        label="Kiri"
                        meaning={activeQuestion.leftOption}
                        active={selectedSide === "left"}
                        correct={feedback ? feedback.side === "left" && feedback.isCorrect : false}
                        wrong={feedback ? feedback.side === "left" && !feedback.isCorrect : false}
                      />
                      <MiniAnswerChip
                        side="right"
                        label="Kanan"
                        meaning={activeQuestion.rightOption}
                        active={selectedSide === "right"}
                        correct={feedback ? feedback.side === "right" && feedback.isCorrect : false}
                        wrong={feedback ? feedback.side === "right" && !feedback.isCorrect : false}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <aside className="space-y-4">
          <Card className="border-border/70 bg-card/95 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Ringkasan Sesi</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <SummaryMetric label="Soal Tersisa" value={String(session.totalQuestions - answeredCount)} icon={<Clock3Icon />} />
              <SummaryMetric label="Benar" value={String(correctCount)} icon={<CheckCircle2Icon />} />
              <SummaryMetric label="Salah" value={String(wrongCount)} icon={<TriangleAlertIcon />} />
              <SummaryMetric label="Akurasi" value={`${accuracy}%`} icon={<SparklesIcon />} />
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/95 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Aturan Main</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>
                Setiap kartu hanya menyimpan data di memori browser. Refresh akan membuat sesi baru dari
                awal.
              </p>
              <p>
                Jawaban benar dipilih dari <span className="font-medium text-foreground">correct_meaning</span>{" "}
                dan jawaban salah diambil acak dari <span className="font-medium text-foreground">wrong_options</span>.
              </p>
              <p>
                Sesi ini sudah diacak server-side, lalu dikirim ke client sebagai daftar soal yang siap
                dimainkan.
              </p>
            </CardContent>
          </Card>
        </aside>
      </section>
    </main>
  )
}

function AnswerLane({
  side,
  title,
  meaning,
  isActive,
  isCorrect,
  isWrong,
  progress,
}: {
  side: "left" | "right"
  title: string
  meaning: string
  isActive: boolean
  isCorrect: boolean
  isWrong: boolean
  progress: number
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border p-4 transition-all duration-200",
        side === "left" ? "bg-rose-500/5" : "bg-emerald-500/5",
        isActive && "border-primary/30 shadow-sm",
        isCorrect && "border-emerald-500/30 bg-emerald-500/10",
        isWrong && "border-rose-500/30 bg-rose-500/10",
      )}
    >
      <div className="absolute inset-y-0 left-0 w-1 bg-current opacity-20" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            {title}
          </div>
          <div className="mt-2 text-base font-medium leading-7 text-foreground">{meaning}</div>
        </div>
        <Badge variant="outline" className="rounded-full">
          {side === "left" ? "↤" : "↦"}
        </Badge>
      </div>
      <div className="mt-4 h-1.5 rounded-full bg-background/70">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-200",
            side === "left" ? "bg-rose-500/80" : "bg-emerald-500/80",
          )}
          style={{ width: `${Math.min(Math.max(progress * 100, 6), 100)}%` }}
        />
      </div>
    </div>
  )
}

function ActionButton({
  side,
  label,
  meaning,
  active,
  correct,
  wrong,
  onClick,
  disabled,
}: {
  side: "left" | "right"
  label: string
  meaning: string
  active: boolean
  correct: boolean
  wrong: boolean
  onClick: () => void
  disabled: boolean
}) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "h-auto min-h-28 w-full justify-start rounded-2xl border p-4 text-left transition-all duration-200",
        side === "left" ? "hover:border-rose-500/30" : "hover:border-emerald-500/30",
        active && "border-primary/30 bg-primary/5",
        correct && "border-emerald-500/30 bg-emerald-500/10 text-emerald-800",
        wrong && "border-rose-500/30 bg-rose-500/10 text-rose-800",
      )}
    >
      <div className="flex h-full w-full flex-col justify-between gap-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            {label}
          </span>
          <span className="text-lg font-semibold">{side === "left" ? "↤" : "↦"}</span>
        </div>
        <div className="text-sm leading-6 text-foreground">{meaning}</div>
      </div>
    </Button>
  )
}

function MiniAnswerChip({
  side,
  label,
  meaning,
  active,
  correct,
  wrong,
}: {
  side: "left" | "right"
  label: string
  meaning: string
  active: boolean
  correct: boolean
  wrong: boolean
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3 transition-all duration-200",
        side === "left" ? "bg-rose-500/5" : "bg-emerald-500/5",
        active && "border-primary/30 bg-primary/5",
        correct && "border-emerald-500/30 bg-emerald-500/10",
        wrong && "border-rose-500/30 bg-rose-500/10",
      )}
    >
      <div className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 text-sm leading-6 text-foreground">{meaning}</div>
    </div>
  )
}

function SummaryMetric({
  label,
  value,
  icon,
}: {
  label: string
  value: string
    icon: ReactNode
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-secondary/30 px-4 py-3">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        <span className="flex size-8 items-center justify-center rounded-full bg-background text-foreground [&_svg]:size-4">
          {icon}
        </span>
        {label}
      </div>
      <div className="mt-3 text-2xl font-semibold text-foreground">{value}</div>
    </div>
  )
}

function InfoStrip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card px-4 py-3">
      <div className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 text-sm font-medium text-foreground">{value}</div>
    </div>
  )
}

function getTopBarState(
  question: VocabularyGameQuestion | null,
  feedback: AnswerFeedback | null,
  animatingSide: "left" | "right" | null,
  dragX: number,
) {
  if (feedback) {
    return feedback.isCorrect ? "correct" : "wrong"
  }

  if (animatingSide) {
    return animatingSide === "left" ? "left" : "right"
  }

  if (!question) {
    return "neutral"
  }

  if (dragX < 0) {
    return "left"
  }

  if (dragX > 0) {
    return "right"
  }

  return "neutral"
}
