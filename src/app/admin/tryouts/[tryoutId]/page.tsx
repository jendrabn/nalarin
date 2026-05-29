import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { TryoutDetailPage } from "@/features/admin/tryouts/components/tryout-detail-page"
import { getTryoutById } from "@/features/admin/tryouts/queries"

type TryoutPageProps = {
  params: Promise<{
    tryoutId: string
  }>
}

export async function generateMetadata({
  params,
}: TryoutPageProps): Promise<Metadata> {
  const { tryoutId } = await params
  const id = Number(tryoutId)

  if (!Number.isFinite(id)) {
    return {
      title: "Tryout Detail",
      description: "Review this tryout to inspect its configuration and section layout.",
    }
  }

  const tryout = await getTryoutById(id)

  return {
    title: tryout ? tryout.title : "Tryout Detail",
    description: "Review this tryout to inspect its configuration and section layout.",
  }
}

export default async function Page({ params }: TryoutPageProps) {
  const { tryoutId } = await params
  const id = Number(tryoutId)

  if (!Number.isFinite(id)) {
    notFound()
  }

  const tryout = await getTryoutById(id)

  if (!tryout) {
    notFound()
  }

  return <TryoutDetailPage tryout={tryout} />
}

