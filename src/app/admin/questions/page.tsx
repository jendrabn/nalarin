import type { Metadata } from "next"

import { QuestionsPage } from "@/features/admin/questions/components/questions-page"
import { getQuestions } from "@/features/admin/questions/queries"

export const metadata: Metadata = {
  title: "Questions",
  description: "Manage questions to keep the question bank organized and current.",
}

export default async function Page() {
  const questions = await getQuestions()

  return <QuestionsPage questions={questions} />
}

