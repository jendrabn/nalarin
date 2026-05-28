import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

import { requireUser } from "@/features/auth/services/session"
import { TryoutSessionPageShell } from "@/features/tryouts/components/tryout-session-page-shell"
import { TryoutResultPage } from "@/features/tryouts/components/tryout-result-page"
import { getTryoutResultData } from "@/features/tryouts/queries/results"
import type { SiteUser } from "@/components/site-navbar"

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

  const data = await getTryoutResultData(id, user.id)

  if (!data) {
    notFound()
  }

  if (data.status === "pending" || data.status === "in_progress") {
    redirect(`/tryout-sessions/${data.id}`)
  }

  const siteUser: NonNullable<SiteUser> = {
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    role: user.role,
  }

  return (
    <TryoutSessionPageShell user={siteUser}>
      <TryoutResultPage data={data} />
    </TryoutSessionPageShell>
  )
}
