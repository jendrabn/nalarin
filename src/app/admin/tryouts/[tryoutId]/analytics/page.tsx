import { redirect } from "next/navigation"

type TryoutAnalyticsPageProps = {
  params: Promise<{
    tryoutId: string
  }>
}

export default async function Page({ params }: TryoutAnalyticsPageProps) {
  const { tryoutId } = await params

  redirect(`/admin/tryouts/${tryoutId}/results`)
}
