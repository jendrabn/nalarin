import type { Metadata } from "next"

import { TopicsPage } from "@/features/admin/academics/components/topics-page"
import { getAdminAcademicLookups, getTopics } from "@/features/admin/academics/queries"

export const metadata: Metadata = {
  title: "Create Topic",
  description: "Create a new topic under a subject.",
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
      defaultCreateOpen
      closeDestination="/admin/topics"
    />
  )
}
