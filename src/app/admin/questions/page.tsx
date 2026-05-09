import type { Metadata } from "next"

import { QuestionsPage } from "@/features/admin/questions/components/questions-page"
import { getQuestions } from "@/features/admin/questions/queries/questions"

export const metadata: Metadata = {
  title: "Questions",
  description:
    "Manage the question bank, import questions from Excel, and generate draft questions with AI.",
}

export default async function Page() {
  const questions = await getQuestions()

  return <QuestionsPage questions={questions} />
}
