"use client"

import Image from "next/image"
import { CopyIcon, MessageCircleIcon } from "lucide-react"
import { toast } from "sonner"

import type { PricingPlanView } from "@/lib/pricing-plans"
import { formatCurrencyIDR } from "@/lib/format"
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

import type { ManualPaymentConfig, PremiumPendingPayment } from "../types"

type ManualPaymentDialogProps = {
  plan: PricingPlanView | null
  manualPayment: ManualPaymentConfig
  pendingPayment: PremiumPendingPayment
  processing: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function ManualPaymentDialog({
  plan,
  manualPayment,
  pendingPayment,
  processing,
  onOpenChange,
  onConfirm,
}: ManualPaymentDialogProps) {
  const amount = pendingPayment?.amount ?? plan?.finalPrice ?? 0
  const orderId = pendingPayment?.gatewayOrderId ?? null

  async function handleCopyPhone(phone: string, name: string) {
    try {
      await navigator.clipboard.writeText(phone)
      toast.success(`Nomor ${name} disalin.`)
    } catch {
      toast.error("Gagal menyalin nomor.")
    }
  }

  return (
    <Dialog open={Boolean(plan)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Pembayaran Manual {plan?.name}</DialogTitle>
          <DialogDescription>
            Transfer melalui salah satu e-wallet, lalu konfirmasi ke admin melalui
            WhatsApp.
          </DialogDescription>
        </DialogHeader>

        {plan ? (
          <div className="flex flex-col gap-5">
            <div className="rounded-lg border bg-secondary/35 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold">{plan.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm text-muted-foreground">Total bayar</p>
                  <p className="text-xl font-semibold tracking-tight">
                    {formatCurrencyIDR(amount)}
                  </p>
                </div>
              </div>
              {orderId ? (
                <>
                  <Separator className="my-4" />
                  <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-muted-foreground">Kode pembayaran</span>
                    <span className="font-medium">{orderId}</span>
                  </div>
                </>
              ) : null}
            </div>

            <div className="rounded-lg border bg-card">
              {manualPayment.methods.map((method) => (
                <div
                  key={method.id}
                  className="flex items-center justify-between gap-4 border-b p-4 last:border-b-0"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-5">
                    <div className="flex w-28 shrink-0 items-center">
                      <Image
                        src={method.logoSrc}
                        alt={`${method.name} logo`}
                        width={112}
                        height={36}
                        className="h-7 w-auto object-contain"
                        unoptimized
                      />
                    </div>
                    <p className="min-w-0 truncate font-mono text-base font-bold tabular-nums text-foreground sm:text-lg">
                      {method.phone}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Salin nomor ${method.name}`}
                    onClick={() => void handleCopyPhone(method.phone, method.name)}
                  >
                    <CopyIcon />
                  </Button>
                </div>
              ))}
            </div>

            <div className="rounded-lg border bg-card p-4 text-sm leading-6">
              <p className="font-medium">Ketentuan konfirmasi</p>
              <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-muted-foreground">
                <li>Transfer sesuai nominal total bayar.</li>
                <li>
                  Klik konfirmasi pembayaran, lalu lampirkan screenshot bukti transfer
                  di WhatsApp.
                </li>
                <li>Akses paket aktif setelah admin memverifikasi pembayaran.</li>
              </ul>
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
            variant="cta"
            disabled={processing}
            onClick={onConfirm}
          >
            <MessageCircleIcon data-icon="inline-start" />
            {processing ? "Menyiapkan..." : "Konfirmasi Pembayaran"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
