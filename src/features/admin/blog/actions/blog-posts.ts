"use server"

import { and, eq, inArray, ne } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"

import { db, schema } from "@/db"
import { requireAdmin } from "@/features/auth/services/session"

import type { BlogPostStatus } from "../constants"
import { blogPostFormSchema, type BlogPostFormValues } from "../schemas"
import {
  estimateReadTimeMinutes,
  parseTagsInput,
} from "../utils/blog-post"
import { slugify } from "../utils/slug"
import { getBlogPostById } from "../queries"

type ActionError = {
  success: false
  message: string
  fieldErrors?: Partial<Record<keyof BlogPostFormValues, string[]>>
}

type ActionSuccess<T = unknown> = {
  success: true
  data: T
}

export type BlogPostActionResult<T = unknown> = ActionError | ActionSuccess<T>

function flattenZodError(error: z.ZodError<BlogPostFormValues>) {
  return error.flatten().fieldErrors as Partial<
    Record<keyof BlogPostFormValues, string[]>
  >
}

function parseBlogPostValues(values: BlogPostFormValues) {
  const validated = blogPostFormSchema.safeParse(values)

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
      title: validated.data.title.trim(),
      categoryId: validated.data.categoryId.trim(),
      excerpt: validated.data.excerpt.trim(),
      content: validated.data.content.trim(),
      thumbnailUrl: validated.data.thumbnailUrl.trim(),
      tagsInput: validated.data.tagsInput.trim(),
      status: validated.data.status as BlogPostStatus,
      seoTitle: validated.data.seoTitle.trim(),
      metaDescription: validated.data.metaDescription.trim(),
    },
  }
}

function normalizeNullableText(value: string) {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function parseOptionalCategoryId(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return null
  }

  const categoryId = Number(trimmed)

  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    return null
  }

  return categoryId
}

async function findUniqueBlogPostSlug(title: string, excludedPostId?: number) {
  const baseSlug = slugify(title)
  let candidate = baseSlug
  let suffix = 2

  while (true) {
    const conflict = await db.query.blogPosts.findFirst({
      where:
        excludedPostId !== undefined
          ? and(
              eq(schema.blogPosts.slug, candidate),
              ne(schema.blogPosts.id, excludedPostId),
            )
          : eq(schema.blogPosts.slug, candidate),
      columns: {
        id: true,
      },
    })

    if (!conflict) {
      return candidate
    }

    candidate = `${baseSlug}-${suffix}`
    suffix += 1
  }
}

function revalidateBlogRoutes(slug?: string, previousSlug?: string) {
  revalidatePath("/admin/blog")
  revalidatePath("/admin/blog-categories")
  revalidatePath("/blog")

  if (slug) {
    revalidatePath(`/blog/${slug}`)
  }

  if (previousSlug && previousSlug !== slug) {
    revalidatePath(`/blog/${previousSlug}`)
  }
}

async function validateCategoryExists(categoryId: number | null) {
  if (!categoryId) {
    return true
  }

  const category = await db.query.blogCategories.findFirst({
    where: eq(schema.blogCategories.id, categoryId),
    columns: {
      id: true,
    },
  })

  return Boolean(category)
}

export async function createBlogPostAction(
  values: BlogPostFormValues,
): Promise<BlogPostActionResult<{ id: number; slug: string }>> {
  const user = await requireAdmin()

  const parsed = parseBlogPostValues(values)

  if (!parsed.success) {
    return parsed
  }

  const categoryId = parseOptionalCategoryId(parsed.data.categoryId)

  if (parsed.data.categoryId && categoryId === null) {
    return {
      success: false,
      message: "Please select a valid category.",
      fieldErrors: {
        categoryId: ["The selected category is invalid."],
      },
    }
  }

  if (!(await validateCategoryExists(categoryId))) {
    return {
      success: false,
      message: "Please select a valid category.",
      fieldErrors: {
        categoryId: ["The selected category is invalid."],
      },
    }
  }

  const slug = await findUniqueBlogPostSlug(parsed.data.title)
  const tags = parseTagsInput(parsed.data.tagsInput)
  const publishedAt =
    parsed.data.status === "published" ? new Date() : null
  const readTimeMinutes = estimateReadTimeMinutes(parsed.data.content)

  try {
    const [created] = await db
      .insert(schema.blogPosts)
      .values({
        categoryId,
        authorId: user.id,
        title: parsed.data.title,
        slug,
        excerpt: normalizeNullableText(parsed.data.excerpt),
        content: parsed.data.content,
        thumbnailUrl: normalizeNullableText(parsed.data.thumbnailUrl),
        tags: tags.length > 0 ? tags : null,
        status: parsed.data.status,
        seoTitle: normalizeNullableText(parsed.data.seoTitle),
        metaDescription: normalizeNullableText(parsed.data.metaDescription),
        readTimeMinutes,
        publishedAt,
      })
      .$returningId()

    revalidateBlogRoutes(slug)

    return {
      success: true,
      data: { id: created.id, slug },
    }
  } catch {
    return {
      success: false,
      message: "Failed to create the blog post.",
    }
  }
}

export async function updateBlogPostAction(
  postId: number,
  values: BlogPostFormValues,
): Promise<BlogPostActionResult<{ id: number; slug: string }>> {
  await requireAdmin()

  const existingPost = await getBlogPostById(postId)

  if (!existingPost) {
    return {
      success: false,
      message: "Blog post not found.",
    }
  }

  const parsed = parseBlogPostValues(values)

  if (!parsed.success) {
    return parsed
  }

  const categoryId = parseOptionalCategoryId(parsed.data.categoryId)

  if (parsed.data.categoryId && categoryId === null) {
    return {
      success: false,
      message: "Please select a valid category.",
      fieldErrors: {
        categoryId: ["The selected category is invalid."],
      },
    }
  }

  if (!(await validateCategoryExists(categoryId))) {
    return {
      success: false,
      message: "Please select a valid category.",
      fieldErrors: {
        categoryId: ["The selected category is invalid."],
      },
    }
  }

  const slug = await findUniqueBlogPostSlug(parsed.data.title, postId)

  const tags = parseTagsInput(parsed.data.tagsInput)
  const readTimeMinutes = estimateReadTimeMinutes(parsed.data.content)
  const publishedAt =
    parsed.data.status === "published"
      ? existingPost.publishedAt ?? new Date()
      : existingPost.publishedAt

  try {
    await db
      .update(schema.blogPosts)
      .set({
        categoryId,
        title: parsed.data.title,
        slug,
        excerpt: normalizeNullableText(parsed.data.excerpt),
        content: parsed.data.content,
        thumbnailUrl: normalizeNullableText(parsed.data.thumbnailUrl),
        tags: tags.length > 0 ? tags : null,
        status: parsed.data.status,
        seoTitle: normalizeNullableText(parsed.data.seoTitle),
        metaDescription: normalizeNullableText(parsed.data.metaDescription),
        readTimeMinutes,
        publishedAt,
      })
      .where(eq(schema.blogPosts.id, postId))

    revalidateBlogRoutes(slug, existingPost.slug)

    return {
      success: true,
      data: { id: postId, slug },
    }
  } catch {
    return {
      success: false,
      message: "Failed to update the blog post.",
    }
  }
}

export async function deleteBlogPostAction(
  postId: number,
): Promise<BlogPostActionResult<{ id: number }>> {
  await requireAdmin()

  const existingPost = await getBlogPostById(postId)

  if (!existingPost) {
    return {
      success: false,
      message: "Blog post not found.",
    }
  }

  await db.delete(schema.blogPosts).where(eq(schema.blogPosts.id, postId))

  revalidateBlogRoutes(undefined, existingPost.slug)

  return {
    success: true,
    data: { id: postId },
  }
}

export async function deleteBlogPostsAction(
  postIds: number[],
): Promise<BlogPostActionResult<{ deletedCount: number }>> {
  await requireAdmin()

  const uniquePostIds = [...new Set(postIds)].filter((id) => Number.isInteger(id) && id > 0)

  if (uniquePostIds.length === 0) {
    return {
      success: false,
      message: "No blog posts were selected.",
    }
  }

  const existingPosts = await db
    .select({
      id: schema.blogPosts.id,
      slug: schema.blogPosts.slug,
    })
    .from(schema.blogPosts)
    .where(inArray(schema.blogPosts.id, uniquePostIds))

  if (existingPosts.length !== uniquePostIds.length) {
    return {
      success: false,
      message: "Some selected blog posts were not found.",
    }
  }

  await db
    .delete(schema.blogPosts)
    .where(inArray(schema.blogPosts.id, uniquePostIds))

  revalidateBlogRoutes()
  existingPosts.forEach((post) => {
    revalidateBlogRoutes(undefined, post.slug)
  })

  return {
    success: true,
    data: { deletedCount: uniquePostIds.length },
  }
}
