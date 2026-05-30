import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { MaterialFormPage } from "@/features/admin/materials/components/material-form-page"
import { getAdminMaterialLookups, getMaterialById } from "@/features/admin/materials/queries"

type MaterialEditRouteProps = {
  params: Promise<{
    materialId: string
  }>
}

export async function generateMetadata({
  params,
}: MaterialEditRouteProps): Promise<Metadata> {
  const { materialId } = await params
  const id = Number(materialId)

  if (!Number.isFinite(id)) {
    return {
      title: "Edit Material",
      description: "Update a material.",
    }
  }

  const material = await getMaterialById(id)

  return {
    title: material ? `Edit ${material.title}` : "Edit Material",
    description: material?.excerpt ?? "Update a material.",
  }
}

export default async function Page({ params }: MaterialEditRouteProps) {
  const { materialId } = await params
  const id = Number(materialId)

  if (!Number.isFinite(id)) {
    notFound()
  }

  const [material, lookups] = await Promise.all([
    getMaterialById(id),
    getAdminMaterialLookups(),
  ])

  if (!material) {
    notFound()
  }

  return (
    <MaterialFormPage
      mode="edit"
      materialId={material.id}
      title={`Edit ${material.title}`}
      description="Update taxonomy, content, access, and publication status."
      submitLabel="Save changes"
      backHref={`/admin/materials/${material.id}`}
      lookups={lookups}
      initialValues={material}
    />
  )
}

