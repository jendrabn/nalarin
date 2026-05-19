import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { cache } from "react"

import type { PlanCode } from "@/config/plans"
import { requireUser } from "@/features/auth/services/session"
import { getCurrentActiveSubscription } from "@/features/premium/queries"
import { TryoutSessionPageShell } from "@/features/tryouts/components/tryout-session-page-shell"
import { TryoutRankingPage } from "@/features/tryouts/components/tryout-ranking-page"
import { getTryoutRankingData } from "@/features/tryouts/queries/results"
import type { SiteUser } from "@/components/site-navbar"

const getRankingPageData = cache(async (sessionId: number, userId: number, planCode: PlanCode) => {
  return getTryoutRankingData(sessionId, userId, planCode)
})

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sessionId: string }>
}): Promise<Metadata> {
  const [{ sessionId }, user] = await Promise.all([params, requireUser()])
  const id = Number(sessionId)

  if (!Number.isInteger(id) || id <= 0) {
    return {
      title: "Rangking Tryout",
      description: "Leaderboard dan posisi ranking peserta tryout.",
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const subscription = await getCurrentActiveSubscription(user.id)
  const planCode: PlanCode = subscription?.planCode ?? "free"
  const data = await getRankingPageData(id, user.id, planCode)

  if (!data) {
    return {
      title: "Rangking Tryout",
      description: "Leaderboard dan posisi ranking peserta tryout.",
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  return {
    title: {
      absolute: `Rangking Tryout ${data.session.title}`,
    },
    description: `Leaderboard peserta tryout untuk ${data.session.title}. Urutan disusun dari skor tertinggi ke terendah.`,
    robots: {
      index: false,
      follow: false,
    },
  }
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
  const data = await getRankingPageData(id, user.id, planCode)

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
      <TryoutRankingPage data={data} />
    </TryoutSessionPageShell>
  )
}
