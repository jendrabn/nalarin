"use client"

import Image from "next/image"
import { CopyIcon, MessageCircleIcon, TicketPercentIcon } from "lucide-react"
import { toast } from "sonner"

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

import type {
  ManualPaymentConfig,
  PremiumPendingPayment,
  PremiumVoucherPreview,
} from "../types"

type ManualPaymentDialogProps = {
  plan: PricingPlanView | null
  manualPayment: ManualPaymentConfig
  pendingPayment: PremiumPendingPayment
  voucherCode: string
  appliedVoucher: PremiumVoucherPreview | null
  voucherProcessing: boolean
  processing: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  onVoucherCodeChange: (code: string) => void
  onApplyVoucher: () => void
  onRemoveVoucher: () => void
}

export function ManualPaymentDialog({
  plan,
  manualPayment,
  pendingPayment,
  voucherCode,
  appliedVoucher,
  voucherProcessing,
  processing,
  onOpenChange,
  onConfirm,
  onVoucherCodeChange,
  onApplyVoucher,
  onRemoveVoucher,
}: ManualPaymentDialogProps) {
  const amount = pendingPayment?.amount ?? appliedVoucher?.finalAmount ?? plan?.finalPrice ?? 0
  const orderId = pendingPayment?.gatewayOrderId ?? null
  const voucherDiscountAmount =
    pendingPayment?.discountAmount ?? appliedVoucher?.discountAmount ?? 0

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
      <DialogContent className="max-h-[min(88vh,760px)] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Pembayaran Manual {plan?.name}</DialogTitle>
          <DialogDescription>
            Transfer melalui salah satu e-wallet, lalu konfirmasi ke admin melalui
            WhatsApp.
          </DialogDescription>
        </DialogHeader>

        {plan ? (
          <ScrollArea className="-mx-6 min-h-0 px-6">
            <div className="flex flex-col gap-5 pb-1">
              {!pendingPayment ? (
                <div className="rounded-lg border bg-card p-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <div className="relative flex-1">
                        <TicketPercentIcon
                          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                          aria-hidden="true"
                        />
                        <Input
                          id="manual-payment-voucher-code"
                          value={voucherCode}
                          onChange={(event) => onVoucherCodeChange(event.target.value)}
                          placeholder="Masukkan Kode Voucher"
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
                </div>
              ) : null}

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
                  {voucherDiscountAmount > 0 ? (
                    <SummaryRow
                      label="Diskon Voucher"
                      value={`-${formatCurrencyIDR(voucherDiscountAmount)}`}
                      accent
                    />
                  ) : null}
                </div>

                <Separator className="my-4" />

                <div className="flex items-end justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-muted-foreground">Total Bayar</p>
                  </div>
                  <span className="text-2xl font-semibold tracking-tight">
                    {formatCurrencyIDR(amount)}
                  </span>
                </div>

                {orderId ? (
                  <>
                    <Separator className="my-4" />
                    <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-muted-foreground">Kode Pembayaran</span>
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
                <p className="font-medium">Ketentuan Konfirmasi</p>
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
