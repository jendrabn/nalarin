import type { Metadata } from "next"

import { BlogCategoriesPage } from "@/features/admin/blog/components/blog-categories-page"
import { getBlogCategories } from "@/features/admin/blog/queries/blog-categories"

export const metadata: Metadata = {
  title: "Create Blog Category",
  description: "Create a blog category from the admin panel.",
}

export default async function Page() {
  const categories = await getBlogCategories()

  return (
    <BlogCategoriesPage
      categories={categories}
      defaultCreateOpen
      closeDestination="/admin/blog-categories"
    />
  )
}
