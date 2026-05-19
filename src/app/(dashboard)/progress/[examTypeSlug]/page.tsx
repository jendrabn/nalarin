import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { requireUser } from "@/features/auth/services/session"
import { ProgressPage } from "@/features/progress/components/progress-page"
import { getProgressPageData } from "@/features/progress/queries"

export const metadata: Metadata = {
  title: "Progress Ujian",
  description: "Pantau progress belajar berdasarkan jenis ujian.",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function Page({
  params,
}: {
  params: Promise<{ examTypeSlug: string }>
}) {
  const [{ examTypeSlug }, user] = await Promise.all([params, requireUser()])
  const data = await getProgressPageData({ userId: user.id, examTypeSlug })

  if (!data) {
    notFound()
  }

  return <ProgressPage data={data} />
}
