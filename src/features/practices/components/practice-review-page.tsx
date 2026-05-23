"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeftIcon, FileTextIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { PageHeader } from "@/components/page-header"
import { cn } from "@/lib/utils"

import { QuestionReviewWorkspace } from "@/features/question-room/components"

import type { PracticeSessionReviewQuestion, PracticeSessionSummary } from "../types"

export function PracticeReviewPage({
  summary,
  aiExplanationEnabled = false,
}: {
  summary: PracticeSessionSummary
  aiExplanationEnabled?: boolean
}) {
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0)
  const reviewQuestions = summary.questions
  const activeQuestion = reviewQuestions[activeQuestionIndex] ?? reviewQuestions[0]

  return (
    <main className="min-h-svh bg-muted/35 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <PageHeader
          className="mb-0"
          title={`Review Jawaban ${summary.title}`}
          subtitle="Tinjau ulang jawaban, koreksi benar-salah, dan pembahasan tiap soal."
          actions={
            <Button asChild variant="outline">
              <Link href={`/practice-sessions/${summary.id}/result`}>
                <ArrowLeftIcon data-icon="inline-start" />
                Kembali ke Hasil
              </Link>
            </Button>
          }
        />

        {reviewQuestions.length > 0 && activeQuestion ? (
          <QuestionReviewWorkspace
            readingMode="comfortable"
            items={reviewQuestions.map((question, index) => ({
              id: question.id,
              label: question.orderIndex,
              active: index === activeQuestionIndex,
              answered: question.status !== "unanswered",
              status: question.status,
              ariaLabel: `Buka soal ${question.orderIndex}`,
            }))}
            activeIndex={activeQuestionIndex}
            onActiveIndexChange={setActiveQuestionIndex}
            question={activeQuestion}
            answer={activeQuestion.answer}
            statusBadge={<StatusBadge status={activeQuestion.status} />}
            questionBadges={
              <>
                <span className="inline-flex items-center rounded-full border bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                  Soal {activeQuestionIndex + 1} / {reviewQuestions.length}
                </span>
                <span className="inline-flex items-center rounded-full border bg-background px-2.5 py-0.5 text-xs font-medium text-foreground">
                  {formatNumber(activeQuestion.points)} Poin
                </span>
              </>
            }
            answerLabel={getUserAnswerLabel(activeQuestion)}
            correctAnswerLabel={getCorrectAnswerLabel(activeQuestion)}
            aiExplanation={{
              enabled: aiExplanationEnabled,
              sessionType: "practice",
              sessionId: summary.id,
              sessionQuestionId: activeQuestion.id,
            }}
          />
        ) : (
          <Empty className="min-h-[24rem] border bg-card">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileTextIcon />
              </EmptyMedia>
              <EmptyTitle>Tidak Ada Soal untuk Ditinjau</EmptyTitle>
              <EmptyDescription>
                Sesi latihan ini belum memiliki data soal yang bisa dibuka dalam mode review.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>
    </main>
  )
}

function StatusBadge({ status }: { status: PracticeSessionReviewQuestion["status"] }) {
  const meta = getStatusMeta(status)

  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", meta.className)}>
      {meta.label}
    </span>
  )
}

function getStatusMeta(status: PracticeSessionReviewQuestion["status"]) {
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

  return {
    label: "Kosong",
    className: "bg-muted text-muted-foreground",
  }
}

function getUserAnswerLabel(question: PracticeSessionReviewQuestion) {
  if (!question.answer) {
    return "Kosong"
  }

  if (question.answer.selectedOptionKeys.length > 0) {
    return question.answer.selectedOptionKeys.join(", ")
  }

  return question.answer.answerText.trim() || "Kosong"
}

function getCorrectAnswerLabel(question: PracticeSessionReviewQuestion) {
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
