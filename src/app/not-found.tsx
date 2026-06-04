import type { Metadata } from "next"

import { ErrorPageState } from "@/components/error-page-state"

export const metadata: Metadata = {
  title: "Halaman Tidak Ditemukan",
  description: "Halaman yang kamu cari tidak tersedia di Nalarin.",
}

export default function NotFound() {
  return (
    <ErrorPageState
      code="404"
      title="Halaman Tidak Ditemukan"
      description="Alamat yang kamu buka tidak tersedia, sudah dipindahkan, atau tidak bisa diakses."
    />
  )
}
