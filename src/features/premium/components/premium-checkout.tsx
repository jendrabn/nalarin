"use client"

import Script from "next/script"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import type { PlanCode } from "@/config/plans"
import { formatCurrencyIDR } from "@/lib/format"
import type { PricingPlanView } from "@/lib/pricing-plans"
import { PricingPlanCards } from "@/components/pricing-plan-cards"

import {
  cancelPremiumPaymentAction,
  continuePremiumPaymentAction,
  startManualPaymentAction,
  startPremiumCheckoutAction,
} from "../actions"
import type {
  ManualPaymentConfig,
  PremiumPendingPayment,
  PremiumSubscriptionSummary,
  PremiumUser,
} from "../types"
import { CheckoutConfirmationDialog } from "./checkout-confirmation-dialog"
import { ManualPaymentDialog } from "./manual-payment-dialog"
import { PendingPaymentSection } from "./pending-payment-section"
import { useSnapPayment } from "../hooks/use-snap-payment"
import { buildPremiumPlanCards } from "../utils/plan-card-actions"

type PremiumCheckoutProps = {
  user: PremiumUser | null
  plans: PricingPlanView[]
  currentSubscription: PremiumSubscriptionSummary
  pendingPayment: PremiumPendingPayment
  paymentGatewayEnabled: boolean
  manualPayment: ManualPaymentConfig
  midtransClientKey: string | null
  midtransSnapScriptUrl: string | null
}

export function PremiumCheckout({
  user,
  plans,
  currentSubscription,
  pendingPayment,
  paymentGatewayEnabled,
  manualPayment,
  midtransClientKey,
  midtransSnapScriptUrl,
}: PremiumCheckoutProps) {
  const router = useRouter()
  const { openSnapPayment } = useSnapPayment()
  const [selectedPlan, setSelectedPlan] = useState<PricingPlanView | null>(null)
  const [selectedManualPlan, setSelectedManualPlan] = useState<PricingPlanView | null>(null)
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
      if (pendingPayment.gateway === "manual") {
        setSelectedManualPlan(plan)
      } else if (paymentGatewayEnabled) {
        void handleContinuePayment()
      } else {
        toast.error("Batalkan pembayaran pending terlebih dahulu sebelum memilih paket ini.")
      }
      return
    }

    if (!paymentGatewayEnabled) {
      setSelectedManualPlan(plan)
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

        if (result.code === "pending_exists" && result.data) {
          toast.message(result.message)
          setSelectedPlan(null)
          openSnapPayment({
            snapToken: result.data.snapToken,
            paymentUrl: result.data.paymentUrl,
          })
          router.refresh()
          return
        }

        toast.error(result.message)
        router.refresh()
        return
      }

      setSelectedPlan(null)
      openSnapPayment({
        snapToken: result.data.snapToken,
        paymentUrl: result.data.paymentUrl,
      })
      router.refresh()
    } finally {
      setProcessing(null)
    }
  }

  const handleContinuePayment = async () => {
    if (!pendingPayment) {
      return
    }

    if (pendingPayment.gateway === "manual") {
      const plan = plans.find((item) => item.code === pendingPayment.planCode)

      if (plan) {
        setSelectedManualPlan(plan)
      }

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

      openSnapPayment({
        snapToken: result.data.snapToken,
        paymentUrl: result.data.paymentUrl,
      })
      router.refresh()
    } finally {
      setProcessing(null)
    }
  }

  const handleConfirmManualPayment = async () => {
    if (!selectedManualPlan || selectedManualPlan.code === "free" || !user) {
      return
    }

    setProcessing("start")

    try {
      const result = await startManualPaymentAction(selectedManualPlan.code)

      if (!result.success) {
        if (result.code === "unauthenticated") {
          router.push("/login")
          return
        }

        if (
          result.code === "pending_exists" &&
          result.data?.payment.gateway === "manual"
        ) {
          toast.message(result.message)
          openManualPaymentWhatsApp({
            user,
            plan: selectedManualPlan,
            payment: result.data.payment,
            whatsappNumber: manualPayment.whatsappNumber,
          })
          setSelectedManualPlan(null)
          router.refresh()
          return
        }

        toast.error(result.message)
        router.refresh()
        return
      }

      openManualPaymentWhatsApp({
        user,
        plan: selectedManualPlan,
        payment: result.data.payment,
        whatsappNumber: manualPayment.whatsappNumber,
      })
      setSelectedManualPlan(null)
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
      {paymentGatewayEnabled && midtransSnapScriptUrl && midtransClientKey ? (
        <Script
          src={midtransSnapScriptUrl}
          strategy="afterInteractive"
          data-client-key={midtransClientKey}
        />
      ) : null}

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

      <ManualPaymentDialog
        plan={selectedManualPlan}
        manualPayment={manualPayment}
        pendingPayment={pendingPayment?.gateway === "manual" ? pendingPayment : null}
        processing={processing === "start"}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedManualPlan(null)
          }
        }}
        onConfirm={handleConfirmManualPayment}
      />
    </>
  )
}

function openManualPaymentWhatsApp({
  user,
  plan,
  payment,
  whatsappNumber,
}: {
  user: PremiumUser
  plan: PricingPlanView
  payment: NonNullable<PremiumPendingPayment>
  whatsappNumber: string
}) {
  const number = whatsappNumber.replace(/\D/g, "")
  const message = [
    "Halo Admin Nalarin, saya ingin konfirmasi pembayaran.",
    "",
    `Nama: ${user.name}`,
    `Email: ${user.email}`,
    `Paket: ${plan.name}`,
    `Total: ${formatCurrencyIDR(payment.amount)}`,
    payment.gatewayOrderId ? `Kode Pembayaran: ${payment.gatewayOrderId}` : null,
    "",
    "Saya akan melampirkan screenshot bukti transfer pada chat ini.",
  ]
    .filter((line): line is string => line !== null)
    .join("\n")

  window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, "_blank")
}
