import type { Metadata } from "next"

import { SubjectsPage } from "@/features/admin/academics/components/subjects-page"
import { getAdminAcademicLookups, getSubjects } from "@/features/admin/academics/queries"

export const metadata: Metadata = {
  title: "Create Subject",
  description: "Create a new subject under an exam type.",
}

export default async function Page() {
  const [subjects, lookups] = await Promise.all([
    getSubjects(),
    getAdminAcademicLookups(),
  ])

  return (
    <SubjectsPage
      subjects={subjects}
      examTypes={lookups.examTypes}
      defaultCreateOpen
      closeDestination="/admin/subjects"
    />
  )
}
