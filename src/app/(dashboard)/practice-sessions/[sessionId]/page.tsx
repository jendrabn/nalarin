import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { canAccessAiExplanationForExamType } from "@/features/ai-explanations/services"
import { requireUser } from "@/features/auth/services/session"
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

  const session = await getPracticeSessionRoom(id, user.id)

  if (!session) {
    notFound()
  }

  const aiExplanationEnabled = await canAccessAiExplanationForExamType(
    user.id,
    session.examTypeId,
  )

  return (
    <PracticeRoomPage
      session={session}
      aiExplanationEnabled={aiExplanationEnabled}
    />
  )
}
