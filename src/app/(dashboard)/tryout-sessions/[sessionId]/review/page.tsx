import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

import { requireUser } from "@/features/auth/services/session"
import { TryoutSessionPageShell } from "@/features/tryouts/components/tryout-session-page-shell"
import { TryoutReviewPage } from "@/features/tryouts/components/tryout-review-page"
import { getTryoutReviewData } from "@/features/tryouts/queries/results"
import type { SiteUser } from "@/components/site-navbar"

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

  const data = await getTryoutReviewData(id, user.id)

  if (!data) {
    notFound()
  }

  if (data.session.status === "pending" || data.session.status === "in_progress") {
    redirect(`/tryout-sessions/${data.session.id}`)
  }

  const siteUser: NonNullable<SiteUser> = {
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    role: user.role,
  }

  return (
    <TryoutSessionPageShell user={siteUser}>
      <TryoutReviewPage data={data} />
    </TryoutSessionPageShell>
  )
}
