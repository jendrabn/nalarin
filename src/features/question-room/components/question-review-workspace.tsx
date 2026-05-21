"use client"

import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react"
import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"

import { QuestionNavigation, type QuestionNavigatorItem, type QuestionNavigatorLegendItem } from "./question-navigation"
import { QuestionReviewCard } from "./question-review-card"
import type { QuestionAnswerLike, QuestionRoomLike } from "../types"

export function QuestionReviewWorkspace({
  items,
  activeIndex,
  onActiveIndexChange,
  question,
  answer,
  statusBadge,
  questionBadges,
  answerLabel,
  correctAnswerLabel,
  legendItems,
  explanationAvailable = true,
  explanationEmptyTitle,
  explanationEmptyDescription,
  navigationTitle = "Navigasi Soal",
  className,
}: {
  items: QuestionNavigatorItem[]
  activeIndex: number
  onActiveIndexChange: (index: number) => void
  question: QuestionRoomLike & {
    question: {
      title: string | null
      content: string
      imageUrl: string | null
      explanation: string | null
    }
  }
  answer: QuestionAnswerLike | null
  statusBadge: ReactNode
  questionBadges: ReactNode
  answerLabel: string
  correctAnswerLabel: string
  legendItems?: QuestionNavigatorLegendItem[]
  explanationAvailable?: boolean
  explanationEmptyTitle?: string
  explanationEmptyDescription?: string
  navigationTitle?: string
  className?: string
}) {
  const canGoPrevious = activeIndex > 0
  const canGoNext = activeIndex < items.length - 1

  return (
    <div className={className ?? "grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start"}>
      <QuestionNavigation
        title={navigationTitle}
        items={items}
        legendItems={legendItems}
        onSelect={onActiveIndexChange}
      />

      <div className="flex min-w-0 flex-col gap-6">
        <QuestionReviewCard
          question={question}
          answer={answer}
          statusBadge={statusBadge}
          questionBadges={questionBadges}
          answerLabel={answerLabel}
          correctAnswerLabel={correctAnswerLabel}
          explanationAvailable={explanationAvailable}
          explanationEmptyTitle={explanationEmptyTitle}
          explanationEmptyDescription={explanationEmptyDescription}
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
            onClick={() => onActiveIndexChange(Math.min(items.length - 1, activeIndex + 1))}
            disabled={!canGoNext}
            className="w-full sm:w-auto"
          >
            Berikutnya
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
        </div>
      </div>
    </div>
  )
}
