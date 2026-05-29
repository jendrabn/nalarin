import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { BlogPostFormPage } from "@/features/admin/blog/components/blog-post-form-page"
import { getBlogCategories, getBlogPostById } from "@/features/admin/blog/queries"

type EditPageProps = {
  params: Promise<{
    postId: string
  }>
}

export async function generateMetadata({
  params,
}: EditPageProps): Promise<Metadata> {
  const { postId } = await params
  const id = Number(postId)

  if (!Number.isFinite(id)) {
    return {
      title: "Edit Blog Post",
      description: "Update this blog post to refine content, publication state, and SEO metadata.",
    }
  }

  const post = await getBlogPostById(id)

  return {
    title: post ? `Edit ${post.title}` : "Edit Blog Post",
    description: "Update this blog post to refine content, publication state, and SEO metadata.",
  }
}

export default async function Page({ params }: EditPageProps) {
  const { postId } = await params
  const id = Number(postId)

  if (!Number.isFinite(id)) {
    notFound()
  }

  const [categories, post] = await Promise.all([
    getBlogCategories(),
    getBlogPostById(id),
  ])

  if (!post) {
    notFound()
  }

  return (
    <BlogPostFormPage
      mode="edit"
      postId={id}
      title={`Edit ${post.title}`}
      description="Update this blog post to refine content, publication state, and SEO metadata."
      submitLabel="Save changes"
      backHref="/admin/blog"
      categories={categories}
      initialValues={post}
    />
  )
}

