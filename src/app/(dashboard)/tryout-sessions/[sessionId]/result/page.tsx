import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

import type { PlanCode } from "@/config/plans"
import { requireUser } from "@/features/auth/services/session"
import { getCurrentActiveSubscription } from "@/features/premium/queries"
import { TryoutResultPage } from "@/features/tryouts/components/tryout-result-page"
import { getTryoutResultData } from "@/features/tryouts/queries/results"

export const metadata: Metadata = {
  title: "Hasil Tryout",
  description: "Ringkasan skor, breakdown subtes, dan akses review jawaban tryout.",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function Page({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const [{ sessionId }, user] = await Promise.all([params, requireUser()])
  const id = Number(sessionId)

  if (!Number.isInteger(id) || id <= 0) {
    notFound()
  }

  const subscription = await getCurrentActiveSubscription(user.id)
  const planCode: PlanCode = subscription?.planCode ?? "free"
  const data = await getTryoutResultData(id, user.id, planCode)

  if (!data) {
    notFound()
  }

  if (data.status === "pending" || data.status === "in_progress") {
    redirect(`/tryout-sessions/${data.id}`)
  }

  return <TryoutResultPage data={data} />
}
