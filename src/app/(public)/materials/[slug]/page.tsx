import { notFound, redirect } from "next/navigation"

import { getPublishedMaterialBySlug } from "@/features/materials/queries"

type MaterialLegacyPageProps = {
  params: Promise<{ slug: string }>
}

export default async function Page({ params }: MaterialLegacyPageProps) {
  const { slug } = await params
  const material = await getPublishedMaterialBySlug(slug)

  if (!material) {
    notFound()
  }

  redirect(`/materials/exam/${material.examTypeSlug}/${material.slug}`)
}

