import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { TryoutResultsPage } from "@/features/admin/tryouts/components/tryout-results-page"
import { getAdminTryoutInsightData } from "@/features/admin/tryouts/queries/insights"
import { getTryoutById } from "@/features/admin/tryouts/queries"

type TryoutResultsPageProps = {
  params: Promise<{
    tryoutId: string
  }>
}

export async function generateMetadata({
  params,
}: TryoutResultsPageProps): Promise<Metadata> {
  const { tryoutId } = await params
  const id = Number(tryoutId)

  if (!Number.isFinite(id)) {
    return {
      title: "Hasil Tryout",
      description: "Lihat ringkasan hasil tryout dari panel admin.",
    }
  }

  const tryout = await getTryoutById(id)

  return {
    title: tryout ? `Hasil Tryout ${tryout.title}` : "Hasil Tryout",
    description:
      tryout?.description ??
      "Lihat ringkasan hasil tryout, leaderboard, dan detail subtest dari panel admin.",
    robots: {
      index: false,
      follow: false,
    },
  }
}

export default async function Page({ params }: TryoutResultsPageProps) {
  const { tryoutId } = await params
  const id = Number(tryoutId)

  if (!Number.isFinite(id)) {
    notFound()
  }

  const insight = await getAdminTryoutInsightData(id)

  if (!insight) {
    notFound()
  }

  return <TryoutResultsPage insight={insight} />
}
