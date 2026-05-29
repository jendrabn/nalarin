import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { QuestionFormPage } from "@/features/admin/questions/components/question-form-page"
import { getAdminQuestionLookups, getQuestionById } from "@/features/admin/questions/queries"

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
      title: "Edit Question",
      description: "Update this question to refine options, scoring, and explanation fields.",
    }
  }

  const question = await getQuestionById(id)

  return {
    title: question ? `Edit ${question.title || `Question ${question.id}`}` : "Edit Question",
    description: "Update this question to refine options, scoring, and explanation fields.",
  }
}

export default async function Page({ params }: EditPageProps) {
  const { questionId } = await params
  const id = Number(questionId)

  if (!Number.isFinite(id)) {
    notFound()
  }

  const [lookups, question] = await Promise.all([
    getAdminQuestionLookups(),
    getQuestionById(id),
  ])

  if (!question) {
    notFound()
  }

  return (
    <QuestionFormPage
      mode="edit"
      questionId={id}
      title={`Edit ${question.title || `Question ${question.id}`}`}
      description="Update this question to refine content, options, and explanations."
      submitLabel="Save changes"
      backHref="/admin/questions"
      lookups={lookups}
      initialValues={question}
    />
  )
}

