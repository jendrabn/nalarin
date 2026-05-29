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
  currentSubscription: PremiumSubscriptionSummary | null
  pendingPayment: NonNullable<PremiumPendingPayment> | null
  paymentGatewayEnabled: boolean
  manualPaymentEnabled: boolean
}

export function buildPremiumPlanCards({
  plans,
  user,
  currentSubscriptions,
  pendingPayments,
  paymentGatewayEnabled,
  manualPaymentEnabled,
}: {
  plans: PricingPlanView[]
  user: PremiumUser | null
  currentSubscriptions: PremiumSubscriptionSummary[]
  pendingPayments: Array<NonNullable<PremiumPendingPayment>>
  paymentGatewayEnabled: boolean
  manualPaymentEnabled: boolean
}): PricingPlanCardItem[] {
  const subscriptionByExamType = new Map(
    currentSubscriptions.map((subscription) => [
      subscription.examTypeId,
      subscription,
    ]),
  )

  return plans.map((plan) => {
    const currentSubscription = subscriptionByExamType.get(plan.examTypeId) ?? null
    const hasPendingPayment = pendingPayments.some(
      (payment) => payment.packagePriceId === plan.priceId,
    )
    const actions = getPremiumPlanActions({
      plan,
      user,
      currentSubscription,
      pendingPayment:
        pendingPayments.find((payment) => payment.examTypeId === plan.examTypeId) ?? null,
      paymentGatewayEnabled,
      manualPaymentEnabled,
    })

    return {
      plan,
      featured: plan.discountPercent > 0,
      tone: hasPendingPayment ? "pending" : undefined,
      action: actions[0],
      actions,
    }
  })
}

function getPremiumPlanActions({
  plan,
  user,
  currentSubscription,
  pendingPayment,
  paymentGatewayEnabled,
  manualPaymentEnabled,
}: PremiumPlanActionInput): PricingPlanCardAction[] {
  if (!user) {
    return [{
      label: "Beli Paket",
      value: "login",
      hideIcon: true,
      variant: "cta",
    }]
  }

  if (pendingPayment) {
    if (pendingPayment.packagePriceId === plan.priceId) {
      return [
        {
          label:
            pendingPayment.gateway === "manual"
              ? "Konfirmasi Pembayaran"
              : "Lanjutkan Pembayaran",
          value: "continue",
          hideIcon: true,
          variant: "cta",
        },
        {
          label: "Batalkan",
          value: "cancel",
          hideIcon: true,
          variant: "outline",
          className:
            "border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive",
        },
      ]
    }

    return [{
      label: "Beli Paket",
      disabled: true,
      helperText: "Ada pembayaran pending untuk exam type ini.",
      hideIcon: true,
      variant: "outline",
    }]
  }

  if (!paymentGatewayEnabled && !manualPaymentEnabled) {
    return [{
      label: "Beli Paket",
      disabled: true,
      helperText: "Metode pembayaran belum tersedia.",
      hideIcon: true,
      variant: "outline",
    }]
  }

  if (currentSubscription) {
    return getCheckoutActions({
      primaryLabel: "Perpanjang Paket",
      helperText: `Aktif sampai ${formatAdminDate(currentSubscription.endsAt)}`,
      paymentGatewayEnabled,
      manualPaymentEnabled,
      primaryVariant: "outline-primary",
    })
  }

  return getCheckoutActions({
    primaryLabel: "Beli Paket",
    paymentGatewayEnabled,
    manualPaymentEnabled,
    primaryVariant: "cta",
  })
}

function getCheckoutActions({
  primaryLabel,
  helperText,
  paymentGatewayEnabled,
  manualPaymentEnabled,
  primaryVariant,
}: {
  primaryLabel: string
  helperText?: string
  paymentGatewayEnabled: boolean
  manualPaymentEnabled: boolean
  primaryVariant: PricingPlanCardAction["variant"]
}): PricingPlanCardAction[] {
  if (paymentGatewayEnabled && manualPaymentEnabled) {
    return [
      {
        label: primaryLabel,
        value: "midtrans",
        helperText,
        hideIcon: true,
        variant: primaryVariant,
      },
      {
        label: "Konfirmasi Pembayaran",
        value: "manual",
        hideIcon: true,
        variant: "outline",
      },
    ]
  }

  return [{
    label: primaryLabel,
    value: paymentGatewayEnabled ? "midtrans" : "manual",
    helperText,
    hideIcon: true,
    variant: primaryVariant,
  }]
}
