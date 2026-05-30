import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { MaterialDetailPage } from "@/features/admin/materials/components/material-detail-page"
import { getMaterialById } from "@/features/admin/materials/queries"

type MaterialDetailRouteProps = {
  params: Promise<{
    materialId: string
  }>
}

export async function generateMetadata({
  params,
}: MaterialDetailRouteProps): Promise<Metadata> {
  const { materialId } = await params
  const id = Number(materialId)

  if (!Number.isFinite(id)) {
    return {
      title: "Material Detail",
      description: "Review a material.",
    }
  }

  const material = await getMaterialById(id)

  return {
    title: material ? `${material.title} - Material Detail` : "Material Detail",
    description: material?.excerpt ?? "Review a material.",
  }
}

export default async function Page({ params }: MaterialDetailRouteProps) {
  const { materialId } = await params
  const id = Number(materialId)

  if (!Number.isFinite(id)) {
    notFound()
  }

  const material = await getMaterialById(id)

  if (!material) {
    notFound()
  }

  return <MaterialDetailPage material={material} />
}

