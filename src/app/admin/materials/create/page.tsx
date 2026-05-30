import type { Metadata } from "next"

import { MaterialFormPage } from "@/features/admin/materials/components/material-form-page"
import { getAdminMaterialLookups } from "@/features/admin/materials/queries"

export const metadata: Metadata = {
  title: "Create Material",
  description: "Create a new material for video or rich text learning content.",
}

export default async function Page() {
  const lookups = await getAdminMaterialLookups()

  return (
    <MaterialFormPage
      mode="create"
      title="Create Material"
      description="Create a new material for video or rich text learning content."
      submitLabel="Create material"
      backHref="/admin/materials"
      lookups={lookups}
    />
  )
}

