import type { Metadata } from "next"

import { QuestionFormPage } from "@/features/admin/questions/components/question-form-page"
import { getAdminQuestionLookups } from "@/features/admin/questions/queries"

export const metadata: Metadata = {
  title: "Create Question",
  description: "Add a question with options, scoring, and explanation fields.",
}

export default async function Page() {
  const lookups = await getAdminQuestionLookups()

  return (
    <QuestionFormPage
      mode="create"
      title="Create Question"
      description="Create a question to add accurate content, options, and explanations."
      submitLabel="Create question"
      backHref="/admin/questions"
      lookups={lookups}
    />
  )
}

