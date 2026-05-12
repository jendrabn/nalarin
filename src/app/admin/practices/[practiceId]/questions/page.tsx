import { redirect } from "next/navigation"

type PracticeQuestionsPageProps = {
  params: Promise<{
    practiceId: string
  }>
}

export default async function Page({ params }: PracticeQuestionsPageProps) {
  const { practiceId } = await params

  redirect(`/admin/practices/${practiceId}/edit`)
}
