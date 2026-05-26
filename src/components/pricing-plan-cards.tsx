"use client"

import Link from "next/link"
import { CheckIcon } from "lucide-react"

import type { PlanCode } from "@/config/plans"
import type { PricingPlanView } from "@/lib/pricing-plans"
import { formatCurrencyIDR } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export type PricingPlanCardAction = {
  label: string
  href?: string
  disabled?: boolean
  helperText?: string
  variant?: "cta" | "outline" | "outline-primary" | "secondary"
}

export type PricingPlanCardItem = {
  plan: PricingPlanView
  featured?: boolean
  action: PricingPlanCardAction
}

type PricingPlanCardsProps = {
  plans: PricingPlanCardItem[]
  className?: string
  onSelectPlan?: (planCode: PlanCode) => void
}

export function PricingPlanCards({
  plans,
  className,
  onSelectPlan,
}: PricingPlanCardsProps) {
  return (
    <div
      className={cn(
        "grid w-full grid-cols-1 gap-5 pt-4 lg:grid-cols-3",
        className,
      )}
    >
      {plans.map(({ plan, featured, action }) => (
        <Card
          key={plan.code}
          className={cn(
            "relative overflow-visible rounded-lg bg-card shadow-xl shadow-primary/5 ring-1 ring-foreground/10",
            featured
              ? "scale-[1.02] bg-primary/[0.03] shadow-primary/15 ring-2 ring-primary"
              : "transition-all hover:-translate-y-0.5 hover:shadow-primary/10",
          )}
        >
          {plan.code === "pro" ? (
            <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2">
              <span className="inline-flex h-7 items-center rounded-full border border-primary/20 bg-primary px-3.5 text-xs font-bold uppercase tracking-[0.14em] text-primary-foreground shadow-lg shadow-primary/25">
                Paling populer
              </span>
            </div>
          ) : null}
          <CardHeader className="gap-4 p-6">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
              {plan.discountPercent > 0 ? (
                <Badge variant="soft" className="rounded-full px-2.5 py-1">
                  Diskon {plan.discountPercent}%
                </Badge>
              ) : null}
            </div>
            <CardDescription className="min-h-10 leading-6">
              {plan.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-6 px-6 pb-6">
            <div>
              <p className="text-4xl font-bold tracking-normal">
                {formatCurrencyIDR(plan.finalPrice)}
              </p>
              {plan.discountPercent > 0 ? (
                <p className="mt-1 text-sm text-muted-foreground line-through">
                  {formatCurrencyIDR(plan.price)}
                </p>
              ) : null}
              <p className="mt-2 text-sm text-muted-foreground">
                {plan.durationDays ? "per bulan" : "permanen"}
              </p>
            </div>
            <Separator />
            <ul className="flex flex-col gap-3.5">
              {plan.bullets.map((bullet) => (
                <li
                  key={bullet}
                  className="flex items-start gap-3 text-sm leading-6"
                >
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <CheckIcon className="size-3.5" />
                  </span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
            <PricingPlanActionButton
              planCode={plan.code}
              action={action}
              featured={featured}
              onSelectPlan={onSelectPlan}
            />
            {action.helperText ? (
              <p className="text-center text-xs leading-5 text-muted-foreground">
                {action.helperText}
              </p>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function PricingPlanActionButton({
  planCode,
  action,
  featured,
  onSelectPlan,
}: {
  planCode: PlanCode
  action: PricingPlanCardAction
  featured?: boolean
  onSelectPlan?: (planCode: PlanCode) => void
}) {
  const variant = action.variant ?? (featured ? "cta" : "outline")
  const className = "mt-auto h-12 w-full px-5 text-base"

  if (action.href && !onSelectPlan) {
    return (
      <Button className={className} variant={variant} disabled={action.disabled} asChild>
        <Link href={action.href}>{action.label}</Link>
      </Button>
    )
  }

  return (
    <Button
      type="button"
      className={className}
      variant={variant}
      disabled={action.disabled}
      onClick={() => onSelectPlan?.(planCode)}
    >
      {action.label}
    </Button>
  )
}
