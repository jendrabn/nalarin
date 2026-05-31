import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { GrammarQuestionFormPage } from "@/features/admin/grammar-questions/components/grammar-question-form-page"
import { getGrammarQuestionById } from "@/features/admin/grammar-questions/queries"

type EditPageProps = {
  params: Promise<{
    questionId: string
  }>
}

export async function generateMetadata({
  params,
}: EditPageProps): Promise<Metadata> {
  const { questionId } = await params
  const id = Number(questionId)

  if (!Number.isFinite(id)) {
    return {
      title: "Edit Grammar",
      description: "Update a grammar fill-in-the-blank question.",
    }
  }

  const question = await getGrammarQuestionById(id)

  return {
    title: question ? `Edit Grammar #${question.id}` : "Edit Grammar",
    description: "Update a grammar fill-in-the-blank question.",
  }
}

export default async function Page({ params }: EditPageProps) {
  const { questionId } = await params
  const id = Number(questionId)

  if (!Number.isFinite(id)) {
    notFound()
  }

  const question = await getGrammarQuestionById(id)

  if (!question) {
    notFound()
  }

  return (
    <GrammarQuestionFormPage
      mode="edit"
      questionId={id}
      title={`Edit Grammar #${question.id}`}
      description="Update the sentence template, answers, distractors, and status."
      submitLabel="Save Changes"
      backHref="/admin/grammar"
      initialValues={question}
    />
  )
}
