"use client"

import { useTransition } from "react"
import { ArrowRightIcon, LockIcon, PlayCircleIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

import { startTryoutSessionAction } from "../actions"

type StartTryoutButtonProps = {
  tryoutSlug: string
  label: string
  disabled?: boolean
  disabledMessage?: string
  locked?: boolean
}

export function StartTryoutButton({
  tryoutSlug,
  label,
  disabled = false,
  disabledMessage,
  locked = false,
}: StartTryoutButtonProps) {
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      type="button"
      size="lg"
      className="h-11 w-full text-base sm:w-auto sm:min-w-56"
      disabled={isPending}
      aria-disabled={disabled || isPending}
      onClick={() => {
        if (disabled) {
          if (disabledMessage) {
            toast.error(disabledMessage)
          }
          return
        }

        startTransition(async () => {
          const result = await startTryoutSessionAction({ tryoutSlug })

          if (!result.success) {
            toast.error(result.message)
          }
        })
      }}
    >
      {locked ? <LockIcon data-icon="inline-start" /> : <PlayCircleIcon data-icon="inline-start" />}
      {isPending ? "Memproses..." : label}
      <ArrowRightIcon data-icon="inline-end" />
    </Button>
  )
}
