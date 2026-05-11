import type { Metadata } from "next"

import { QuestionFormPage } from "@/features/admin/questions/components/question-form-page"
import { getAdminQuestionLookups } from "@/features/admin/questions/queries/questions"

export const metadata: Metadata = {
  title: "Create Question",
  description: "Create a question from the admin panel.",
}

export default async function Page() {
  const lookups = await getAdminQuestionLookups()

  return (
    <QuestionFormPage
      mode="create"
      title="Create Question"
      description="Create a question bank entry with content, options, and explanation fields."
      submitLabel="Create question"
      backHref="/admin/questions"
      lookups={lookups}
    />
  )
}
