"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { BookOpenCheckIcon, FileTextIcon, Loader2Icon, RotateCcwIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

import { startPracticeSessionAction } from "../actions"
import type { PracticeMode } from "../types"

export function PracticeResultActions({
  practiceId,
  sessionId,
  mode,
}: {
  practiceId: number
  sessionId: number
  mode: PracticeMode
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleRetry() {
    startTransition(async () => {
      const result = await startPracticeSessionAction({
        practiceId,
        mode,
        restartExisting: true,
      })

      if (!result.success) {
        toast.error(result.message)
        return
      }

      router.push(`/practice-sessions/${result.data.sessionId}`)
    })
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
      <Button type="button" variant="outline" asChild>
        <Link href={`/practice-sessions/${sessionId}/review`}>
          <FileTextIcon data-icon="inline-start" />
          Lihat Pembahasan
        </Link>
      </Button>
      <Button type="button" onClick={handleRetry} disabled={isPending}>
        {isPending ? (
          <Loader2Icon data-icon="inline-start" className="animate-spin" />
        ) : (
          <RotateCcwIcon data-icon="inline-start" />
        )}
        Latih Lagi
      </Button>
      <Button type="button" variant="ghost" asChild>
        <Link href="/practices">
          <BookOpenCheckIcon data-icon="inline-start" />
          Bank Soal
        </Link>
      </Button>
    </div>
  )
}
