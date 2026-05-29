import type { Metadata } from "next"

import { BlogPostFormPage } from "@/features/admin/blog/components/blog-post-form-page"
import { getBlogCategories } from "@/features/admin/blog/queries"

export const metadata: Metadata = {
  title: "Create Blog Post",
  description: "Create a blog post from the admin panel.",
}

export default async function Page() {
  const categories = await getBlogCategories()

  return (
    <BlogPostFormPage
      mode="create"
      title="Create Blog Post"
      description="Create a blog post to prepare content, imagery, and SEO metadata."
      submitLabel="Create post"
      backHref="/admin/blog"
      categories={categories}
    />
  )
}
