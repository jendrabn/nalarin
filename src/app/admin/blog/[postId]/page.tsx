import { redirect } from "next/navigation"

type BlogPostRouteProps = {
  params: Promise<{
    postId: string
  }>
}

export default async function Page({ params }: BlogPostRouteProps) {
  const { postId } = await params
  redirect(`/admin/blog/${postId}/edit`)
}

