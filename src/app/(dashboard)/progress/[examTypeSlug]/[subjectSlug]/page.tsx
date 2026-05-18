import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { requireUser } from "@/features/auth/services/session"
import { ProgressPage } from "@/features/progress/components/progress-page"
import { getProgressPageData } from "@/features/progress/queries"
import { parseProgressPeriod } from "@/features/progress/utils/period"

export const metadata: Metadata = {
  title: "Progress Subtes",
  description: "Pantau progress belajar berdasarkan jenis ujian dan subtes.",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ examTypeSlug: string; subjectSlug: string }>
  searchParams: Promise<{ period?: string | string[] }>
}) {
  const [{ examTypeSlug, subjectSlug }, query, user] = await Promise.all([
    params,
    searchParams,
    requireUser(),
  ])
  const data = await getProgressPageData({
    userId: user.id,
    period: parseProgressPeriod(query.period),
    examTypeSlug,
    subjectSlug,
  })

  if (!data) {
    notFound()
  }

  return <ProgressPage data={data} />
}
