import type { Metadata } from "next"

import { TryoutFormPage } from "@/features/admin/tryouts/components/tryout-form-page"
import { getAdminTryoutLookups } from "@/features/admin/tryouts/queries"

export const metadata: Metadata = {
  title: "Create Tryout",
  description: "Create a tryout from the admin panel.",
}

export default async function Page() {
  const lookups = await getAdminTryoutLookups()

  return (
    <TryoutFormPage
      mode="create"
      title="Create Tryout"
      description="Create a tryout to define its schedule, access, and sections."
      backHref="/admin/tryouts"
      lookups={lookups}
    />
  )
}
