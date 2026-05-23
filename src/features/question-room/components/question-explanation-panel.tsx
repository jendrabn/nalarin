import { FileTextIcon } from "lucide-react"

import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { cn } from "@/lib/utils"

import { QuestionAiExplanation } from "./question-ai-explanation"
import { getQuestionExplanationItems } from "../utils"
import type { QuestionRoomLike } from "../types"
import type { AiExplanationAccess } from "@/features/ai-explanations/types"

export function QuestionExplanationPanel({
  question,
  aiExplanation,
  emptyTitle = "Pembahasan belum tersedia",
  emptyDescription = "Admin belum menambahkan pembahasan untuk soal ini.",
  className,
  readingMode = "default",
}: {
  question: Pick<QuestionRoomLike, "question">
  aiExplanation?: AiExplanationAccess
  emptyTitle?: string
  emptyDescription?: string
  className?: string
  readingMode?: "default" | "comfortable"
}) {
  const explanations = getQuestionExplanationItems(question)
  const isComfortable = readingMode === "comfortable"

  if (explanations.length === 0 && !aiExplanation?.enabled) {
    return (
      <Empty className={cn("border bg-muted/20 py-7", className)}>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileTextIcon />
          </EmptyMedia>
          <EmptyTitle>{emptyTitle}</EmptyTitle>
          <EmptyDescription>{emptyDescription}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {aiExplanation?.enabled ? (
        <QuestionAiExplanation
          key={`${aiExplanation.sessionType}-${aiExplanation.sessionId}-${aiExplanation.sessionQuestionId}`}
          access={aiExplanation}
          readingMode={readingMode}
        />
      ) : null}
      {explanations.length === 0 ? (
        <Empty className="border bg-muted/20 py-7">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileTextIcon />
            </EmptyMedia>
            <EmptyTitle>{emptyTitle}</EmptyTitle>
            <EmptyDescription>{emptyDescription}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : null}
      {explanations.map((item) => (
        <section key={item.label} className={cn("rounded-lg border bg-background", isComfortable ? "p-5" : "p-4")}>
          <h3 className={cn("mb-2 font-semibold", isComfortable ? "text-base" : "text-sm")}>{item.label}</h3>
          <div
            className={cn(
              "[&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5",
              isComfortable ? "text-[1.03rem] leading-8" : "text-sm leading-7",
            )}
            dangerouslySetInnerHTML={{ __html: item.content }}
          />
        </section>
      ))}
    </div>
  )
}
