import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { TopicsPage } from "@/features/admin/academics/components/topics-page"
import {
  getAdminAcademicLookups,
  getTopicById,
  getTopics,
} from "@/features/admin/academics/queries"

type EditPageProps = {
  params: Promise<{
    topicId: string
  }>
}

export async function generateMetadata({
  params,
}: EditPageProps): Promise<Metadata> {
  const { topicId } = await params
  const id = Number(topicId)

  if (!Number.isFinite(id)) {
    return {
      title: "Edit Topic",
      description: "Edit a topic from the admin panel.",
    }
  }

  const topic = await getTopicById(id)

  return {
    title: topic ? `Edit ${topic.name}` : "Edit Topic",
    description:
      topic?.description ?? "Edit a topic from the admin panel.",
  }
}

export default async function Page({ params }: EditPageProps) {
  const { topicId } = await params
  const id = Number(topicId)

  if (!Number.isFinite(id)) {
    notFound()
  }

  const [topics, lookups, topic] = await Promise.all([
    getTopics(),
    getAdminAcademicLookups(),
    getTopicById(id),
  ])

  if (!topic) {
    notFound()
  }

  return (
    <TopicsPage
      topics={topics}
      examTypes={lookups.examTypes}
      subjects={lookups.subjects}
      defaultEditTopic={topic}
      closeDestination="/admin/topics"
    />
  )
}
