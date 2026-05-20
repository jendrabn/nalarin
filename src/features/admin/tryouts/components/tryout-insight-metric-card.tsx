import type { ComponentType } from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type InsightMetricCardProps = {
  icon: ComponentType<{ className?: string }>
  label: string
  value: string
  description: string
}

export function InsightMetricCard({
  icon: Icon,
  label,
  value,
  description,
}: InsightMetricCardProps) {
  return (
    <Card className="border border-border/70 bg-card/95 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1">
          <CardDescription className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            {label}
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tracking-tight text-foreground">
            {value}
          </CardTitle>
        </div>
        <div className="rounded-2xl border border-primary/15 bg-primary/10 p-2.5 text-primary">
          <Icon className="size-4" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}
