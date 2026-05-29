import type { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Tryout Analytics Redirect",
  description: "Redirect to tryout results and analytics.",
}

type TryoutAnalyticsPageProps = {
  params: Promise<{
    tryoutId: string
  }>
}

export default async function Page({ params }: TryoutAnalyticsPageProps) {
  const { tryoutId } = await params

  redirect(`/admin/tryouts/${tryoutId}/results`)
}

