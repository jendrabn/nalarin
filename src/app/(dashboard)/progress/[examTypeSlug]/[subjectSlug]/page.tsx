import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { requireUser } from "@/features/auth/services/session"

export const metadata: Metadata = {
  title: "Progress Subtes",
  description: "Redirect ke progress berdasarkan jenis ujian.",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function Page({
  params,
}: {
  params: Promise<{ examTypeSlug: string; subjectSlug: string }>
}) {
  const { examTypeSlug } = await params
  await requireUser()

  redirect(`/progress/${examTypeSlug}`)
}
