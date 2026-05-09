import type { Metadata } from "next"

import { BlogCategoriesPage } from "@/features/admin/blog/components/blog-categories-page"
import { getBlogCategories } from "@/features/admin/blog/queries/blog-categories"

export const metadata: Metadata = {
  title: "Create Blog Category",
  description:
    "Open the create blog category modal from the admin panel and add a new category.",
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
