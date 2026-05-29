import type { Metadata } from "next"

import { BlogCategoriesPage } from "@/features/admin/blog/components/blog-categories-page"
import { getBlogCategories } from "@/features/admin/blog/queries/blog-categories"

export const metadata: Metadata = {
  title: "Blog Categories",
  description: "Manage blog categories.",
}

export default async function Page() {
  const categories = await getBlogCategories()

  return <BlogCategoriesPage categories={categories} />
}

