import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PracticeDetailPage } from "@/features/admin/practices/components/practice-detail-page"
import { getPracticeById } from "@/features/admin/practices/queries"

type PracticePageProps = {
  params: Promise<{
    practiceId: string
  }>
}

export async function generateMetadata({
  params,
}: PracticePageProps): Promise<Metadata> {
  const { practiceId } = await params
  const id = Number(practiceId)

  if (!Number.isFinite(id)) {
    return {
      title: "Practice Detail",
      description: "View a practice.",
    }
  }

  const practice = await getPracticeById(id)

  return {
    title: practice ? practice.title : "Practice Detail",
    description: practice?.description ?? "View a practice.",
  }
}

export default async function Page({ params }: PracticePageProps) {
  const { practiceId } = await params
  const id = Number(practiceId)

  if (!Number.isFinite(id)) {
    notFound()
  }

  const practice = await getPracticeById(id)

  if (!practice) {
    notFound()
  }

  return <PracticeDetailPage practice={practice} />
}

