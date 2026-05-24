"use client"

import { CopyIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { formatAdminDate } from "@/lib/format"

import type { PublicVoucherPromo } from "../types"

type PublicVoucherListProps = {
  vouchers: PublicVoucherPromo[]
}

export function PublicVoucherList({ vouchers }: PublicVoucherListProps) {
  if (vouchers.length === 0) {
    return null
  }

  return (
    <section className="mx-auto mt-6 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {vouchers.map((voucher) => (
          <PublicVoucherCard key={voucher.id} voucher={voucher} />
        ))}
      </div>
    </section>
  )
}

function PublicVoucherCard({ voucher }: { voucher: PublicVoucherPromo }) {
  const rawLabel = voucher.promoLabel?.trim()
  const label =
    rawLabel && rawLabel.toLowerCase() !== voucher.code.trim().toLowerCase()
      ? rawLabel
      : `${voucher.discountPercent}% Diskon paket berbayar`

  async function handleCopyCode() {
    try {
      await navigator.clipboard.writeText(voucher.code)
      toast.success(`Kode voucher ${voucher.code} disalin.`)
    } catch {
      toast.error("Gagal menyalin kode voucher.")
    }
  }

  return (
    <article className="relative overflow-hidden rounded-lg border border-dashed border-primary/45 bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/65 hover:shadow-md">
      <div className="absolute bottom-0 left-[92px] size-5 -translate-x-1/2 translate-y-1/2 rounded-full border border-dashed border-primary/45 bg-background sm:left-[108px]" />
      <div className="absolute left-[92px] top-0 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-primary/45 bg-background sm:left-[108px]" />
      <div className="absolute inset-y-0 left-[92px] border-l border-dashed border-primary-foreground/50 sm:left-[108px]" />

      <div className="grid min-h-[124px] grid-cols-[92px_minmax(0,1fr)] sm:grid-cols-[108px_minmax(0,1fr)]">
        <div className="flex flex-col items-center justify-center gap-1 bg-primary px-3 py-4 text-center text-primary-foreground">
          <p className="text-2xl font-bold leading-none">{voucher.discountPercent}%</p>
          <p className="text-[10px] font-medium uppercase leading-none text-primary-foreground/80">Off</p>
        </div>

        <div className="relative flex min-w-0 flex-col justify-center overflow-hidden p-4">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,var(--primary)_1px,transparent_1.5px)] opacity-[0.06] [background-size:14px_14px]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-primary/8 to-transparent"
          />

          <p className="relative truncate text-sm font-semibold leading-5 text-foreground">{label}</p>

          <div className="relative mt-3 flex min-w-0 items-center gap-2">
            <div className="min-w-0 flex-1 rounded-md border border-primary/20 bg-primary/10 px-3 py-2">
              <p className="truncate font-mono text-sm font-semibold text-primary">{voucher.code}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9 shrink-0 rounded-md text-primary hover:bg-primary/10 hover:text-primary"
              aria-label={`Salin kode voucher ${voucher.code}`}
              onClick={() => void handleCopyCode()}
            >
              <CopyIcon data-icon="inline-start" />
            </Button>
          </div>

          <p className="relative mt-2 text-xs leading-5 text-muted-foreground">
            Berlaku Hingga{" "}
            <span className="font-medium text-foreground">{formatAdminDate(voucher.endsAt)}</span>
          </p>
        </div>
      </div>
    </article>
  )
}
