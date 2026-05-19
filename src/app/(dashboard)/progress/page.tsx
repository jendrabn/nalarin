import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { requireUser } from "@/features/auth/services/session"
import { ProgressPage } from "@/features/progress/components/progress-page"
import { getProgressPageData } from "@/features/progress/queries"

export const metadata: Metadata = {
  title: "Progress Belajar",
  description: "Pantau akurasi, skor, topik kuat, topik prioritas, dan riwayat belajar.",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function Page() {
  const user = await requireUser()
  const data = await getProgressPageData({ userId: user.id })

  if (!data) {
    notFound()
  }

  return <ProgressPage data={data} />
}
