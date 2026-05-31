import type { Metadata } from "next"

import { GrammarQuestionImportWorkspace } from "@/features/admin/grammar-questions/components/grammar-question-import-workspace"

export const metadata: Metadata = {
  title: "Import Grammar",
  description: "Upload an Excel workbook to validate and import grammar questions in bulk.",
}

export default async function Page() {
  return <GrammarQuestionImportWorkspace mode="upload" />
}
