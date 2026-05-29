import type { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Practice Analytics Redirect",
  description: "Redirect to practice results and analytics.",
}

type PracticeAnalyticsPageProps = {
  params: Promise<{
    practiceId: string
  }>
}

export default async function Page({ params }: PracticeAnalyticsPageProps) {
  const { practiceId } = await params

  redirect(`/admin/practices/${practiceId}/results`)
}

