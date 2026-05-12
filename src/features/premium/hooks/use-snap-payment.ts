"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"

type SnapCallbacks = {
  onSuccess?: (result: unknown) => void
  onPending?: (result: unknown) => void
  onError?: (result: unknown) => void
  onClose?: () => void
}

declare global {
  interface Window {
    snap?: {
      pay: (token: string, callbacks?: SnapCallbacks) => void
    }
  }
}

export function useSnapPayment() {
  const router = useRouter()

  return {
    openSnapPayment({
      snapToken,
      paymentUrl,
    }: {
      snapToken: string | null
      paymentUrl?: string | null
    }) {
      if (!snapToken && paymentUrl) {
        window.location.assign(paymentUrl)
        return
      }

      if (!window.snap) {
        if (paymentUrl) {
          window.location.assign(paymentUrl)
          return
        }

        toast.error("Layanan pembayaran belum siap. Muat ulang halaman lalu coba lagi.")
        return
      }

      if (!snapToken) {
        toast.error("Data pembayaran tidak lengkap. Batalkan lalu buat transaksi baru.")
        return
      }

      window.snap.pay(snapToken, {
        onSuccess: () => {
          toast.success("Pembayaran berhasil diproses.")
          router.refresh()
        },
        onPending: () => {
          toast.message(
            "Pembayaran masih pending. Selesaikan pembayaran untuk mengaktifkan paket.",
          )
          router.refresh()
        },
        onError: () => {
          toast.error("Pembayaran gagal diproses.")
          router.refresh()
        },
        onClose: () => {
          router.refresh()
        },
      })
    },
  }
}
