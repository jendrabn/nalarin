"use client"

import { memo, useEffect, useRef, type ReactNode } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export type QuestionNavigatorItem = {
  id: number
  label: ReactNode
  active?: boolean
  answered?: boolean
  flagged?: boolean
  locked?: boolean
  status?: "correct" | "wrong" | "pending" | "unanswered"
  ariaLabel?: string
}

export type QuestionNavigatorLegendItem = {
  label: string
  className: string
}

function QuestionNavigationBase({
  title,
  items,
  onSelect,
  className,
  contentClassName,
  gridClassName,
}: {
  title?: string
  items: QuestionNavigatorItem[]
  onSelect: (index: number) => void
  className?: string
  contentClassName?: string
  gridClassName?: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const activeIndex = items.findIndex((item) => item.active)

  useEffect(() => {
    if (activeIndex < 0) {
      return
    }

    containerRef.current
      ?.querySelector<HTMLButtonElement>(`[data-question-index="${activeIndex}"]`)
      ?.scrollIntoView({
        block: "nearest",
        inline: "nearest",
        behavior: "smooth",
      })
  }, [activeIndex])

  return (
    <aside className={cn("min-w-0 lg:self-start", className)}>
      <Card className="gap-0 overflow-hidden py-0 shadow-sm">
        {title ? (
          <CardHeader className="px-4 py-4">
            <CardTitle className="text-sm font-semibold">{title}</CardTitle>
          </CardHeader>
        ) : null}
        <CardContent className={cn("min-w-0 px-3 pb-3", title ? "pt-0" : "pt-3", contentClassName)}>
          <div ref={containerRef} className="overflow-x-auto pb-1 pr-1 [-webkit-overflow-scrolling:touch]">
            <div
              className={cn(
                "grid min-w-max grid-flow-col auto-cols-[2.5rem] gap-2 pt-1.5 lg:min-w-0 lg:w-auto lg:grid-flow-row lg:grid-cols-5",
                gridClassName,
              )}
            >
              {items.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  data-question-index={index}
                  onClick={() => onSelect(index)}
                  aria-current={item.active ? "step" : undefined}
                  aria-label={item.ariaLabel ?? `Buka soal ${index + 1}`}
                  disabled={item.locked}
                  className={cn(
                    "grid size-10 place-items-center rounded-lg border text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-45",
                    getNavigatorToneClass(item),
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </aside>
  )
}

export const QuestionNavigation = memo(QuestionNavigationBase)

function getNavigatorToneClass(item: QuestionNavigatorItem) {
  if (item.active && item.status === "wrong") {
    return "border-destructive bg-destructive text-white"
  }

  if (item.active) {
    return "border-primary bg-primary text-primary-foreground"
  }

  if (item.status === "correct") {
    return "border-chart-2/35 bg-chart-2/10 text-chart-2 hover:bg-chart-2/15"
  }

  if (item.status === "wrong") {
    return "border-destructive/35 bg-destructive/10 text-destructive hover:bg-destructive/15"
  }

  if (item.status === "pending") {
    return "border-chart-3/35 bg-chart-3/10 text-chart-3 hover:bg-chart-3/15"
  }

  if (item.flagged) {
    return "border-chart-3/35 bg-chart-3/10 text-chart-3 hover:bg-chart-3/15"
  }

  if (item.answered) {
    return "border-primary/35 bg-primary/10 text-primary hover:bg-primary/15"
  }

  if (item.locked) {
    return "border-border/70 bg-background/70 text-muted-foreground"
  }

  return "bg-background hover:bg-muted"
}
