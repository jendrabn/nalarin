"use client"

import { RefreshCcwIcon } from "lucide-react"

import { SiteFooter } from "@/components/site-footer"
import { SiteNavbar } from "@/components/site-navbar"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNavbar user={null} />
      <main className="mx-auto flex min-h-[62vh] w-full max-w-7xl items-center px-4 py-16 sm:px-6 lg:px-8">
        <Empty className="border bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <RefreshCcwIcon />
            </EmptyMedia>
            <EmptyTitle>Latihan belum bisa dimuat</EmptyTitle>
            <EmptyDescription>
              Terjadi kendala saat mengambil data bank soal.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button type="button" onClick={reset}>
              Coba lagi
            </Button>
          </EmptyContent>
        </Empty>
      </main>
      <SiteFooter />
    </div>
  )
}
