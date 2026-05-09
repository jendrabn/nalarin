import type { Metadata } from "next"

import { QuestionImportWorkspace } from "@/features/admin/questions/components/question-import-workspace"

export const metadata: Metadata = {
  title: "Import Questions",
  description:
    "Upload an Excel workbook to validate and import questions in bulk.",
}

export default async function Page() {
  return <QuestionImportWorkspace mode="upload" />
}
