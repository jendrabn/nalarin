"use client"

import { useEffect } from "react"

import { ErrorPageState } from "@/components/error-page-state"
import "./globals.css"

type GlobalErrorProps = {
  error: Error & { digest?: string }
}

export default function GlobalError({ error }: GlobalErrorProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html
      lang="id"
      suppressHydrationWarning
      className="h-full antialiased"
      data-scroll-behavior="smooth"
    >
      <body
        suppressHydrationWarning
        className="min-h-full bg-background text-foreground"
      >
        <title>Aplikasi belum bisa dimuat</title>
        <ErrorPageState
          code="500"
          title="Aplikasi belum bisa dimuat"
          description="Terjadi kesalahan sistem saat menyusun halaman. Silakan kembali ke halaman sebelumnya atau buka beranda."
          tone="destructive"
        />
      </body>
    </html>
  )
}
