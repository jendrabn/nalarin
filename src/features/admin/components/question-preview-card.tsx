"use client"

import type { ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { QuestionContent } from "@/features/question-room/components/question-content"
import { QuestionOptionField } from "@/features/question-room/components/question-option-field"
import type { QuestionAnswerLike, QuestionRoomLike } from "@/features/question-room/types"
import type { QuestionStatus } from "@/features/admin/questions/constants"
import { getModelEnumBadgeMeta } from "@/lib/model-enums"
import { cn } from "@/lib/utils"

type QuestionPreviewOption = {
  label: string
  content: string
  imageUrl: string | null
  isCorrect: boolean
}

export type QuestionPreviewCardQuestion = {
  id: number
  orderLabel: ReactNode
  title: string | null
  content: string
  imageUrl: string | null
  explanation: string | null
  type: QuestionRoomLike["question"]["type"]
  status: QuestionStatus
  subjectName: string
  topicName: string | null
  year: number | null
  points: number
  correctAnswerText: string | null
  options: QuestionPreviewOption[]
}

export function QuestionPreviewCard({
  question,
  className,
}: {
  question: QuestionPreviewCardQuestion
  className?: string
}) {
  const typeBadge = getModelEnumBadgeMeta("questionType", question.type)
  const statusBadge = getModelEnumBadgeMeta("contentStatus", question.status)
  const correctOptionLabels = question.options
    .filter((option) => option.isCorrect)
    .map((option) => option.label)

  const roomQuestion: QuestionRoomLike = {
    id: question.id,
    question: {
      title: question.title,
      content: question.content,
      imageUrl: question.imageUrl,
      type: question.type,
      explanation: question.explanation,
    },
    options: question.options.map((option) => ({
      label: option.label,
      content: option.content,
      imageUrl: option.imageUrl,
    })),
    correctAnswer: {
      optionKeys: correctOptionLabels,
      answerText: question.correctAnswerText,
    },
  }

  const answer: QuestionAnswerLike = {
    selectedOptionKeys: [],
    answerText: question.correctAnswerText ?? "",
    isCorrect: null,
    gradedAt: null,
  }

  return (
    <Card className={cn("gap-0 overflow-hidden py-0 shadow-sm", className)}>
      <CardHeader className="px-4 py-3 sm:px-4">
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="px-2 py-0.5 text-[11px]">
              {question.orderLabel}
            </Badge>
            <Badge variant="soft" className={cn(typeBadge.className, "px-2 py-0.5 text-[11px]")}>
              {typeBadge.label}
            </Badge>
            <Badge variant="soft" className={cn(statusBadge.className, "px-2 py-0.5 text-[11px]")}>
              {statusBadge.label}
            </Badge>
            <Badge variant="outline" className="px-2 py-0.5 text-[11px]">
              {question.points} pts
            </Badge>
            {question.year ? (
              <Badge variant="outline" className="px-2 py-0.5 text-[11px]">
                {question.year}
              </Badge>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="font-medium text-foreground">{question.subjectName}</span>
            {question.topicName ? <span>/{question.topicName}</span> : null}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 px-4 pb-4 pt-0 sm:px-4">
        <QuestionContent
          title={question.title ?? undefined}
          content={question.content}
          imageUrl={question.imageUrl}
          titleClassName="text-sm"
          contentClassName="text-sm leading-6"
        />

        <QuestionOptionField
          question={roomQuestion}
          answer={answer}
          readOnly
          feedbackMode="review"
        />

        {question.explanation ? (
          <div className="rounded-xl border border-border/60 bg-muted/20 px-3 py-3">
            <QuestionContent
              title="Pembahasan"
              content={question.explanation}
              titleClassName="text-sm font-semibold"
              contentClassName="text-sm leading-6"
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
