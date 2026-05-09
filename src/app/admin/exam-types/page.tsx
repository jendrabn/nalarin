import type { Metadata } from "next"

import { ExamTypesPage } from "@/features/admin/academics/components/exam-types-page"
import { getExamTypes } from "@/features/admin/academics/queries"

export const metadata: Metadata = {
  title: "Exam Types",
  description:
    "Edit seeded exam types that drive subjects, topics, practices, tryouts, and question filters.",
}

export default async function Page() {
  const examTypes = await getExamTypes()

  return <ExamTypesPage examTypes={examTypes} />
}
