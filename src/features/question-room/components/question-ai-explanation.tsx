"use client"

import { useState } from "react"
import { Loader2Icon, SparklesIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import type { AiExplanationAccess } from "@/features/ai-explanations/types"

type AiExplanationResponse = {
  html?: string
  message?: string
}

export function QuestionAiExplanation({
  access,
  className,
}: {
  access: AiExplanationAccess
  className?: string
}) {
  const [html, setHtml] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  if (!access.enabled) {
    return null
  }

  async function handleGenerate() {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const response = await fetch("/api/ai/explanations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionType: access.sessionType,
          sessionId: access.sessionId,
          sessionQuestionId: access.sessionQuestionId,
        }),
      })
      const payload = (await response.json()) as AiExplanationResponse

      if (!response.ok || !payload.html) {
        throw new Error(payload.message ?? "Pembahasan AI gagal dibuat.")
      }

      setHtml(payload.html)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Pembahasan AI gagal dibuat. Coba lagi sebentar lagi."

      setErrorMessage(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-xl border border-amber-300/55 bg-[linear-gradient(135deg,#fffbeb,#fff7ed_46%,#ffffff)] p-4 shadow-[0_14px_34px_rgba(120,53,15,0.10)] dark:border-amber-300/25 dark:bg-[linear-gradient(135deg,rgba(69,26,3,0.70),rgba(28,25,23,0.96)_52%,rgba(12,10,9,0.98))]",
        "before:pointer-events-none before:absolute before:-right-10 before:-top-14 before:size-32 before:rounded-full before:bg-amber-300/20 before:blur-2xl",
        className,
      )}
    >
      <div className="relative z-10 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-full border border-amber-300/60 bg-amber-100/80 text-amber-700 shadow-sm dark:bg-amber-300/15 dark:text-amber-200">
            <SparklesIcon className="size-4" />
          </span>
          <h3 className="text-sm font-semibold text-amber-950 dark:text-amber-50">Pembahasan AI</h3>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={handleGenerate}
          disabled={isLoading}
          className="w-full border-0 bg-stone-950 text-amber-50 shadow-[0_10px_22px_rgba(28,25,23,0.22)] transition-transform hover:-translate-y-0.5 hover:bg-amber-600 hover:text-white disabled:translate-y-0 disabled:opacity-70 dark:bg-amber-400 dark:text-stone-950 dark:hover:bg-amber-300 sm:w-auto"
        >
          {isLoading ? (
            <Loader2Icon data-icon="inline-start" className="animate-spin" />
          ) : (
            <SparklesIcon data-icon="inline-start" />
          )}
          {isLoading ? "Membuat..." : "Lihat Pembahasan AI"}
        </Button>
      </div>

      {errorMessage ? (
        <div className="mt-3 rounded-md border border-destructive/25 bg-destructive/10 p-3 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}

      {html ? (
        <div
          className="mt-4 text-sm leading-7 [&_a]:font-medium [&_a]:text-amber-700 [&_a]:underline [&_a]:underline-offset-4 [&_figcaption]:mt-2 [&_figcaption]:text-xs [&_figcaption]:text-muted-foreground [&_figure]:my-4 [&_figure]:overflow-hidden [&_figure]:rounded-xl [&_figure]:border [&_figure]:bg-background/70 [&_figure]:p-2 [&_h3]:mb-2 [&_h3]:mt-4 [&_h3:first-child]:mt-0 [&_h3]:font-semibold [&_img]:max-h-80 [&_img]:w-full [&_img]:rounded-lg [&_img]:object-contain [&_li]:mb-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : null}
    </section>
  )
}
