import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { requireUser } from "@/features/auth/services/session"
import { TryoutSectionRoomPage } from "@/features/tryouts/components/tryout-section-room-page"
import { getTryoutSectionRoom } from "@/features/tryouts/queries/session"

export const metadata: Metadata = {
  title: "Ruang Tryout",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function Page({
  params,
}: {
  params: Promise<{ sessionId: string; sectionSessionId: string }>
}) {
  const [{ sessionId, sectionSessionId }, user] = await Promise.all([params, requireUser()])
  const id = Number(sessionId)
  const sectionId = Number(sectionSessionId)

  if (!Number.isInteger(id) || id <= 0 || !Number.isInteger(sectionId) || sectionId <= 0) {
    notFound()
  }

  const session = await getTryoutSectionRoom(id, sectionId, user.id)

  if (!session) {
    notFound()
  }

  return <TryoutSectionRoomPage session={session} />
}
