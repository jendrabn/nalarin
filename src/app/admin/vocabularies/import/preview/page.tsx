import type { Metadata } from "next"

import { VocabularyImportWorkspace } from "@/features/admin/vocabularies/components/vocabulary-import-workspace"

export const metadata: Metadata = {
  title: "Vocabulary Import Preview",
  description: "Review parsed vocabulary rows and import the valid entries.",
}

export default async function Page() {
  return <VocabularyImportWorkspace mode="preview" />
}
