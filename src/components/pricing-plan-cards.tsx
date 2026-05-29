"use client"

import Image from "next/image"
import Link from "next/link"
import {
  ArrowRightIcon,
  BanIcon,
  CheckIcon,
  CreditCardIcon,
  GraduationCapIcon,
  MessageCircleIcon,
  SparklesIcon,
} from "lucide-react"

import type { PricingPlanView } from "@/lib/pricing-plans"
import { formatCurrencyIDR } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export type PricingPlanCardAction = {
  label: string
  value?: string
  href?: string
  disabled?: boolean
  helperText?: string
  icon?: "arrow" | "ban" | "credit-card" | "message"
  hideIcon?: boolean
  variant?: "cta" | "outline" | "outline-primary" | "secondary"
  className?: string
}

export type PricingPlanCardItem = {
  plan: PricingPlanView
  featured?: boolean
  tone?: "pending"
  action: PricingPlanCardAction
  actions?: PricingPlanCardAction[]
}

type PricingPlanCardsProps = {
  plans: PricingPlanCardItem[]
  className?: string
  onSelectPlan?: (packagePriceId: number, actionValue?: string) => void
}

export function PricingPlanCards({
  plans,
  className,
  onSelectPlan,
}: PricingPlanCardsProps) {
  return (
    <div
      className={cn(
        "grid w-full grid-cols-1 gap-7 pt-4 md:grid-cols-2 lg:gap-8 xl:grid-cols-3",
        className,
      )}
    >
      {plans.map(({ plan, featured, tone, action, actions }) => (
        <article
          key={plan.priceId}
          className={cn(
            "group relative flex min-h-[32rem] flex-col overflow-hidden rounded-lg border bg-card shadow-sm transition-colors duration-200 hover:border-primary/35",
            featured && "border-primary/45 shadow-primary/10",
            tone === "pending" && "pricing-card--pending",
          )}
        >
          <div className="relative h-36 overflow-hidden bg-sky-100/70 dark:bg-sky-950/30">
            {plan.coverUrl ? (
              <Image
                src={plan.coverUrl}
                alt=""
                fill
                sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(255,255,255,0.78),transparent_28%),linear-gradient(135deg,rgba(186,230,253,0.58),rgba(224,242,254,0.36)_52%,rgba(240,249,255,0.62))] dark:bg-[radial-gradient(circle_at_22%_18%,rgba(125,211,252,0.18),transparent_30%),linear-gradient(135deg,rgba(12,74,110,0.36),rgba(8,47,73,0.22)_52%,rgba(15,23,42,0.28))]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-background/10 to-transparent" />
            <div className="absolute left-5 top-5 flex size-16 items-center justify-center rounded-lg border bg-background/90 shadow-lg backdrop-blur">
              {plan.logoUrl ? (
                <Image
                  src={plan.logoUrl}
                  alt={`${plan.name} logo`}
                  width={56}
                  height={56}
                  className="size-12 object-contain"
                  unoptimized
                />
              ) : (
                <GraduationCapIcon className="size-8 text-primary" />
              )}
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-5 p-5">
            <div className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-2xl font-bold tracking-normal">{plan.name}</h3>
                {featured && plan.discountPercent <= 0 ? (
                  <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <SparklesIcon className="size-4" />
                  </span>
                ) : null}
              </div>
              <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
                {plan.description}
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-normal text-muted-foreground">
                {plan.durationMonths} bulan
              </p>
              <div className="flex flex-col gap-1">
                <p className="text-3xl font-bold tracking-normal">
                  {formatCurrencyIDR(plan.finalPrice)}
                </p>
                {plan.discountPercent > 0 ? (
                  <div className="flex items-baseline gap-2 text-sm">
                    <span className="font-semibold text-amber-700 dark:text-amber-300">
                      Diskon {plan.discountPercent}%
                    </span>
                    <span className="whitespace-nowrap text-muted-foreground line-through">
                      {formatCurrencyIDR(plan.price)}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>

            <Separator />

            <ul className="flex flex-col gap-3">
              {plan.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-3 text-sm leading-6">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <CheckIcon className="size-3.5" />
                  </span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>

            <PricingPlanActionButtons
              packagePriceId={plan.priceId}
              action={action}
              actions={actions}
              featured={featured}
              onSelectPlan={onSelectPlan}
            />
          </div>
        </article>
      ))}
    </div>
  )
}

function PricingPlanActionButtons({
  packagePriceId,
  action,
  actions,
  featured,
  onSelectPlan,
}: {
  packagePriceId: number
  action: PricingPlanCardAction
  actions?: PricingPlanCardAction[]
  featured?: boolean
  onSelectPlan?: (packagePriceId: number, actionValue?: string) => void
}) {
  const resolvedActions = actions?.length ? actions : [action]

  return (
    <div className="mt-auto flex flex-col gap-2">
      {resolvedActions.map((item, index) => (
        <PricingPlanActionButton
          key={`${item.value ?? item.label}-${index}`}
          packagePriceId={packagePriceId}
          action={item}
          featured={featured}
          onSelectPlan={onSelectPlan}
        />
      ))}
      {resolvedActions
        .filter((item) => item.helperText)
        .map((item) => (
          <p
            key={`helper-${item.value ?? item.label}`}
            className="text-center text-xs leading-5 text-muted-foreground"
          >
            {item.helperText}
          </p>
        ))}
    </div>
  )
}

function PricingPlanActionButton({
  packagePriceId,
  action,
  featured,
  onSelectPlan,
}: {
  packagePriceId: number
  action: PricingPlanCardAction
  featured?: boolean
  onSelectPlan?: (packagePriceId: number, actionValue?: string) => void
}) {
  const variant = action.variant ?? (featured ? "cta" : "outline")
  const className = cn(
    "h-10 w-full transform-none px-4 text-sm hover:!translate-y-0 hover:!scale-100 hover:transform-none active:!translate-y-0 active:transform-none",
    action.className,
  )

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
      onClick={() => onSelectPlan?.(packagePriceId, action.value)}
    >
      {action.hideIcon ? null : (
        <ActionIcon icon={action.icon} disabled={action.disabled} />
      )}
      {action.label}
      {!action.hideIcon && !action.icon && !action.disabled ? (
        <ArrowRightIcon data-icon="inline-end" />
      ) : null}
    </Button>
  )
}

function ActionIcon({
  icon,
  disabled,
}: {
  icon?: PricingPlanCardAction["icon"]
  disabled?: boolean
}) {
  if (!icon || disabled) {
    return null
  }

  if (icon === "ban") {
    return <BanIcon data-icon="inline-start" />
  }

  if (icon === "credit-card") {
    return <CreditCardIcon data-icon="inline-start" />
  }

  if (icon === "message") {
    return <MessageCircleIcon data-icon="inline-start" />
  }

  return <ArrowRightIcon data-icon="inline-end" />
}
