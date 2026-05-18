import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

import type { PlanCode } from "@/config/plans"
import { requireUser } from "@/features/auth/services/session"
import { getCurrentActiveSubscription } from "@/features/premium/queries"
import { TryoutRankingPage } from "@/features/tryouts/components/tryout-ranking-page"
import { getTryoutRankingData } from "@/features/tryouts/queries/results"

export const metadata: Metadata = {
  title: "Ranking Tryout",
  description: "Leaderboard dan posisi ranking peserta tryout.",
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
  const data = await getTryoutRankingData(id, user.id, planCode)

  if (!data) {
    notFound()
  }

  if (data.session.status === "pending" || data.session.status === "in_progress") {
    redirect(`/tryout-sessions/${data.session.id}`)
  }

  return <TryoutRankingPage data={data} />
}
