"use client"

import Link from "next/link"
import { ArrowLeftIcon, HomeIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

export function ErrorPageActions() {
  function handleBack() {
    if (window.history.length > 1) {
      window.history.back()
      return
    }

    window.location.assign("/")
  }

  return (
    <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
      <Button
        type="button"
        variant="outline"
        size="xl"
        className="w-full sm:w-auto"
        onClick={handleBack}
      >
        <ArrowLeftIcon data-icon="inline-start" />
        Kembali
      </Button>
      <Button type="button" size="xl" className="w-full sm:w-auto" asChild>
        <Link href="/">
          <HomeIcon data-icon="inline-start" />
          Beranda
        </Link>
      </Button>
    </div>
  )
}
