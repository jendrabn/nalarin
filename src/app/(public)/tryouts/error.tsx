"use client"

import { RefreshCwIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export default function Error({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-7xl items-center px-4 py-16 sm:px-6 lg:px-8">
      <Empty className="border bg-card">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <RefreshCwIcon />
          </EmptyMedia>
          <EmptyTitle>Gagal memuat tryout</EmptyTitle>
          <EmptyDescription>
            Data tryout belum bisa diambil. Coba muat ulang halaman ini.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button type="button" onClick={reset}>
            <RefreshCwIcon data-icon="inline-start" />
            Muat Ulang
          </Button>
        </EmptyContent>
      </Empty>
    </main>
  )
}
