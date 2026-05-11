import type { Metadata } from "next"

import { SubjectsPage } from "@/features/admin/subjects/components/subjects-page"
import { getSubjects } from "@/features/admin/subjects/queries"
import { getExamTypeLookups } from "@/features/admin/exam-types/queries"

export const metadata: Metadata = {
  title: "Create Subject",
  description: "Create a new subject under an exam type.",
}

export default async function Page() {
  const [subjects, examTypes] = await Promise.all([getSubjects(), getExamTypeLookups()])

  return (
    <SubjectsPage
      subjects={subjects}
      examTypes={examTypes}
      defaultCreateOpen
      closeDestination="/admin/subjects"
    />
  )
}
