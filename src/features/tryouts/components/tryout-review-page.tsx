"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  CircleSlashIcon,
  ClockIcon,
  FileTextIcon,
  LockIcon,
  ArrowRightIcon,
  XCircleIcon,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"
import { Checkbox } from "@/components/ui/checkbox"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { cn } from "@/lib/utils"

import type { TryoutReviewData, TryoutReviewQuestion, TryoutReviewSection } from "../types"

export function TryoutReviewPage({ data }: { data: TryoutReviewData }) {
  const explanationsAvailable =
    data.explanationRelease.available && data.explanationRelease.allowedByPlan
  const reviewEntries = useMemo(() => buildReviewEntries(data.sections), [data.sections])
  const sectionEntries = useMemo(() => buildSectionEntries(reviewEntries), [reviewEntries])
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0)

  return (
    <main className="min-h-svh bg-muted/35 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <PageHeader
          className="mb-0"
          title={`Review Jawaban ${data.session.title}`}
          subtitle="Telaah jawaban, status benar-salah, dan pembahasan tiap soal."
          actions={
            <Button asChild variant="outline">
              <Link href={`/tryout-sessions/${data.session.id}/result`}>
                <ArrowLeftIcon data-icon="inline-start" />
                Kembali ke Hasil
              </Link>
            </Button>
          }
        />

        {!data.resultRelease.available ? (
          <Empty className="min-h-[24rem] border bg-card">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ClockIcon />
              </EmptyMedia>
              <EmptyTitle>Review Belum Tersedia</EmptyTitle>
              <EmptyDescription>
                Review jawaban mengikuti jadwal rilis hasil tryout.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            {!explanationsAvailable ? (
              <ExplanationNotice data={data} />
            ) : null}

            {reviewEntries.length > 0 ? (
              <>
                <ReviewSectionTabs
                  sectionEntries={sectionEntries}
                  reviewEntries={reviewEntries}
                  activeQuestionIndex={activeQuestionIndex}
                  onSectionChange={setActiveQuestionIndex}
                />
                <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
                  <ReviewSidebar
                    reviewEntries={reviewEntries}
                    activeIndex={activeQuestionIndex}
                    onQuestionChange={setActiveQuestionIndex}
                  />
                  <ReviewNavigator
                    reviewEntries={reviewEntries}
                    explanationsAvailable={explanationsAvailable}
                    activeIndex={activeQuestionIndex}
                    onActiveIndexChange={setActiveQuestionIndex}
                  />
                </div>
              </>
            ) : (
              <Empty className="min-h-[24rem] border bg-card">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <FileTextIcon />
                  </EmptyMedia>
                  <EmptyTitle>Tidak Ada Soal untuk Ditinjau</EmptyTitle>
                  <EmptyDescription>
                    Tryout ini belum memiliki data soal yang bisa dibuka dalam mode review.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </>
        )}
      </div>
    </main>
  )
}

function ReviewSidebar({
  reviewEntries,
  activeIndex,
  onQuestionChange,
}: {
  reviewEntries: ReviewQuestionEntry[]
  activeIndex: number
  onQuestionChange: (index: number) => void
}) {
  return (
    <aside>
      <Card className="gap-0 overflow-hidden py-0 shadow-sm">
        <CardContent className="p-4">
          <ReviewQuestionNavigation
            reviewEntries={reviewEntries}
            activeIndex={activeIndex}
            onActiveIndexChange={onQuestionChange}
          />
        </CardContent>
      </Card>
    </aside>
  )
}

function ReviewNavigator({
  reviewEntries,
  explanationsAvailable,
  activeIndex,
  onActiveIndexChange,
}: {
  reviewEntries: ReviewQuestionEntry[]
  explanationsAvailable: boolean
  activeIndex: number
  onActiveIndexChange: (index: number) => void
}) {
  const activeEntry = reviewEntries[activeIndex] ?? reviewEntries[0]

  if (!activeEntry) {
    return null
  }

  const activeStatusMeta = getStatusMeta(activeEntry.question.status)
  const canGoPrevious = activeIndex > 0
  const canGoNext = activeIndex < reviewEntries.length - 1

  return (
    <Card className="gap-0 overflow-hidden py-0 shadow-sm">
      <CardContent className="flex flex-col gap-6 px-4 pb-5 pt-4 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">
              Soal {activeIndex + 1} / {reviewEntries.length}
            </Badge>
            <Badge variant="outline">{formatNumber(activeEntry.question.points)} Poin</Badge>
          </div>
          <Badge variant="outline" className={activeStatusMeta.className}>
            {activeStatusMeta.icon}
            {activeStatusMeta.label}
          </Badge>
        </div>
        <ReviewQuestionContent
          question={activeEntry.question}
          explanationsAvailable={explanationsAvailable}
        />

        <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => onActiveIndexChange(Math.max(0, activeIndex - 1))}
            disabled={!canGoPrevious}
            className="w-full sm:w-auto"
          >
            <ArrowLeftIcon data-icon="inline-start" />
            Sebelumnya
          </Button>

          <Button
            type="button"
            onClick={() =>
              onActiveIndexChange(Math.min(reviewEntries.length - 1, activeIndex + 1))
            }
            disabled={!canGoNext}
            className="w-full sm:w-auto"
          >
            Berikutnya
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function ReviewQuestionNavigation({
  reviewEntries,
  activeIndex,
  onActiveIndexChange,
}: {
  reviewEntries: ReviewQuestionEntry[]
  activeIndex: number
  onActiveIndexChange: (index: number) => void
}) {
  const activeEntry = reviewEntries[activeIndex] ?? reviewEntries[0]
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!activeEntry) {
      return
    }

    containerRef.current
      ?.querySelector<HTMLButtonElement>(`[data-question-index="${activeIndex}"]`)
      ?.scrollIntoView({
        block: "nearest",
        inline: "center",
        behavior: "smooth",
      })
  }, [activeEntry, activeIndex])

  if (!activeEntry) {
    return null
  }

  return (
    <div ref={containerRef} className="max-w-full overflow-x-auto pb-1">
      <div className="grid w-max grid-cols-5 gap-2 sm:grid-cols-6 lg:grid-cols-5">
        {reviewEntries.map((entry) => {
          const isActive = entry.globalIndex === activeIndex
          const inView = activeEntry.section.id === entry.section.id

          return (
            <button
              key={entry.question.id}
              type="button"
              data-question-index={entry.globalIndex}
              onClick={() => onActiveIndexChange(entry.globalIndex)}
              aria-current={isActive ? "step" : undefined}
              className={cn(
                "grid size-10 place-items-center rounded-full border text-sm font-semibold transition-colors",
                isActive
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : inView
                    ? "border-border bg-background text-foreground hover:border-primary/40 hover:text-foreground"
                    : "border-border/70 bg-background/70 text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              {entry.globalIndex + 1}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ReviewSectionTabs({
  sectionEntries,
  reviewEntries,
  activeQuestionIndex,
  onSectionChange,
}: {
  sectionEntries: ReviewSectionEntry[]
  reviewEntries: ReviewQuestionEntry[]
  activeQuestionIndex: number
  onSectionChange: (index: number) => void
}) {
  const activeSectionId = reviewEntries[activeQuestionIndex]?.section.id
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const activeSection = sectionEntries.find(
      (section) => section.section.id === activeSectionId,
    )

    if (!activeSection) {
      return
    }

    containerRef.current
      ?.querySelector<HTMLButtonElement>(`[data-section-id="${activeSection.section.id}"]`)
      ?.scrollIntoView({
        block: "nearest",
        inline: "center",
        behavior: "smooth",
      })
  }, [activeSectionId, sectionEntries])

  return (
    <div
      ref={containerRef}
      aria-label="Filter Subtes"
      className="flex w-full flex-wrap gap-2 pb-1"
    >
      {sectionEntries.map((section) => {
        const active = section.section.id === activeSectionId

        return (
          <Button
            key={section.section.id}
            type="button"
            aria-pressed={active}
            data-section-id={section.section.id}
            onClick={() => onSectionChange(section.firstQuestionIndex)}
            variant={active ? "default" : "outline"}
            size="xl"
            className={cn(
              "max-w-full shrink-0 justify-start rounded-full text-[0.9rem] font-medium tracking-normal shadow-sm",
              !active && "text-muted-foreground hover:border-primary/30 hover:text-foreground",
            )}
          >
            <span className="min-w-0 truncate">{section.section.title}</span>
          </Button>
        )
      })}
    </div>
  )
}

function ExplanationNotice({ data }: { data: TryoutReviewData }) {
  if (!data.explanationRelease.allowedByPlan) {
    return (
      <Alert>
        <LockIcon />
        <AlertTitle>Pembahasan Lengkap Termasuk Fitur Premium</AlertTitle>
        <AlertDescription>
          Kamu tetap bisa melihat status jawaban dan kunci jawaban. Pembahasan lengkap mengikuti
          akses paket aktif.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert>
      <ClockIcon />
      <AlertTitle>Pembahasan Belum Dirilis</AlertTitle>
      <AlertDescription>
        Pembahasan akan ditampilkan sesuai jadwal rilis yang ditentukan admin.
      </AlertDescription>
    </Alert>
  )
}

function ReviewQuestionContent({
  question,
  explanationsAvailable,
}: {
  question: TryoutReviewQuestion
  explanationsAvailable: boolean
}) {
  return (
    <article className="flex flex-col gap-4">
      {question.question.title ? (
        <h2 className="text-base font-semibold text-foreground">
          {question.question.title}
        </h2>
      ) : null}

      <div
        className="text-sm leading-7 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5"
        dangerouslySetInnerHTML={{ __html: question.question.content }}
      />

      {question.options.length > 0 ? (
        <div className="grid gap-2">
          {question.options.map((option) => {
            const selected = question.answer?.selectedOptionKeys.includes(option.label) ?? false
            const correct = question.correctAnswer.optionKeys.includes(option.label)

            return (
              <div
                key={`${question.id}-${option.label}`}
                className={cn(
                  "flex items-center gap-3 rounded-lg border bg-background p-3 text-sm",
                  selected && question.status === "correct" && "border-chart-2/35 bg-chart-2/10",
                  selected && question.status === "wrong" && "border-destructive/35 bg-destructive/10",
                  correct && "border-primary/35 bg-primary/10",
                )}
              >
                {question.question.type === "multiple_answer" ? (
                  <Checkbox checked={selected} disabled aria-label={`Opsi ${option.label}`} />
                ) : (
                  <span className="grid size-6 shrink-0 place-items-center rounded-full border text-xs font-semibold">
                    {option.label}
                  </span>
                )}
                <span
                  className="leading-6 [&_p]:mb-2"
                  dangerouslySetInnerHTML={{ __html: option.content }}
                />
              </div>
            )
          })}
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        <AnswerBox label="Jawaban Kamu" value={getUserAnswerLabel(question)} muted={question.status === "unanswered"} />
        <AnswerBox label="Jawaban Benar" value={getCorrectAnswerLabel(question)} />
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
          <FileTextIcon className="size-4 text-primary" />
          Pembahasan
        </h3>
        {explanationsAvailable && hasExplanationContent(question) ? (
          <ReviewExplanation question={question} />
        ) : (
          <Empty className="border bg-muted/20 py-7">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileTextIcon />
              </EmptyMedia>
              <EmptyTitle>
                {explanationsAvailable ? "Pembahasan Belum Tersedia" : "Pembahasan Terkunci"}
              </EmptyTitle>
              <EmptyDescription>
                {explanationsAvailable
                  ? "Admin belum menambahkan pembahasan untuk soal ini."
                  : "Pembahasan mengikuti jadwal rilis dan akses paket aktif."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>
    </article>
  )
}

function ReviewExplanation({ question }: { question: TryoutReviewQuestion }) {
  return (
    <div className="flex flex-col gap-3">
      {getExplanationItems(question).map((item) => (
        <section key={item.label} className="rounded-lg border bg-muted/25 p-4">
          <h4 className="mb-2 text-sm font-semibold">{item.label}</h4>
          <div
            className="text-sm leading-7 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5"
            dangerouslySetInnerHTML={{ __html: item.content }}
          />
        </section>
      ))}
    </div>
  )
}

function AnswerBox({
  label,
  value,
  muted,
}: {
  label: string
  value: string
  muted?: boolean
}) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-sm font-medium", muted && "text-muted-foreground")}>
        {value}
      </p>
    </div>
  )
}

function hasExplanationContent(question: TryoutReviewQuestion) {
  return getExplanationItems(question).length > 0
}

function getExplanationItems(question: TryoutReviewQuestion) {
  const items: Array<{ label: string; content: string }> = []

  if (question.question.explanation) {
    items.push({ label: "Pembahasan", content: question.question.explanation })
  }

  return items
}

function getUserAnswerLabel(question: TryoutReviewQuestion) {
  if (!question.answer) {
    return "Kosong"
  }

  if (question.answer.selectedOptionKeys.length > 0) {
    return question.answer.selectedOptionKeys.join(", ")
  }

  return question.answer.answerText.trim() || "Kosong"
}

function getCorrectAnswerLabel(question: TryoutReviewQuestion) {
  if (question.correctAnswer.optionKeys.length > 0) {
    return question.correctAnswer.optionKeys.join(", ")
  }

  return question.correctAnswer.answerText?.trim() || "-"
}

function getStatusMeta(status: TryoutReviewQuestion["status"]) {
  if (status === "correct") {
    return {
      label: "Benar",
      className: "border-chart-2/35 bg-chart-2/10 text-chart-2",
      icon: <CheckCircle2Icon />,
    }
  }

  if (status === "wrong") {
    return {
      label: "Salah",
      className: "border-destructive/35 bg-destructive/10 text-destructive",
      icon: <XCircleIcon />,
    }
  }

  if (status === "pending") {
    return {
      label: "Diproses",
      className: "border-chart-3/35 bg-chart-3/10 text-chart-3",
      icon: <ClockIcon />,
    }
  }

  return {
    label: "Kosong",
    className: "bg-muted text-muted-foreground",
    icon: <CircleSlashIcon />,
  }
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 2,
  }).format(value)
}

type ReviewQuestionEntry = {
  section: TryoutReviewSection
  question: TryoutReviewQuestion
  globalIndex: number
}

type ReviewSectionEntry = {
  section: TryoutReviewSection
  firstQuestionIndex: number
}

function buildReviewEntries(sections: TryoutReviewData["sections"]) {
  const entries: ReviewQuestionEntry[] = []

  sections.forEach((section) => {
    section.questions.forEach((question) => {
      entries.push({
        section,
        question,
        globalIndex: entries.length,
      })
    })
  })

  return entries
}

function buildSectionEntries(reviewEntries: ReviewQuestionEntry[]) {
  const entries: ReviewSectionEntry[] = []
  const seenSectionIds = new Set<number>()

  reviewEntries.forEach((entry, index) => {
    if (seenSectionIds.has(entry.section.id)) {
      return
    }

    seenSectionIds.add(entry.section.id)
    entries.push({
      section: entry.section,
      firstQuestionIndex: index,
    })
  })

  return entries
}
