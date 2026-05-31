import type { Metadata } from "next"

import { GrammarQuestionImportWorkspace } from "@/features/admin/grammar-questions/components/grammar-question-import-workspace"

export const metadata: Metadata = {
  title: "Grammar Import Preview",
  description: "Review parsed grammar rows before importing them.",
}

export default async function Page() {
  return <GrammarQuestionImportWorkspace mode="preview" />
}
