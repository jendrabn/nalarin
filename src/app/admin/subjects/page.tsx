import type { Metadata } from "next"

import { SubjectsPage } from "@/features/admin/academics/components/subjects-page"
import { getAdminAcademicLookups, getSubjects } from "@/features/admin/academics/queries"

export const metadata: Metadata = {
  title: "Subjects",
  description:
    "Manage subjects under each exam type using modal-based create and edit flows.",
}

export default async function Page() {
  const [subjects, lookups] = await Promise.all([
    getSubjects(),
    getAdminAcademicLookups(),
  ])

  return <SubjectsPage subjects={subjects} examTypes={lookups.examTypes} />
}
