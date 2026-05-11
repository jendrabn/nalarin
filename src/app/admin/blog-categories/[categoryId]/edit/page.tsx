import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { BlogCategoriesPage } from "@/features/admin/blog/components/blog-categories-page"
import {
  getBlogCategories,
  getBlogCategoryById,
} from "@/features/admin/blog/queries/blog-categories"

type EditPageProps = {
  params: Promise<{
    categoryId: string
  }>
}

export async function generateMetadata({
  params,
}: EditPageProps): Promise<Metadata> {
  const { categoryId } = await params
  const id = Number(categoryId)

  if (!Number.isFinite(id)) {
    return {
      title: "Edit Blog Category",
      description: "Edit a blog category from the admin panel.",
    }
  }

  const category = await getBlogCategoryById(id)

  return {
    title: category ? `Edit ${category.name}` : "Edit Blog Category",
    description:
      category?.description ?? "Edit a blog category from the admin panel.",
  }
}

export default async function Page({ params }: EditPageProps) {
  const { categoryId } = await params
  const id = Number(categoryId)

  if (!Number.isFinite(id)) {
    notFound()
  }

  const [categories, category] = await Promise.all([
    getBlogCategories(),
    getBlogCategoryById(id),
  ])

  if (!category) {
    notFound()
  }

  return (
    <BlogCategoriesPage
      categories={categories}
      defaultEditCategory={category}
      closeDestination="/admin/blog-categories"
    />
  )
}
