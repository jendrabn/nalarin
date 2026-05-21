import { FileTextIcon } from "lucide-react"

import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { cn } from "@/lib/utils"

import { getQuestionExplanationItems } from "../utils"
import type { QuestionRoomLike } from "../types"

export function QuestionExplanationPanel({
  question,
  emptyTitle = "Pembahasan belum tersedia",
  emptyDescription = "Admin belum menambahkan pembahasan untuk soal ini.",
  className,
}: {
  question: Pick<QuestionRoomLike, "question">
  emptyTitle?: string
  emptyDescription?: string
  className?: string
}) {
  const explanations = getQuestionExplanationItems(question)

  if (explanations.length === 0) {
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
      {explanations.map((item) => (
        <section key={item.label} className="rounded-lg border bg-background p-4">
          <h3 className="mb-2 text-sm font-semibold">{item.label}</h3>
          <div
            className="text-sm leading-7 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5"
            dangerouslySetInnerHTML={{ __html: item.content }}
          />
        </section>
      ))}
    </div>
  )
}

