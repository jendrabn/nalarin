import type { Metadata } from "next"

import { VocabulariesPage } from "@/features/admin/vocabularies/components/vocabularies-page"
import { getVocabularies } from "@/features/admin/vocabularies/queries"

export const metadata: Metadata = {
  title: "Vocabulary",
  description: "Manage free vocabulary cards, meanings, distractors, and status.",
}

export default async function Page() {
  const vocabularies = await getVocabularies()

  return <VocabulariesPage vocabularies={vocabularies} />
}
