import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type PageHeaderProps = {
  title: ReactNode
  subtitle?: string
  actions?: ReactNode
  align?: "start" | "center"
  titleClassName?: string
  subtitleClassName?: string
  className?: string
}

export function PageHeader({
  title,
  subtitle,
  actions,
  align = "start",
  titleClassName,
  subtitleClassName,
  className,
}: PageHeaderProps) {
  const centered = align === "center"

  return (
    <header
      className={cn(
        "mb-6 flex flex-col gap-4",
        centered
          ? "items-center text-center"
          : "sm:flex-row sm:items-start sm:justify-between",
        className
      )}
    >
      <div className={cn("min-w-0", centered && "flex flex-col items-center")}>
        <h1
          className={cn(
            "text-2xl font-semibold tracking-tight text-foreground sm:text-3xl",
            titleClassName
          )}
        >
          {title}
        </h1>
        {subtitle ? (
          <p
            className={cn(
              "mt-2 max-w-3xl text-sm leading-6 text-muted-foreground",
              centered && "max-w-2xl",
              subtitleClassName
            )}
          >
            {subtitle}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div
          className={cn(
            "flex shrink-0 items-start justify-start gap-2",
            centered && "justify-center"
          )}
        >
          {actions}
        </div>
      ) : null}
    </header>
  )
}
