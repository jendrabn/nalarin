"use client"

import { AlertTriangleIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { formatAdminDate, formatCurrencyIDR } from "@/lib/format"

import type { PremiumPendingPayment } from "../types"

type PendingPaymentSummaryDialogProps = {
  payment: NonNullable<PremiumPendingPayment> | null
  processing: boolean
  onOpenChange: (open: boolean) => void
  onProceed: () => void
}

export function PendingPaymentSummaryDialog({
  payment,
  processing,
  onOpenChange,
  onProceed,
}: PendingPaymentSummaryDialogProps) {
  const totalAmount = payment?.amount ?? 0
  const pricingSnapshot = payment?.pricingSnapshot ?? null
  const originalAmount = pricingSnapshot?.price ?? payment?.originalAmount ?? totalAmount
  const packageDiscount =
    pricingSnapshot?.packageDiscountAmount ?? Math.max(originalAmount - totalAmount, 0)
  const voucherDiscount = payment?.discountAmount ?? 0
  const isManual = payment?.gateway === "manual"
  const showExamType = Boolean(
    payment && payment.examTypeName.trim() !== payment.packageName.trim(),
  )

  return (
    <Dialog open={Boolean(payment)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(88vh,760px)] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ringkasan Pembayaran</DialogTitle>
          <DialogDescription>
            Periksa nominal, diskon, dan detail paket sebelum melanjutkan.
          </DialogDescription>
        </DialogHeader>

        {payment ? (
          <div className="flex min-h-0 flex-col gap-5 overflow-y-auto pr-1">
            <div className="rounded-lg border bg-secondary/35 p-4">
              <div className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/8 p-3 text-sm text-foreground">
                <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-amber-600" />
                <p className="leading-6 text-muted-foreground">
                  Pastikan nominal pembayaran yang kamu kirim sama persis dengan total di
                  bawah.
                </p>
              </div>

              <div className="mt-4 space-y-3 text-sm">
                {showExamType ? (
                  <SummaryRow label="Exam type" value={payment.examTypeName} />
                ) : null}
                <SummaryRow label="Paket" value={payment.packageName} />
                {payment.packageSnapshot ? (
                  <SummaryRow
                    label="Durasi"
                    value={`${payment.packageSnapshot.durationMonths} bulan`}
                  />
                ) : null}
                <SummaryRow
                  label="Harga sebelum diskon"
                  value={formatCurrencyIDR(originalAmount)}
                />
                <SummaryRow
                  label="Diskon paket"
                  value={`-${formatCurrencyIDR(packageDiscount)}`}
                />
                {payment.voucher ? (
                  <SummaryRow
                    label="Diskon voucher"
                    value={`-${formatCurrencyIDR(voucherDiscount)}`}
                    accent
                  />
                ) : (
                  <SummaryRow label="Diskon voucher" value="-" />
                )}

                <Separator className="my-2" />

                <SummaryRow
                  label="Total bayar"
                  value={formatCurrencyIDR(totalAmount)}
                  strong
                  valueClassName="text-xl font-bold tracking-tight sm:text-2xl"
                />
                <SummaryRow
                  label="Berlaku sampai"
                  value={formatAdminDate(payment.expiredAt)}
                />
                <SummaryRow
                  label="Kode pembayaran"
                  value={payment.gatewayOrderId ?? "-"}
                />
              </div>
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={processing}
            onClick={() => onOpenChange(false)}
          >
            Batal
          </Button>
          <Button
            type="button"
            variant={isManual ? "cta" : "outline-primary"}
            disabled={processing}
            onClick={onProceed}
          >
            {isManual ? "Konfirmasi Pembayaran" : "Lanjutkan Pembayaran"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function SummaryRow({
  label,
  value,
  accent = false,
  strong = false,
  valueClassName,
}: {
  label: string
  value: string
  accent?: boolean
  strong?: boolean
  valueClassName?: string
}) {
  return (
    <div
      className={[
        "flex items-center justify-between gap-3",
        accent ? "text-primary" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="text-muted-foreground">{label}</span>
      <span className={[strong ? "font-semibold" : "", valueClassName ?? ""].filter(Boolean).join(" ")}>
        {value}
      </span>
    </div>
  )
}
