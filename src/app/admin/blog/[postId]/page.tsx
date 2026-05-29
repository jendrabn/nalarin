import type { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Blog Post Redirect",
  description: "Redirect to the blog post editor.",
}

type BlogPostRouteProps = {
  params: Promise<{
    postId: string
  }>
}

export default async function Page({ params }: BlogPostRouteProps) {
  const { postId } = await params
  redirect(`/admin/blog/${postId}/edit`)
}

