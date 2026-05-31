import { redirect } from "next/navigation"

type DetailPageProps = {
  params: Promise<{
    questionId: string
  }>
}

export default async function Page({ params }: DetailPageProps) {
  const { questionId } = await params
  redirect(`/admin/grammar/${questionId}`)
}
