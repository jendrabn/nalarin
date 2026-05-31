import type { Metadata } from "next"

import { GrammarQuestionsPage } from "@/features/admin/grammar-questions/components/grammar-questions-page"
import { getGrammarQuestions } from "@/features/admin/grammar-questions/queries"

export const metadata: Metadata = {
  title: "Grammar",
  description: "Manage fill-in-the-blank grammar questions, filters, and import workflow.",
}

export default async function Page() {
  const questions = await getGrammarQuestions()

  return <GrammarQuestionsPage questions={questions} />
}
