import type { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Question Redirect",
  description: "Redirect to the question editor.",
}

type QuestionDetailPageProps = {
  params: Promise<{
    questionId: string
  }>
}

export default async function Page({ params }: QuestionDetailPageProps) {
  const { questionId } = await params
  redirect(`/admin/questions/${questionId}/edit`)
}

