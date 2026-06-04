"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"

import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { cn } from "@/lib/utils"

import { QuestionReviewWorkspace } from "@/features/question-room/components"

import type { TryoutReviewData, TryoutReviewQuestion, TryoutReviewSection } from "../types"

export function TryoutReviewPage({ data }: { data: TryoutReviewData }) {
  const explanationsAvailable =
    data.explanationRelease.available && data.explanationRelease.allowedByPlan
  const aiExplanationEnabled = data.explanationRelease.aiAllowedByPlan === true
  const reviewEntries = useMemo(() => buildReviewEntries(data.sections), [data.sections])
  const sectionEntries = useMemo(() => buildSectionEntries(reviewEntries), [reviewEntries])
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0)
  const activeEntry = reviewEntries[activeQuestionIndex] ?? reviewEntries[0]

  return (
    <main className="min-h-svh bg-muted/35 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <PageHeader
          className="mb-0"
          title={`Review Jawaban ${data.session.title}`}
          subtitle="Tinjau jawaban untuk melihat status benar-salah dan pembahasan tiap soal."
          actions={
            <Button asChild variant="ghost">
              <Link href={`/tryout-sessions/${data.session.id}/result`}>
                <ArrowLeftIcon data-icon="inline-start" />
                Kembali ke Hasil
              </Link>
            </Button>
          }
        />

        {!data.resultRelease.available ? (
          <EmptyState title="Review Belum Tersedia" className="min-h-[24rem]" />
        ) : reviewEntries.length > 0 && activeEntry ? (
          <>
            <ReviewSectionTabs
              sectionEntries={sectionEntries}
              reviewEntries={reviewEntries}
              activeQuestionIndex={activeQuestionIndex}
              onSectionChange={setActiveQuestionIndex}
            />
            <QuestionReviewWorkspace
              readingMode="comfortable"
              items={reviewEntries.map((entry) => ({
                id: entry.question.id,
                label: entry.globalIndex + 1,
                active: entry.globalIndex === activeQuestionIndex,
                answered: entry.question.status !== "unanswered",
                status: entry.question.status === "pending" ? "pending" : entry.question.status,
                ariaLabel: `Buka soal ${entry.globalIndex + 1}`,
              }))}
              activeIndex={activeQuestionIndex}
              onActiveIndexChange={setActiveQuestionIndex}
              question={activeEntry.question}
              answer={activeEntry.question.answer}
              statusBadge={<StatusBadge status={activeEntry.question.status} />}
              questionBadges={
                <>
                  <span className="inline-flex items-center rounded-full border bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                    Soal {activeQuestionIndex + 1} / {reviewEntries.length}
                  </span>
                  <span className="inline-flex items-center rounded-full border bg-background px-2.5 py-0.5 text-xs font-medium text-foreground">
                    {formatNumber(activeEntry.question.points)} Poin
                  </span>
                </>
              }
              answerLabel={getUserAnswerLabel(activeEntry.question)}
              correctAnswerLabel={getCorrectAnswerLabel(activeEntry.question)}
              explanationAvailable={explanationsAvailable}
              aiExplanation={{
                enabled: aiExplanationEnabled,
                sessionType: "tryout",
                sessionId: data.session.id,
                sessionQuestionId: activeEntry.question.id,
              }}
              explanationEmptyTitle={
                explanationsAvailable || aiExplanationEnabled
                  ? "Pembahasan belum tersedia"
                  : "Pembahasan Terkunci"
              }
              explanationEmptyDescription={
                explanationsAvailable
                  ? "Admin belum menambahkan pembahasan untuk soal ini."
                  : aiExplanationEnabled
                    ? "Pembahasan manual belum tersedia. Kamu tetap bisa meminta Pembahasan AI."
                    : "Pembahasan mengikuti jadwal rilis dan akses paket aktif."
              }
            />
          </>
        ) : (
          <EmptyState
            title="Tidak Ada Soal Untuk Ditinjau"
            className="min-h-[24rem]"
          />
        )}
      </div>
    </main>
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
    const activeSection = sectionEntries.find((section) => section.section.id === activeSectionId)

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

function StatusBadge({ status }: { status: TryoutReviewQuestion["status"] }) {
  const meta = getStatusMeta(status)

  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", meta.className)}>
      {meta.label}
    </span>
  )
}

function getStatusMeta(status: TryoutReviewQuestion["status"]) {
  if (status === "correct") {
    return {
      label: "Benar",
      className: "border-chart-2/35 bg-chart-2/10 text-chart-2",
    }
  }

  if (status === "wrong") {
    return {
      label: "Salah",
      className: "border-destructive/35 bg-destructive/10 text-destructive",
    }
  }

  if (status === "pending") {
    return {
      label: "Diproses",
      className: "border-chart-3/35 bg-chart-3/10 text-chart-3",
    }
  }

  return {
    label: "Kosong",
    className: "bg-muted text-muted-foreground",
  }
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
