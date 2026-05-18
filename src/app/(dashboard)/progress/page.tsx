import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { requireUser } from "@/features/auth/services/session"
import { ProgressPage } from "@/features/progress/components/progress-page"
import { getProgressPageData } from "@/features/progress/queries"
import { parseProgressPeriod } from "@/features/progress/utils/period"

export const metadata: Metadata = {
  title: "Progress Belajar",
  description: "Pantau akurasi, skor, topik kuat, topik prioritas, dan riwayat belajar.",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ period?: string | string[] }>
}) {
  const [user, query] = await Promise.all([requireUser(), searchParams])
  const data = await getProgressPageData({
    userId: user.id,
    period: parseProgressPeriod(query.period),
  })

  if (!data) {
    notFound()
  }

  return <ProgressPage data={data} />
}
