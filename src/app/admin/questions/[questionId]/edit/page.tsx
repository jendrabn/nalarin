import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { QuestionFormPage } from "@/features/admin/questions/components/question-form-page"
import { getAdminQuestionLookups, getQuestionById } from "@/features/admin/questions/queries/questions"

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
      description: "Edit a question from the admin panel.",
    }
  }

  const question = await getQuestionById(id)

  return {
    title: question ? `Edit ${question.title || `Question ${question.id}`}` : "Edit Question",
    description:
      question?.content
        ? "Update question metadata, options, and explanation fields."
        : "Edit a question from the admin panel.",
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
      description="Update taxonomy, content, options, and explanation metadata."
      submitLabel="Save changes"
      backHref="/admin/questions"
      lookups={lookups}
      initialValues={question}
    />
  )
}
