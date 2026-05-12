import type { PlanCode } from "@/config/plans"
import type {
  PricingPlanCardAction,
  PricingPlanCardItem,
} from "@/components/pricing-plan-cards"
import type { PricingPlanView } from "@/lib/pricing-plans"
import { formatAdminDate } from "@/lib/format"

import type {
  PremiumPendingPayment,
  PremiumSubscriptionSummary,
  PremiumUser,
} from "../types"

type PremiumPlanActionInput = {
  plan: PricingPlanView
  user: PremiumUser | null
  currentPlanCode: PlanCode
  currentSubscription: PremiumSubscriptionSummary
  pendingPayment: PremiumPendingPayment
}

export function buildPremiumPlanCards({
  plans,
  user,
  currentPlanCode,
  currentSubscription,
  pendingPayment,
}: {
  plans: PricingPlanView[]
  user: PremiumUser | null
  currentPlanCode: PlanCode
  currentSubscription: PremiumSubscriptionSummary
  pendingPayment: PremiumPendingPayment
}): PricingPlanCardItem[] {
  return plans.map((plan) => ({
    plan,
    featured: plan.code === "pro",
    action: getPremiumPlanAction({
      plan,
      user,
      currentPlanCode,
      currentSubscription,
      pendingPayment,
    }),
  }))
}

function getPremiumPlanAction({
  plan,
  user,
  currentPlanCode,
  currentSubscription,
  pendingPayment,
}: PremiumPlanActionInput): PricingPlanCardAction {
  if (!user) {
    return {
      label: plan.code === "free" ? "Mulai Gratis" : `Pilih ${plan.name}`,
      variant: plan.code === "pro" ? "cta" : "outline",
    }
  }

  if (plan.code === currentPlanCode) {
    return {
      label: "Paket Saat Ini",
      disabled: true,
      helperText:
        plan.code === "free"
          ? undefined
          : `Berlaku sampai ${formatAdminDate(currentSubscription?.endsAt)}`,
      variant: plan.code === "pro" ? "cta" : "outline",
    }
  }

  if (currentPlanCode === "max" && plan.code === "pro") {
    return {
      label: `Pilih ${plan.name}`,
      disabled: true,
      variant: "outline",
    }
  }

  if (pendingPayment && plan.code !== "free") {
    if (pendingPayment.planCode === plan.code) {
      return {
        label: "Lanjutkan Pembayaran",
        variant: plan.code === "pro" ? "cta" : "outline-primary",
      }
    }

    return {
      label: `Pilih ${plan.name}`,
      disabled: true,
      helperText: "Batalkan pembayaran pending untuk memilih paket ini.",
      variant: plan.code === "pro" ? "cta" : "outline",
    }
  }

  if (plan.code === "free") {
    return {
      label: "Paket Gratis",
      disabled: true,
      variant: "outline",
    }
  }

  return {
    label: `Pilih ${plan.name}`,
    variant: plan.code === "pro" ? "cta" : "outline-primary",
  }
}
