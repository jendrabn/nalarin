"use client"

import { BanIcon, CreditCardIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatAdminDate, formatCurrencyIDR } from "@/lib/format"

import type {
  PremiumPendingPayment,
  PremiumSubscriptionSummary,
} from "../types"

type PendingPaymentSectionProps = {
  currentPlanName: string
  currentSubscription: PremiumSubscriptionSummary
  pendingPayment: NonNullable<PremiumPendingPayment>
  processing: "start" | "continue" | "cancel" | null
  onContinue: () => void
  onCancel: () => void
}

export function PendingPaymentSection({
  currentPlanName,
  currentSubscription,
  pendingPayment,
  processing,
  onContinue,
  onCancel,
}: PendingPaymentSectionProps) {
  const isManualPayment = pendingPayment.gateway === "manual"

  return (
    <section className="rounded-2xl border border-border bg-card/80 p-5 shadow-lg shadow-primary/5 sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="soft">Pending</Badge>
            <Badge variant="outline">Plan saat ini: {currentPlanName}</Badge>
            {currentSubscription?.endsAt ? (
              <Badge variant="outline">
                Berlaku sampai {formatAdminDate(currentSubscription.endsAt)}
              </Badge>
            ) : null}
          </div>
          <h2 className="mt-4 text-xl font-semibold tracking-tight">
            {isManualPayment ? "Konfirmasi Pembayaran" : "Lanjutkan Pembayaran"}{" "}
            {pendingPayment.planName}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Kamu masih memiliki pembayaran pending sebesar{" "}
            <span className="font-medium text-foreground">
              {formatCurrencyIDR(pendingPayment.amount)}
            </span>
            .{" "}
            {isManualPayment
              ? "Lanjutkan konfirmasi WhatsApp atau batalkan untuk memilih paket lain."
              : "Lanjutkan pembayaran ini atau batalkan untuk memilih paket lain."}
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            className="h-10"
            variant="cta"
            disabled={processing !== null}
            onClick={onContinue}
          >
            <CreditCardIcon data-icon="inline-start" />
            {processing === "continue"
              ? "Memuat..."
              : isManualPayment
                ? "Konfirmasi Pembayaran"
                : "Lanjutkan Pembayaran"}
          </Button>
          <Button
            type="button"
            className="h-10"
            variant="destructive-solid"
            disabled={processing !== null}
            onClick={onCancel}
          >
            <BanIcon data-icon="inline-start" />
            {processing === "cancel" ? "Membatalkan..." : "Batalkan"}
          </Button>
        </div>
      </div>
    </section>
  )
}
