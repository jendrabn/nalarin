import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { VocabularyFormPage } from "@/features/admin/vocabularies/components/vocabulary-form-page"
import { getVocabularyById } from "@/features/admin/vocabularies/queries"

type EditVocabularyPageProps = {
  params: Promise<{
    vocabularyId: string
  }>
}

export async function generateMetadata({
  params,
}: EditVocabularyPageProps): Promise<Metadata> {
  const { vocabularyId } = await params
  const id = Number(vocabularyId)

  if (!Number.isFinite(id)) {
    return {
      title: "Edit Vocabulary",
      description: "Update a vocabulary card.",
    }
  }

  const vocabulary = await getVocabularyById(id)

  return {
    title: vocabulary ? `Edit ${vocabulary.word}` : "Edit Vocabulary",
    description: "Update a vocabulary card.",
  }
}

export default async function Page({ params }: EditVocabularyPageProps) {
  const { vocabularyId } = await params
  const id = Number(vocabularyId)

  if (!Number.isFinite(id)) {
    notFound()
  }

  const vocabulary = await getVocabularyById(id)

  if (!vocabulary) {
    notFound()
  }

  return (
    <VocabularyFormPage
      mode="edit"
      vocabularyId={id}
      title={`Edit ${vocabulary.word}`}
      description="Update the vocabulary card, meaning, distractors, and status."
      submitLabel="Save changes"
      backHref={`/admin/vocabularies/${id}`}
      initialValues={vocabulary}
    />
  )
}
