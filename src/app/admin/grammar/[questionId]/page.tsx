import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { GrammarQuestionDetailPage } from "@/features/admin/grammar-questions/components/grammar-question-detail-page"
import { getGrammarQuestionById } from "@/features/admin/grammar-questions/queries"

type DetailPageProps = {
  params: Promise<{
    questionId: string
  }>
}

export async function generateMetadata({
  params,
}: DetailPageProps): Promise<Metadata> {
  const { questionId } = await params
  const id = Number(questionId)

  if (!Number.isFinite(id)) {
    return {
      title: "Grammar",
      description: "Inspect a grammar fill-in-the-blank question.",
    }
  }

  const question = await getGrammarQuestionById(id)

  return {
    title: question ? `Grammar #${question.id}` : "Grammar",
    description: "Inspect a grammar fill-in-the-blank question.",
  }
}

export default async function Page({ params }: DetailPageProps) {
  const { questionId } = await params
  const id = Number(questionId)

  if (!Number.isFinite(id)) {
    notFound()
  }

  const question = await getGrammarQuestionById(id)

  if (!question) {
    notFound()
  }

  return <GrammarQuestionDetailPage question={question} />
}
