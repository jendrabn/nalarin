import { PackageOpenIcon, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

type EmptyStateProps = {
  title: string
  icon?: LucideIcon
  className?: string
}

export function EmptyState({
  title,
  icon: Icon = PackageOpenIcon,
  className,
}: EmptyStateProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex w-full flex-col items-center justify-center gap-3 py-10 text-center text-balance",
        className
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/15">
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <p className="max-w-sm text-sm font-semibold leading-6 text-foreground">
        {title}
      </p>
    </div>
  )
}
