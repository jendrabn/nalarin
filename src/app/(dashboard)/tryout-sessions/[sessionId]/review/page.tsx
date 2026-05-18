import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

import type { PlanCode } from "@/config/plans"
import { requireUser } from "@/features/auth/services/session"
import { getCurrentActiveSubscription } from "@/features/premium/queries"
import { TryoutReviewPage } from "@/features/tryouts/components/tryout-review-page"
import { getTryoutReviewData } from "@/features/tryouts/queries/results"

export const metadata: Metadata = {
  title: "Review Jawaban Tryout",
  description: "Review jawaban, kunci jawaban, dan pembahasan tryout.",
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
  const data = await getTryoutReviewData(id, user.id, planCode)

  if (!data) {
    notFound()
  }

  if (data.session.status === "pending" || data.session.status === "in_progress") {
    redirect(`/tryout-sessions/${data.session.id}`)
  }

  return <TryoutReviewPage data={data} />
}
