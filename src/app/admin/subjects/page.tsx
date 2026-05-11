import type { Metadata } from "next"

import { SubjectsPage } from "@/features/admin/subjects/components/subjects-page"
import { getSubjects } from "@/features/admin/subjects/queries"
import { getExamTypeLookups } from "@/features/admin/exam-types/queries"

export const metadata: Metadata = {
  title: "Subjects",
  description:
    "Manage subjects under each exam type using modal-based create and edit flows.",
}

export default async function Page() {
  const [subjects, examTypes] = await Promise.all([getSubjects(), getExamTypeLookups()])

  return <SubjectsPage subjects={subjects} examTypes={examTypes} />
}
