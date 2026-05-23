import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

export function QuestionContent({
  title,
  content,
  imageUrl,
  className,
  contentClassName,
  titleClassName,
  imageClassName,
  readingMode = "default",
}: {
  title?: ReactNode
  content: string
  imageUrl?: string | null
  className?: string
  contentClassName?: string
  titleClassName?: string
  imageClassName?: string
  readingMode?: "default" | "comfortable"
}) {
  const isComfortable = readingMode === "comfortable"

  return (
    <article className={cn("flex flex-col gap-4", className)}>
      {title ? (
        <h2
          className={cn(
            isComfortable ? "text-lg font-semibold" : "text-base font-semibold",
            "text-foreground",
            titleClassName,
          )}
        >
          {title}
        </h2>
      ) : null}
      <div
        className={cn(
          "max-w-none text-foreground [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5",
          isComfortable ? "text-[1.08rem] leading-8" : "text-base leading-8",
          contentClassName,
        )}
        dangerouslySetInnerHTML={{ __html: content }}
      />
      {imageUrl ? (
        <div className={cn("overflow-hidden rounded-lg border bg-card", imageClassName)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="" className="max-h-[420px] w-full object-contain" />
        </div>
      ) : null}
    </article>
  )
}
