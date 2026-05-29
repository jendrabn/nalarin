import type { Metadata } from "next"

import { ExamTypesPage } from "@/features/admin/exam-types/components/exam-types-page"
import { getExamTypes } from "@/features/admin/exam-types/queries"

export const metadata: Metadata = {
  title: "Exam Types",
  description:
    "Manage exam types to keep package settings and public information organized.",
}

export default async function Page() {
  const examTypes = await getExamTypes()

  return <ExamTypesPage examTypes={examTypes} />
}

