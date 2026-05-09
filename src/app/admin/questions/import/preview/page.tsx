import type { Metadata } from "next"

import { QuestionImportWorkspace } from "@/features/admin/questions/components/question-import-workspace"

export const metadata: Metadata = {
  title: "Import Preview",
  description:
    "Review parsed question rows and import the valid entries into the bank.",
}

export default async function Page() {
  return <QuestionImportWorkspace mode="preview" />
}
