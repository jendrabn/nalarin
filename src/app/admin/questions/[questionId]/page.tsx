import { redirect } from "next/navigation"

type QuestionDetailPageProps = {
  params: Promise<{
    questionId: string
  }>
}

export default async function Page({ params }: QuestionDetailPageProps) {
  const { questionId } = await params
  redirect(`/admin/questions/${questionId}/edit`)
}
