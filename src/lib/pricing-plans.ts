import { PLAN_CONFIG, type PlanCode } from "@/config/plans"
import { getPlanFinalPrice } from "@/lib/billing"

export type PricingPlanView = {
  code: PlanCode
  name: string
  description: string
  price: number
  finalPrice: number
  discountPercent: number
  durationDays: number | null
  bullets: string[]
}

type Plan = (typeof PLAN_CONFIG)[keyof typeof PLAN_CONFIG]

export function getPricingPlanViews(): PricingPlanView[] {
  return Object.values(PLAN_CONFIG).map((plan) => ({
    code: plan.code,
    name: plan.name,
    description: plan.description,
    price: plan.price,
    finalPrice: getPlanFinalPrice(plan.code),
    discountPercent: plan.discountPercent,
    durationDays: plan.durationDays,
    bullets: getPlanBullets(plan),
  }))
}

function getPlanBullets(plan: Plan) {
  const bullets = [
    "Pembahasan biasa gratis untuk semua plan",
    formatPlanLimit(plan.limits.aiExplanationsPerMonth, "pembahasan AI"),
    formatPlanLimit(plan.limits.practiceSessionsPerMonth, "latihan"),
    formatPlanLimit(plan.limits.quizSessionsPerMonth, "quiz"),
    formatPlanLimit(
      plan.limits.tryoutSessionsPerMonth,
      plan.code === "free" ? "tryout gratis" : "tryout",
    ),
  ]

  if (plan.access.ranking) {
    bullets.push("Ranking tryout")
  }

  return bullets
}

function formatPlanLimit(limit: number | null, label: string) {
  if (limit === null) {
    return `${capitalize(label)} tanpa batas`
  }

  return `${limit} ${label} per bulan`
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
