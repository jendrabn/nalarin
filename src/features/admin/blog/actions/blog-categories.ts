"use server"

import { revalidatePath, updateTag } from "next/cache"
import { eq, inArray } from "drizzle-orm"
import { z } from "zod"

import { db, schema } from "@/db"
import { requireAdmin } from "@/features/auth/services/session"
import { CACHE_TAGS } from "@/lib/cache-tags"

import { blogCategoryFormSchema, type BlogCategoryFormValues } from "../schemas"
import { getBlogCategoryById } from "../queries"
import { slugify } from "../utils/slug"

type ActionError = {
  success: false
  message: string
  fieldErrors?: Partial<Record<keyof BlogCategoryFormValues, string[]>>
}

type ActionSuccess<T = unknown> = {
  success: true
  data: T
}

export type BlogCategoryActionResult<T = unknown> = ActionError | ActionSuccess<T>

function flattenZodError(error: z.ZodError<BlogCategoryFormValues>) {
  return error.flatten().fieldErrors as Partial<
    Record<keyof BlogCategoryFormValues, string[]>
  >
}

function parseBlogCategoryValues(values: BlogCategoryFormValues) {
  const validated = blogCategoryFormSchema.safeParse(values)

  if (!validated.success) {
    return {
      success: false as const,
      message: "Please fix the highlighted fields.",
      fieldErrors: flattenZodError(validated.error),
    }
  }

  return {
    success: true as const,
    data: {
      name: validated.data.name.trim(),
      description: validated.data.description.trim(),
    },
  }
}

function isDuplicateEntryError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "ER_DUP_ENTRY"
  )
}

function revalidateBlogCategoryRoutes(categoryId?: number) {
  updateTag(CACHE_TAGS.blog)
  updateTag(CACHE_TAGS.sitemap)

  revalidatePath("/admin/blog-categories")

  if (categoryId) {
    revalidatePath(`/admin/blog-categories/${categoryId}/edit`)
  }
}

async function findSlugConflict(slug: string, excludedCategoryId?: number) {
  const conflict = await db.query.blogCategories.findFirst({
    where: eq(schema.blogCategories.slug, slug),
    columns: {
      id: true,
    },
  })

  if (!conflict) {
    return null
  }

  if (excludedCategoryId !== undefined && conflict.id === excludedCategoryId) {
    return null
  }

  return conflict
}

function buildSlugConflictResult() {
  return {
    success: false as const,
    message: "A category with the same slug already exists.",
    fieldErrors: {
      name: ["This name generates a slug that is already in use."],
    },
  }
}

export async function createBlogCategoryAction(
  values: BlogCategoryFormValues,
): Promise<BlogCategoryActionResult<{ id: number }>> {
  await requireAdmin()

  const parsed = parseBlogCategoryValues(values)

  if (!parsed.success) {
    return parsed
  }

  const slug = slugify(parsed.data.name)
  const slugConflict = await findSlugConflict(slug)

  if (slugConflict) {
    return buildSlugConflictResult()
  }

  try {
    const [created] = await db
      .insert(schema.blogCategories)
      .values({
        name: parsed.data.name,
        slug,
        description: parsed.data.description,
      })
      .$returningId()

    revalidateBlogCategoryRoutes()

    return {
      success: true,
      data: { id: created.id },
    }
  } catch (error) {
    return {
      success: false,
      message:
        isDuplicateEntryError(error)
          ? "A category with the same slug already exists. Please try again."
          : "Failed to create the blog category.",
    }
  }
}

export async function updateBlogCategoryAction(
  categoryId: number,
  values: BlogCategoryFormValues,
): Promise<BlogCategoryActionResult<{ id: number }>> {
  await requireAdmin()

  const parsed = parseBlogCategoryValues(values)

  if (!parsed.success) {
    return parsed
  }

  const existingCategory = await getBlogCategoryById(categoryId)

  if (!existingCategory) {
    return {
      success: false,
      message: "Blog category not found.",
    }
  }

  const slug = slugify(parsed.data.name)
  const slugConflict = await findSlugConflict(slug, categoryId)

  if (slugConflict) {
    return buildSlugConflictResult()
  }

  try {
    await db
      .update(schema.blogCategories)
      .set({
        name: parsed.data.name,
        slug,
        description: parsed.data.description,
      })
      .where(eq(schema.blogCategories.id, categoryId))

    revalidateBlogCategoryRoutes(categoryId)

    return {
      success: true,
      data: { id: categoryId },
    }
  } catch (error) {
    return {
      success: false,
      message:
        isDuplicateEntryError(error)
          ? "A category with the same slug already exists. Please try again."
          : "Failed to update the blog category.",
    }
  }
}

export async function deleteBlogCategoryAction(
  categoryId: number,
): Promise<BlogCategoryActionResult<{ id: number }>> {
  await requireAdmin()

  const category = await getBlogCategoryById(categoryId)

  if (!category) {
    return {
      success: false,
      message: "Blog category not found.",
    }
  }

  const relatedPosts = await db
    .select({
      id: schema.blogPosts.id,
    })
    .from(schema.blogPosts)
    .where(eq(schema.blogPosts.categoryId, categoryId))
    .limit(1)

  if (relatedPosts.length > 0) {
    return {
      success: false,
      message: "This category cannot be deleted because it still has blog posts.",
    }
  }

  await db
    .delete(schema.blogCategories)
    .where(eq(schema.blogCategories.id, categoryId))

  revalidateBlogCategoryRoutes()

  return {
    success: true,
    data: { id: categoryId },
  }
}

export async function deleteBlogCategoriesAction(
  categoryIds: number[],
): Promise<BlogCategoryActionResult<{ deletedCount: number }>> {
  await requireAdmin()

  const uniqueCategoryIds = [...new Set(categoryIds)].filter(
    (id) => Number.isInteger(id) && id > 0,
  )

  if (uniqueCategoryIds.length === 0) {
    return {
      success: false,
      message: "No blog categories were selected.",
    }
  }

  const [existingCategories, relatedPosts] = await Promise.all([
    db
      .select({
        id: schema.blogCategories.id,
      })
      .from(schema.blogCategories)
      .where(inArray(schema.blogCategories.id, uniqueCategoryIds)),
    db
      .select({
        categoryId: schema.blogPosts.categoryId,
      })
      .from(schema.blogPosts)
      .where(inArray(schema.blogPosts.categoryId, uniqueCategoryIds))
      .groupBy(schema.blogPosts.categoryId),
  ])

  if (existingCategories.length !== uniqueCategoryIds.length) {
    return {
      success: false,
      message: "Some selected blog categories were not found.",
    }
  }

  if (relatedPosts.length > 0) {
    return {
      success: false,
      message: "One or more selected categories cannot be deleted because they still have blog posts.",
    }
  }

  await db
    .delete(schema.blogCategories)
    .where(inArray(schema.blogCategories.id, uniqueCategoryIds))

  revalidateBlogCategoryRoutes()
  uniqueCategoryIds.forEach((categoryId) => {
    revalidateBlogCategoryRoutes(categoryId)
  })

  return {
    success: true,
    data: { deletedCount: uniqueCategoryIds.length },
  }
}
