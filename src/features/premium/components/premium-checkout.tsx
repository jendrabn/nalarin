"use client"

import Script from "next/script"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import { formatCurrencyIDR } from "@/lib/format"
import type { PricingPlanView } from "@/lib/pricing-plans"
import { PricingPlanCards } from "@/components/pricing-plan-cards"

import {
  cancelPremiumPaymentAction,
  continuePremiumPaymentAction,
  previewPremiumVoucherAction,
  startManualPaymentAction,
  startPremiumCheckoutAction,
} from "../actions"
import type {
  ManualPaymentConfig,
  PremiumPendingPayment,
  PremiumSubscriptionSummary,
  PremiumUser,
  PremiumVoucherPreview,
} from "../types"
import { ManualPaymentDialog } from "./manual-payment-dialog"
import { MidtransPaymentDialog } from "./midtrans-payment-dialog"
import { PendingPaymentSummaryDialog } from "./pending-payment-summary-dialog"
import { useSnapPayment } from "../hooks/use-snap-payment"
import { buildPremiumPlanCards } from "../utils/plan-card-actions"

type PremiumCheckoutProps = {
  user: PremiumUser | null
  plans: PricingPlanView[]
  currentSubscriptions: PremiumSubscriptionSummary[]
  pendingPayments: Array<NonNullable<PremiumPendingPayment>>
  paymentGatewayEnabled: boolean
  manualPayment: ManualPaymentConfig
  midtransClientKey: string | null
  midtransSnapScriptUrl: string | null
}

export function PremiumCheckout({
  user,
  plans,
  currentSubscriptions,
  pendingPayments,
  paymentGatewayEnabled,
  manualPayment,
  midtransClientKey,
  midtransSnapScriptUrl,
}: PremiumCheckoutProps) {
  const router = useRouter()
  const { openSnapPayment } = useSnapPayment()
  const [selectedPlan, setSelectedPlan] = useState<PricingPlanView | null>(null)
  const [selectedManualPlan, setSelectedManualPlan] = useState<PricingPlanView | null>(null)
  const [selectedPendingPayment, setSelectedPendingPayment] =
    useState<NonNullable<PremiumPendingPayment> | null>(null)
  const [processing, setProcessing] = useState<"start" | "continue" | "cancel" | null>(null)
  const [voucherProcessing, setVoucherProcessing] = useState(false)
  const [voucherCode, setVoucherCode] = useState("")
  const [appliedVoucher, setAppliedVoucher] = useState<PremiumVoucherPreview | null>(null)
  const activeCheckoutPlan = selectedPlan ?? selectedManualPlan
  const manualPaymentEnabled = Boolean(
    manualPayment.whatsappNumber &&
      manualPayment.methods.some((method) => method.phone.trim().length > 0),
  )
  const pendingPaymentByExamType = useMemo(
    () => {
      const map = new Map<number, NonNullable<PremiumPendingPayment>>()

      for (const payment of pendingPayments) {
        if (!map.has(payment.examTypeId)) {
          map.set(payment.examTypeId, payment)
        }
      }

      return map
    },
    [pendingPayments],
  )

  const cardItems = useMemo(
    () =>
      buildPremiumPlanCards({
        plans,
        user,
        currentSubscriptions,
        pendingPayments,
        paymentGatewayEnabled,
        manualPaymentEnabled,
      }),
    [
      plans,
      user,
      currentSubscriptions,
      pendingPayments,
      paymentGatewayEnabled,
      manualPaymentEnabled,
    ],
  )

  const handleSelectPlan = (packagePriceId: number, actionValue?: string) => {
    const plan = plans.find((item) => item.priceId === packagePriceId)

    if (!plan) {
      return
    }

    if (!user) {
      router.push("/login")
      return
    }

    const pendingPayment = pendingPaymentByExamType.get(plan.examTypeId) ?? null

    if (actionValue === "cancel" && pendingPayment) {
      void handleCancelPayment(pendingPayment)
      return
    }

    if (actionValue === "continue" && pendingPayment) {
      setSelectedPendingPayment(pendingPayment)
      return
    }

    if (actionValue === "manual" && pendingPayment) {
      setSelectedPendingPayment(pendingPayment)
      return
    }

    if (pendingPayment) {
      toast.error("Batalkan pembayaran pending untuk exam type ini terlebih dahulu.")
      return
    }

    resetVoucherForPlan(plan.priceId)

    if (actionValue === "manual") {
      setSelectedManualPlan(plan)
      return
    }

    if (actionValue === "midtrans" || paymentGatewayEnabled) {
      setSelectedPlan(plan)
      return
    }

    if (manualPaymentEnabled) {
      setSelectedManualPlan(plan)
      return
    }

    toast.error("Metode pembayaran belum tersedia.")
  }

  const resetVoucherForPlan = (nextPackagePriceId?: number) => {
    if (
      appliedVoucher &&
      nextPackagePriceId &&
      appliedVoucher.originalAmount !==
        plans.find((item) => item.priceId === nextPackagePriceId)?.finalPrice
    ) {
      setAppliedVoucher(null)
    }
  }

  const handleApplyVoucher = async () => {
    if (!activeCheckoutPlan) {
      return
    }

    setVoucherProcessing(true)

    try {
      const result = await previewPremiumVoucherAction(
        activeCheckoutPlan.priceId,
        voucherCode,
      )

      if (!result.success) {
        if (result.code === "unauthenticated") {
          router.push("/login")
          return
        }

        toast.error(result.message)
        router.refresh()
        return
      }

      setVoucherCode(result.data.code)
      setAppliedVoucher(result.data)
      toast.success("Voucher berhasil digunakan.")
    } finally {
      setVoucherProcessing(false)
    }
  }

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null)
    setVoucherCode("")
  }

  const handleStartCheckout = async (plan = activeCheckoutPlan) => {
    if (!plan) {
      return
    }

    setProcessing("start")

    try {
      const result = await startPremiumCheckoutAction(
        plan.priceId,
        appliedVoucher?.code,
      )

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
      handleRemoveVoucher()
      openSnapPayment({
        snapToken: result.data.snapToken,
        paymentUrl: result.data.paymentUrl,
      })
      router.refresh()
    } finally {
      setProcessing(null)
    }
  }

  const handleProceedPendingPayment = async (
    pendingPayment: NonNullable<PremiumPendingPayment>,
  ) => {
    if (!pendingPayment) {
      return
    }

    if (pendingPayment.gateway === "manual") {
      const plan = plans.find((item) => item.priceId === pendingPayment.packagePriceId)

      if (plan && user) {
        openManualPaymentWhatsApp({
          user,
          plan,
          payment: pendingPayment,
          whatsappNumber: manualPayment.whatsappNumber,
        })
      }

      setSelectedPendingPayment(null)
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
      setSelectedPendingPayment(null)
    }
  }

  const handleConfirmManualPayment = async (plan = activeCheckoutPlan) => {
    if (!plan || !user) {
      return
    }

    setProcessing("start")

    try {
      const result = await startManualPaymentAction(
        plan.priceId,
        appliedVoucher?.code,
      )

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
            plan,
            payment: result.data.payment,
            whatsappNumber: manualPayment.whatsappNumber,
          })
          setSelectedManualPlan(null)
          handleRemoveVoucher()
          router.refresh()
          return
        }

        toast.error(result.message)
        router.refresh()
        return
      }

      openManualPaymentWhatsApp({
        user,
        plan,
        payment: result.data.payment,
        whatsappNumber: manualPayment.whatsappNumber,
      })
      setSelectedManualPlan(null)
      handleRemoveVoucher()
      router.refresh()
    } finally {
      setProcessing(null)
    }
  }

  const handleCancelPayment = async (
    pendingPayment: NonNullable<PremiumPendingPayment>,
  ) => {
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

      <div className="mx-auto mt-6 flex w-full max-w-7xl flex-col gap-6 px-4 sm:px-6 lg:px-8">
        <PricingPlanCards
          plans={cardItems}
          onSelectPlan={handleSelectPlan}
        />
      </div>

      <MidtransPaymentDialog
        plan={selectedPlan}
        voucherCode={voucherCode}
        appliedVoucher={appliedVoucher}
        voucherProcessing={voucherProcessing}
        processing={processing === "start"}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedPlan(null)
            handleRemoveVoucher()
          }
        }}
        onContinue={() => void handleStartCheckout()}
        onVoucherCodeChange={setVoucherCode}
        onApplyVoucher={handleApplyVoucher}
        onRemoveVoucher={handleRemoveVoucher}
      />

      <ManualPaymentDialog
        plan={selectedManualPlan}
        manualPayment={manualPayment}
        pendingPayment={null}
        voucherCode={voucherCode}
        appliedVoucher={appliedVoucher}
        voucherProcessing={voucherProcessing}
        processing={processing === "start"}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedManualPlan(null)
            handleRemoveVoucher()
          }
        }}
        onConfirm={() => void handleConfirmManualPayment()}
        onVoucherCodeChange={setVoucherCode}
        onApplyVoucher={handleApplyVoucher}
        onRemoveVoucher={handleRemoveVoucher}
      />

      <PendingPaymentSummaryDialog
        payment={selectedPendingPayment}
        processing={processing === "continue"}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedPendingPayment(null)
          }
        }}
        onProceed={() => {
          if (selectedPendingPayment) {
            void handleProceedPendingPayment(selectedPendingPayment)
          }
        }}
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
