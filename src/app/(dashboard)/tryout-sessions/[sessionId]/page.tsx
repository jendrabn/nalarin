import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { requireUser } from "@/features/auth/services/session"
import { TryoutSessionOverviewPage } from "@/features/tryouts/components/tryout-session-overview-page"
import { getTryoutSessionOverview } from "@/features/tryouts/queries/session"

export const metadata: Metadata = {
  title: "Sesi Tryout",
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

  const session = await getTryoutSessionOverview(id, user.id)

  if (!session) {
    notFound()
  }

  return <TryoutSessionOverviewPage session={session} />
}
