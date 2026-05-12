"use client"

import type { PricingPlanView } from "@/lib/pricing-plans"
import { formatCurrencyIDR } from "@/lib/format"
import { Badge } from "@/components/ui/badge"
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

type CheckoutConfirmationDialogProps = {
  plan: PricingPlanView | null
  processing: boolean
  onOpenChange: (open: boolean) => void
  onContinue: () => void
}

export function CheckoutConfirmationDialog({
  plan,
  processing,
  onOpenChange,
  onContinue,
}: CheckoutConfirmationDialogProps) {
  return (
    <Dialog open={Boolean(plan)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Konfirmasi Paket {plan?.name}</DialogTitle>
          <DialogDescription>
            Periksa detail paket sebelum melanjutkan pembayaran.
          </DialogDescription>
        </DialogHeader>

        {plan ? <CheckoutSummary plan={plan} /> : null}

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

function CheckoutSummary({ plan }: { plan: PricingPlanView }) {
  return (
    <div className="rounded-xl border bg-secondary/35 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold">{plan.name}</p>
          <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
        </div>
        {plan.discountPercent > 0 ? (
          <Badge variant="soft">Diskon {plan.discountPercent}%</Badge>
        ) : null}
      </div>
      <Separator className="my-4" />
      <div className="flex flex-col gap-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Harga asli</span>
          <span
            className={
              plan.discountPercent > 0 ? "text-muted-foreground line-through" : ""
            }
          >
            {formatCurrencyIDR(plan.price)}
          </span>
        </div>
        {plan.discountPercent > 0 ? (
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Diskon</span>
            <span>{plan.discountPercent}%</span>
          </div>
        ) : null}
        <div className="flex items-center justify-between gap-3 text-base font-semibold">
          <span>Total bayar</span>
          <span>{formatCurrencyIDR(plan.finalPrice)}</span>
        </div>
      </div>
    </div>
  )
}
