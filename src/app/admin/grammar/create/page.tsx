import type { Metadata } from "next"

import { GrammarQuestionFormPage } from "@/features/admin/grammar-questions/components/grammar-question-form-page"

export const metadata: Metadata = {
  title: "Create Grammar",
  description: "Create a grammar fill-in-the-blank question with answers and distractors.",
}

export default async function Page() {
  return (
    <GrammarQuestionFormPage
      mode="create"
      title="Create Grammar"
      description="Create a fill-in-the-blank grammar question and define the correct answers plus distractors."
      submitLabel="Create Grammar"
      backHref="/admin/grammar"
    />
  )
}
