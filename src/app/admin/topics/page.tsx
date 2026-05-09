import type { Metadata } from "next"

import { TopicsPage } from "@/features/admin/academics/components/topics-page"
import { getAdminAcademicLookups, getTopics } from "@/features/admin/academics/queries"

export const metadata: Metadata = {
  title: "Topics",
  description:
    "Manage topics under each subject using modal-based create and edit flows.",
}

export default async function Page() {
  const [topics, lookups] = await Promise.all([
    getTopics(),
    getAdminAcademicLookups(),
  ])

  return (
    <TopicsPage
      topics={topics}
      examTypes={lookups.examTypes}
      subjects={lookups.subjects}
    />
  )
}
