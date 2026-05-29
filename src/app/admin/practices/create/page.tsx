import type { Metadata } from "next"

import { PracticeFormPage } from "@/features/admin/practices/components/practice-form-page"
import { getAdminPracticeLookups } from "@/features/admin/practices/queries"

export const metadata: Metadata = {
  title: "Create Practice",
  description: "Create a practice set with practice and quiz mode controls.",
}

export default async function Page() {
  const lookups = await getAdminPracticeLookups()

  return (
    <PracticeFormPage
      mode="create"
      title="Create Practice"
      description="Create a practice to define access, scoring, and question scope."
      backHref="/admin/practices"
      lookups={lookups}
    />
  )
}

