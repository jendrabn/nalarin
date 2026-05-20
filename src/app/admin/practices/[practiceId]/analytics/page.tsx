import { redirect } from "next/navigation"

type PracticeAnalyticsPageProps = {
  params: Promise<{
    practiceId: string
  }>
}

export default async function Page({ params }: PracticeAnalyticsPageProps) {
  const { practiceId } = await params

  redirect(`/admin/practices/${practiceId}/results`)
}
