import type { Metadata } from "next"
import { notFound } from "next/navigation"

import type { PlanCode } from "@/config/plans"
import { canAccessAiExplanationForPlan } from "@/features/ai-explanations/services"
import { requireUser } from "@/features/auth/services/session"
import { getCurrentActiveSubscription } from "@/features/premium/queries"
import { PracticeRoomPage } from "@/features/practices/components/practice-room-page"
import { getPracticeSessionRoom } from "@/features/practices/queries/session"

export const metadata: Metadata = {
  title: "Ruang Latihan",
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

  const [session, subscription] = await Promise.all([
    getPracticeSessionRoom(id, user.id),
    getCurrentActiveSubscription(user.id),
  ])

  if (!session) {
    notFound()
  }

  const planCode: PlanCode = subscription?.planCode ?? "free"
  const aiExplanationEnabled = await canAccessAiExplanationForPlan(user.id, planCode)

  return (
    <PracticeRoomPage
      session={session}
      aiExplanationEnabled={aiExplanationEnabled}
    />
  )
}
