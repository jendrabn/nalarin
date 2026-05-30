import type { Metadata } from "next"

import { VocabularyImportWorkspace } from "@/features/admin/vocabularies/components/vocabulary-import-workspace"

export const metadata: Metadata = {
  title: "Import Vocabulary",
  description: "Upload an Excel workbook to validate and import vocabulary in bulk.",
}

export default async function Page() {
  return <VocabularyImportWorkspace mode="upload" />
}
