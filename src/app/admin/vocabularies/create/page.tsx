import type { Metadata } from "next"

import { VocabularyFormPage } from "@/features/admin/vocabularies/components/vocabulary-form-page"

export const metadata: Metadata = {
  title: "Create Vocabulary",
  description: "Create a free vocabulary card with one correct option and one wrong option.",
}

export default async function Page() {
  return (
    <VocabularyFormPage
      mode="create"
      title="Create Vocabulary"
      description="Create a vocabulary card for the game and define one correct option plus one wrong option."
      submitLabel="Create Vocabulary"
      backHref="/admin/vocabularies"
    />
  )
}
