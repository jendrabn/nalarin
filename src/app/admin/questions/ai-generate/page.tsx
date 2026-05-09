import type { Metadata } from "next"

import { QuestionAiGeneratePage } from "@/features/admin/questions/components/question-ai-generate-page"
import { getAdminQuestionLookups } from "@/features/admin/questions/queries/questions"

export const metadata: Metadata = {
  title: "AI Generate Questions",
  description:
    "Generate draft questions with AI before saving them to the question bank.",
}

export default async function Page() {
  const lookups = await getAdminQuestionLookups()

  return <QuestionAiGeneratePage lookups={lookups} />
}
