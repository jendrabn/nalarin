import type { ReactNode } from "react"

export function QuestionStatusPill({
  icon,
  children,
}: {
  icon: ReactNode
  children: ReactNode
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 shadow-sm">
      <span className="text-primary [&_svg]:size-4">{icon}</span>
      <span className="text-sm font-semibold tabular-nums">{children}</span>
    </div>
  )
}

