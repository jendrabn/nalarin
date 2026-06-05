import { SearchXIcon, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

type EmptyStateProps = {
  title: string
  icon?: LucideIcon
  className?: string
}

export function EmptyState({
  title,
  icon: Icon = SearchXIcon,
  className,
}: EmptyStateProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-10 text-center text-balance shadow-sm",
        className,
      )}
    >
      <Icon
        className="size-10 shrink-0 text-muted-foreground"
        aria-hidden="true"
        strokeWidth={1.75}
      />
      <p className="max-w-sm text-sm font-semibold leading-6 text-muted-foreground">
        {title}
      </p>
    </div>
  )
}
