import type { Metadata } from "next"

import { VocabularyFormPage } from "@/features/admin/vocabularies/components/vocabulary-form-page"

export const metadata: Metadata = {
  title: "Create Vocabulary",
  description: "Create a free vocabulary card with meaning and distractors.",
}

export default async function Page() {
  return (
    <VocabularyFormPage
      mode="create"
      title="Create Vocabulary"
      description="Create a vocabulary card for the game and define the correct meaning plus distractors."
      submitLabel="Create Vocabulary"
      backHref="/admin/vocabularies"
    />
  )
}
