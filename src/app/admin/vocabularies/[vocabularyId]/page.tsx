import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { VocabularyDetailPage } from "@/features/admin/vocabularies/components/vocabulary-detail-page"
import { getVocabularyById } from "@/features/admin/vocabularies/queries"

type VocabularyDetailPageProps = {
  params: Promise<{
    vocabularyId: string
  }>
}

export async function generateMetadata({
  params,
}: VocabularyDetailPageProps): Promise<Metadata> {
  const { vocabularyId } = await params
  const id = Number(vocabularyId)

  if (!Number.isFinite(id)) {
    return {
      title: "Vocabulary Detail",
      description: "View a vocabulary card.",
    }
  }

  const vocabulary = await getVocabularyById(id)

  return {
    title: vocabulary ? vocabulary.word : "Vocabulary Detail",
    description: "View a vocabulary card.",
  }
}

export default async function Page({ params }: VocabularyDetailPageProps) {
  const { vocabularyId } = await params
  const id = Number(vocabularyId)

  if (!Number.isFinite(id)) {
    notFound()
  }

  const vocabulary = await getVocabularyById(id)

  if (!vocabulary) {
    notFound()
  }

  return <VocabularyDetailPage vocabulary={vocabulary} />
}
