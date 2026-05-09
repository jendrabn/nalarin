import type { Metadata } from "next"

import { BlogPostFormPage } from "@/features/admin/blog/components/blog-post-form-page"
import { getBlogCategories } from "@/features/admin/blog/queries/blog-categories"

export const metadata: Metadata = {
  title: "Create Blog Post",
  description:
    "Create a new blog post with rich text content, SEO metadata, and image upload support.",
}

export default async function Page() {
  const categories = await getBlogCategories()

  return (
    <BlogPostFormPage
      mode="create"
      title="Create Blog Post"
      description="Create a new blog post with Tiptap content, thumbnail upload, and SEO metadata."
      submitLabel="Create post"
      backHref="/admin/blog"
      categories={categories}
    />
  )
}

