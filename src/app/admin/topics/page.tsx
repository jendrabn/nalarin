import type { Metadata } from "next"

import { TopicsPage } from "@/features/admin/topics/components/topics-page"
import { getTopics } from "@/features/admin/topics/queries"
import { getExamTypeLookups } from "@/features/admin/exam-types/queries"
import { getSubjectLookups } from "@/features/admin/subjects/queries"

export const metadata: Metadata = {
  title: "Topics",
  description:
    "Manage topics under each subject using modal-based create and edit flows.",
}

export default async function Page() {
  const [topics, examTypes, subjects] = await Promise.all([
    getTopics(),
    getExamTypeLookups(),
    getSubjectLookups(),
  ])

  return (
    <TopicsPage
      topics={topics}
      examTypes={examTypes}
      subjects={subjects}
    />
  )
}
