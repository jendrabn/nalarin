import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PracticeResultsPage } from "@/features/admin/practices/components/practice-results-page"
import { getPracticeById } from "@/features/admin/practices/queries"
import { getAdminPracticeInsightData } from "@/features/admin/practices/queries/insights"

type PracticeResultsPageProps = {
  params: Promise<{
    practiceId: string
  }>
}

export async function generateMetadata({
  params,
}: PracticeResultsPageProps): Promise<Metadata> {
  const { practiceId } = await params
  const id = Number(practiceId)

  if (!Number.isFinite(id)) {
    return {
      title: "Results & Analytics",
      description: "Review practice results to analyze participant performance and session trends.",
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const practice = await getPracticeById(id)

  return {
    title: practice ? `Results & Analytics - ${practice.title}` : "Results & Analytics",
    description:
      "Review practice results to analyze participant performance and session trends.",
    robots: {
      index: false,
      follow: false,
    },
  }
}

export default async function Page({ params }: PracticeResultsPageProps) {
  const { practiceId } = await params
  const id = Number(practiceId)

  if (!Number.isFinite(id)) {
    notFound()
  }

  const insight = await getAdminPracticeInsightData(id)

  if (!insight) {
    notFound()
  }

  return <PracticeResultsPage insight={insight} />
}

