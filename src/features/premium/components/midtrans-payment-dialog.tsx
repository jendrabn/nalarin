"use client"

import { TicketPercentIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { formatCurrencyIDR } from "@/lib/format"
import type { PricingPlanView } from "@/lib/pricing-plans"

import type { PremiumVoucherPreview } from "../types"

type MidtransPaymentDialogProps = {
  plan: PricingPlanView | null
  voucherCode: string
  appliedVoucher: PremiumVoucherPreview | null
  voucherProcessing: boolean
  processing: boolean
  onOpenChange: (open: boolean) => void
  onContinue: () => void
  onVoucherCodeChange: (code: string) => void
  onApplyVoucher: () => void
  onRemoveVoucher: () => void
}

export function MidtransPaymentDialog({
  plan,
  voucherCode,
  appliedVoucher,
  voucherProcessing,
  processing,
  onOpenChange,
  onContinue,
  onVoucherCodeChange,
  onApplyVoucher,
  onRemoveVoucher,
}: MidtransPaymentDialogProps) {
  return (
    <Dialog open={Boolean(plan)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(88vh,760px)] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Pembayaran {plan?.name}</DialogTitle>
          <DialogDescription>
            Periksa detail paket dan kode voucher sebelum melanjutkan ke pembayaran.
          </DialogDescription>
        </DialogHeader>

        {plan ? (
          <ScrollArea className="-mx-6 min-h-0 px-6">
            <div className="flex flex-col gap-5 pb-1">
              <VoucherCard
                voucherCode={voucherCode}
                appliedVoucher={appliedVoucher}
                voucherProcessing={voucherProcessing}
                processing={processing}
                onVoucherCodeChange={onVoucherCodeChange}
                onApplyVoucher={onApplyVoucher}
                onRemoveVoucher={onRemoveVoucher}
              />

              <CheckoutSummary plan={plan} appliedVoucher={appliedVoucher} />
            </div>
          </ScrollArea>
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
            variant="cta"
            disabled={processing}
            onClick={onContinue}
          >
            {processing ? "Memproses..." : "Lanjutkan Pembayaran"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CheckoutSummary({
  plan,
  appliedVoucher,
}: {
  plan: PricingPlanView
  appliedVoucher: PremiumVoucherPreview | null
}) {
  const total = appliedVoucher?.finalAmount ?? plan.finalPrice

  return (
    <div className="rounded-lg border bg-secondary/35 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-semibold">{plan.name}</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {plan.description}
          </p>
        </div>
        {plan.discountPercent > 0 ? (
          <div className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
            Diskon {plan.discountPercent}%
          </div>
        ) : null}
      </div>

      <Separator className="my-4" />

      <div className="flex flex-col gap-3 text-sm">
        <SummaryRow
          label="Harga Paket"
          value={formatCurrencyIDR(plan.price)}
          struck={plan.discountPercent > 0}
        />
        {plan.discountPercent > 0 ? (
          <SummaryRow label="Diskon" value={`${plan.discountPercent}%`} />
        ) : null}
        {appliedVoucher ? (
          <SummaryRow
            label="Diskon Voucher"
            value={`-${formatCurrencyIDR(appliedVoucher.discountAmount)}`}
            accent
          />
        ) : null}
      </div>

      <Separator className="my-4" />

      <div className="flex items-end justify-between gap-4">
        <p className="text-sm font-medium text-muted-foreground">Total Bayar</p>
        <span className="text-2xl font-semibold tracking-tight">
          {formatCurrencyIDR(total)}
        </span>
      </div>
    </div>
  )
}

function VoucherCard({
  voucherCode,
  appliedVoucher,
  voucherProcessing,
  processing,
  onVoucherCodeChange,
  onApplyVoucher,
  onRemoveVoucher,
}: {
  voucherCode: string
  appliedVoucher: PremiumVoucherPreview | null
  voucherProcessing: boolean
  processing: boolean
  onVoucherCodeChange: (code: string) => void
  onApplyVoucher: () => void
  onRemoveVoucher: () => void
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <TicketPercentIcon
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="midtrans-voucher-code"
            value={voucherCode}
            onChange={(event) => onVoucherCodeChange(event.target.value)}
            placeholder="Kode Voucher"
            aria-label="Kode Voucher"
            disabled={processing || voucherProcessing || Boolean(appliedVoucher)}
            className="h-10 pl-10 uppercase"
          />
        </div>
        {appliedVoucher ? (
          <Button
            type="button"
            variant="outline"
            disabled={processing}
            className="h-10 shrink-0"
            onClick={onRemoveVoucher}
          >
            Hapus
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline-primary"
            disabled={processing || voucherProcessing || !voucherCode.trim()}
            className="h-10 shrink-0"
            onClick={onApplyVoucher}
          >
            {voucherProcessing ? "Mengecek..." : "Gunakan"}
          </Button>
        )}
      </div>
    </div>
  )
}

function SummaryRow({
  label,
  value,
  accent = false,
  struck = false,
}: {
  label: string
  value: string
  accent?: boolean
  struck?: boolean
}) {
  return (
    <div className={["flex items-center justify-between gap-3", accent ? "text-primary" : ""].filter(Boolean).join(" ")}>
      <span className="text-muted-foreground">{label}</span>
      <span className={struck ? "text-muted-foreground line-through" : ""}>
        {value}
      </span>
    </div>
  )
}
