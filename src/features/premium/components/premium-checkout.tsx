"use client"

import Script from "next/script"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import type { PlanCode } from "@/config/plans"
import type { PricingPlanView } from "@/lib/pricing-plans"
import { PricingPlanCards } from "@/components/pricing-plan-cards"

import {
  cancelPremiumPaymentAction,
  continuePremiumPaymentAction,
  startPremiumCheckoutAction,
} from "../actions"
import type {
  PremiumPendingPayment,
  PremiumSubscriptionSummary,
  PremiumUser,
} from "../types"
import { CheckoutConfirmationDialog } from "./checkout-confirmation-dialog"
import { PendingPaymentSection } from "./pending-payment-section"
import { useSnapPayment } from "../hooks/use-snap-payment"
import { buildPremiumPlanCards } from "../utils/plan-card-actions"

type PremiumCheckoutProps = {
  user: PremiumUser | null
  plans: PricingPlanView[]
  currentSubscription: PremiumSubscriptionSummary
  pendingPayment: PremiumPendingPayment
  midtransClientKey: string
  midtransSnapScriptUrl: string
}

export function PremiumCheckout({
  user,
  plans,
  currentSubscription,
  pendingPayment,
  midtransClientKey,
  midtransSnapScriptUrl,
}: PremiumCheckoutProps) {
  const router = useRouter()
  const { openSnapPayment } = useSnapPayment()
  const [selectedPlan, setSelectedPlan] = useState<PricingPlanView | null>(null)
  const [processing, setProcessing] = useState<"start" | "continue" | "cancel" | null>(null)
  const currentPlanCode = currentSubscription?.planCode ?? "free"
  const currentPlan = plans.find((plan) => plan.code === currentPlanCode) ?? plans[0]

  const cardItems = useMemo(
    () =>
      buildPremiumPlanCards({
        plans,
        user,
        currentPlanCode,
        currentSubscription,
        pendingPayment,
      }),
    [plans, user, currentPlanCode, currentSubscription, pendingPayment],
  )

  const handleSelectPlan = (planCode: PlanCode) => {
    const plan = plans.find((item) => item.code === planCode)

    if (!plan) {
      return
    }

    if (!user) {
      router.push(plan.code === "free" ? "/register" : "/login")
      return
    }

    if (plan.code === "free") {
      return
    }

    if (pendingPayment?.planCode === plan.code) {
      void handleContinuePayment()
      return
    }

    setSelectedPlan(plan)
  }

  const handleStartCheckout = async () => {
    if (!selectedPlan || selectedPlan.code === "free") {
      return
    }

    setProcessing("start")

    try {
      const result = await startPremiumCheckoutAction(selectedPlan.code)

      if (!result.success) {
        if (result.code === "unauthenticated") {
          router.push("/login")
          return
        }

        if (result.code === "pending_exists" && result.data?.snapToken) {
          toast.message(result.message)
          setSelectedPlan(null)
          openSnapPayment(result.data.snapToken)
          router.refresh()
          return
        }

        toast.error(result.message)
        router.refresh()
        return
      }

      setSelectedPlan(null)
      openSnapPayment(result.data.snapToken)
      router.refresh()
    } finally {
      setProcessing(null)
    }
  }

  const handleContinuePayment = async () => {
    if (!pendingPayment) {
      return
    }

    setProcessing("continue")

    try {
      const result = await continuePremiumPaymentAction(pendingPayment.id)

      if (!result.success) {
        if (result.code === "unauthenticated") {
          router.push("/login")
          return
        }

        toast.error(result.message)
        router.refresh()
        return
      }

      openSnapPayment(result.data.snapToken)
      router.refresh()
    } finally {
      setProcessing(null)
    }
  }

  const handleCancelPayment = async () => {
    if (!pendingPayment) {
      return
    }

    setProcessing("cancel")

    try {
      const result = await cancelPremiumPaymentAction(pendingPayment.id)

      if (!result.success) {
        if (result.code === "unauthenticated") {
          router.push("/login")
          return
        }

        toast.error(result.message)
        return
      }

      toast.success("Pembayaran pending dibatalkan.")
      router.refresh()
    } finally {
      setProcessing(null)
    }
  }

  return (
    <>
      <Script
        src={midtransSnapScriptUrl}
        strategy="afterInteractive"
        data-client-key={midtransClientKey}
      />

      <div className="mx-auto mt-10 flex w-full max-w-7xl flex-col gap-6 px-4 sm:px-6 lg:px-8">
        {pendingPayment ? (
          <PendingPaymentSection
            currentPlanName={currentPlan?.name ?? "Free"}
            currentSubscription={currentSubscription}
            pendingPayment={pendingPayment}
            processing={processing}
            onContinue={handleContinuePayment}
            onCancel={handleCancelPayment}
          />
        ) : null}

        <PricingPlanCards plans={cardItems} onSelectPlan={handleSelectPlan} />
      </div>

      <CheckoutConfirmationDialog
        plan={selectedPlan}
        processing={processing === "start"}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedPlan(null)
          }
        }}
        onContinue={handleStartCheckout}
      />
    </>
  )
}
