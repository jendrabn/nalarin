import type { Metadata } from "next"

import { PracticeFormPage } from "@/features/admin/practices/components/practice-form-page"
import { getAdminPracticeLookups } from "@/features/admin/practices/queries"

export const metadata: Metadata = {
  title: "Create Practice",
  description: "Create a practice or quiz package from the admin panel.",
}

export default async function Page() {
  const lookups = await getAdminPracticeLookups()

  return (
    <PracticeFormPage
      mode="create"
      title="Create Practice"
      description="Build a practice or quiz package using published questions from the selected subject."
      backHref="/admin/practices"
      lookups={lookups}
    />
  )
}
