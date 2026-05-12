import type { Metadata } from "next"

import { QuestionImportWorkspace } from "@/features/admin/questions/components/question-import-workspace"
import { getAdminQuestionLookups } from "@/features/admin/questions/queries"

export const metadata: Metadata = {
  title: "Import Questions",
  description:
    "Upload an Excel workbook to validate and import questions in bulk.",
}

export default async function Page() {
  const lookups = await getAdminQuestionLookups()

  return <QuestionImportWorkspace mode="upload" lookups={lookups} />
}
