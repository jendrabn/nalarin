import type { ReactNode } from "react"
import { FileTextIcon } from "lucide-react"

import { EmptyState } from "@/components/empty-state"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"

import { QuestionContent } from "./question-content"
import { QuestionExplanationPanel } from "./question-explanation-panel"
import { QuestionOptionField } from "./question-option-field"
import type { QuestionAnswerLike, QuestionRoomLike } from "../types"
import type { AiExplanationAccess } from "@/features/ai-explanations/types"

export function QuestionReviewCard({
  question,
  answer,
  statusBadge,
  questionBadges,
  answerLabel,
  correctAnswerLabel,
  explanationEmptyTitle = "Pembahasan belum tersedia",
  explanationEmptyDescription = "Admin belum menambahkan pembahasan untuk soal ini.",
  explanationAvailable = true,
  aiExplanation,
  readingMode = "default",
  className,
}: {
  question: QuestionRoomLike & { question: { title: string | null; content: string; imageUrl: string | null; explanation: string | null } }
  answer: QuestionAnswerLike | null
  statusBadge: ReactNode
  questionBadges: ReactNode
  answerLabel: string
  correctAnswerLabel: string
  explanationEmptyTitle?: string
  explanationEmptyDescription?: string
  explanationAvailable?: boolean
  aiExplanation?: AiExplanationAccess
  readingMode?: "default" | "comfortable"
  className?: string
}) {
  const safeAnswer = answer ?? {
    selectedOptionKeys: [],
    answerText: "",
    isCorrect: null,
    gradedAt: null,
  }
  const answerIsEmpty =
    !answer || (answer.answerText.trim().length === 0 && answer.selectedOptionKeys.length === 0)
  const hasAiExplanation = Boolean(aiExplanation)
  const explanationQuestion = explanationAvailable
    ? question
    : {
        ...question,
        question: {
          ...question.question,
          explanation: null,
        },
      }

  return (
    <Card className={cn("gap-0 overflow-hidden py-0 shadow-sm", className)}>
      <CardHeader className="px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {questionBadges}
              {statusBadge}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-6 px-4 pb-5 pt-1 sm:px-5">
        <QuestionContent
          title={question.question.title ? null : undefined}
          content={question.question.content}
          imageUrl={question.question.imageUrl}
          readingMode={readingMode}
        />

        <QuestionOptionField
          question={question}
          answer={safeAnswer}
          readOnly
          feedbackMode="review"
          readingMode={readingMode}
        />

        <div className="flex flex-col gap-3 rounded-xl border bg-muted/25 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span
              className={cn(
                "inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                answerIsEmpty
                  ? "bg-muted text-muted-foreground"
                  : answer && answer.isCorrect === false
                  ? "border-destructive/35 bg-destructive/10 text-destructive"
                  : "border-chart-2/35 bg-chart-2/10 text-chart-2",
              )}
            >
              <FileTextIcon className="size-3.5" />
              {answerIsEmpty
                ? "Jawaban Kosong"
                : answer && answer.isCorrect === false
                  ? "Jawaban Belum Tepat"
                  : "Jawaban Benar"}
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <AnswerBox
              label="Jawaban kamu"
              value={answerLabel}
              muted={answerIsEmpty}
              readingMode={readingMode}
            />
            <AnswerBox label="Jawaban benar" value={correctAnswerLabel} readingMode={readingMode} />
          </div>

          {explanationAvailable || hasAiExplanation ? (
            <QuestionExplanationPanel
              question={explanationQuestion}
              aiExplanation={aiExplanation}
              emptyTitle={explanationEmptyTitle}
              emptyDescription={explanationEmptyDescription}
              className="mt-1"
              readingMode={readingMode}
            />
          ) : (
            <EmptyState title={explanationEmptyTitle} className="py-7" />
            )}
        </div>
      </CardContent>
    </Card>
  )
}

function AnswerBox({
  label,
  value,
  muted,
  readingMode = "default",
}: {
  label: string
  value: string
  muted?: boolean
  readingMode?: "default" | "comfortable"
}) {
  const isComfortable = readingMode === "comfortable"

  return (
    <div className="rounded-lg border bg-background p-3">
      <p className={cn("text-muted-foreground", isComfortable ? "text-sm" : "text-xs")}>{label}</p>
      <p
        className={cn(
          "mt-1 font-medium",
          isComfortable ? "text-base leading-7" : "text-sm",
          muted && "text-muted-foreground",
        )}
      >
        {value}
      </p>
    </div>
  )
}
