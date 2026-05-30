import type { Metadata } from "next"

import { MaterialsPage } from "@/features/admin/materials/components/materials-page"
import { getAdminMaterialLookups, getMaterials } from "@/features/admin/materials/queries"

export const metadata: Metadata = {
  title: "Materials",
  description: "Manage materials to organize video and text learning content.",
}

export default async function Page() {
  const [materials, lookups] = await Promise.all([
    getMaterials(),
    getAdminMaterialLookups(),
  ])

  return <MaterialsPage materials={materials} lookups={lookups} />
}

