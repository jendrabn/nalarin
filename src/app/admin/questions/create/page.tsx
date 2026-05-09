import type { Metadata } from "next"

import { QuestionFormPage } from "@/features/admin/questions/components/question-form-page"
import { getAdminQuestionLookups } from "@/features/admin/questions/queries/questions"

export const metadata: Metadata = {
  title: "Create Question",
  description:
    "Create a new question with rich content, structured options, and validation.",
}

export default async function Page() {
  const lookups = await getAdminQuestionLookups()

  return (
    <QuestionFormPage
      mode="create"
      title="Create Question"
      description="Create a new question bank entry with taxonomy, content, and explanation fields."
      submitLabel="Create question"
      backHref="/admin/questions"
      lookups={lookups}
    />
  )
}
