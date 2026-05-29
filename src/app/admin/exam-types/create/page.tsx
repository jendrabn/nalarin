import type { Metadata } from "next"

import { ExamTypeFormPage } from "@/features/admin/exam-types/components/exam-type-form-page"

export const metadata: Metadata = {
  title: "Create Exam Type",
  description: "Create a new exam type and configure its package settings.",
}

export default function Page() {
  return (
    <ExamTypeFormPage
      mode="create"
      title="Create Exam Type"
      subtitle="Create a new exam type to configure its package settings and public information."
      submitLabel="Create exam type"
      backHref="/admin/exam-types"
      backLabel="Back to Exam Types"
    />
  )
}
