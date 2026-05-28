import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

import type { SiteUser } from "@/components/site-navbar"
import { canAccessAiExplanationForExamType } from "@/features/ai-explanations/services"
import { PracticeSessionPageShell } from "@/features/practices/components/practice-session-page-shell"
import { PracticeReviewPage } from "@/features/practices/components/practice-review-page"
import { requireUser } from "@/features/auth/services/session"
import { getPracticeSessionSummary } from "@/features/practices/queries/session"

export const metadata: Metadata = {
  title: "Review Jawaban Latihan",
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

  const summary = await getPracticeSessionSummary(id, user.id)

  if (!summary) {
    notFound()
  }

  if (summary.status === "in_progress") {
    redirect(`/practice-sessions/${summary.id}`)
  }

  const siteUser: NonNullable<SiteUser> = {
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    role: user.role,
  }
  const aiExplanationEnabled = await canAccessAiExplanationForExamType(
    user.id,
    summary.examTypeId,
  )

  return (
    <PracticeSessionPageShell user={siteUser}>
      <PracticeReviewPage
        summary={summary}
        aiExplanationEnabled={aiExplanationEnabled}
      />
    </PracticeSessionPageShell>
  )
}
