import type { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Practice Questions Redirect",
  description: "Redirect to the practice editor.",
}

type PracticeQuestionsPageProps = {
  params: Promise<{
    practiceId: string
  }>
}

export default async function Page({ params }: PracticeQuestionsPageProps) {
  const { practiceId } = await params

  redirect(`/admin/practices/${practiceId}/edit`)
}

