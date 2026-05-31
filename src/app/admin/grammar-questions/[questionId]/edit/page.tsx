import { redirect } from "next/navigation"

type EditPageProps = {
  params: Promise<{
    questionId: string
  }>
}

export default async function Page({ params }: EditPageProps) {
  const { questionId } = await params
  redirect(`/admin/grammar/${questionId}/edit`)
}
