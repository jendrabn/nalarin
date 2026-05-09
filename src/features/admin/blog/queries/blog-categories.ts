"use server"

import "server-only"

import { desc, eq, isNotNull, sql } from "drizzle-orm"

import { db, schema } from "@/db"

export type BlogCategoryRow = {
  id: number
  name: string
  slug: string
  description: string | null
  blogCount: number
  viewCount: number
  createdAt: Date
  updatedAt: Date
}

export type BlogCategoryDetails = {
  id: number
  name: string
  slug: string
  description: string | null
  createdAt: Date
  updatedAt: Date
}

type BlogCategoryStatsRow = {
  categoryId: number | null
  blogCount: number | null
  viewCount: number | null
}

function buildBlogCategoryStatsMap(statsRows: BlogCategoryStatsRow[]) {
  return new Map<number, { blogCount: number; viewCount: number }>(
    statsRows
      .filter((row): row is BlogCategoryStatsRow & { categoryId: number } =>
        row.categoryId !== null,
      )
      .map((row) => [
        row.categoryId,
        {
          blogCount: Number(row.blogCount ?? 0),
          viewCount: Number(row.viewCount ?? 0),
        },
      ]),
  )
}

function mergeBlogCategoryStats(
  categories: Array<{
    id: number
    name: string
    slug: string
    description: string | null
    createdAt: Date
    updatedAt: Date
  }>,
  statsMap: Map<number, { blogCount: number; viewCount: number }>,
) {
  return categories.map<BlogCategoryRow>((category) => {
    const stats = statsMap.get(category.id)

    return {
      ...category,
      blogCount: stats?.blogCount ?? 0,
      viewCount: stats?.viewCount ?? 0,
    }
  })
}

export async function getBlogCategories() {
  const [categories, statsRows] = await Promise.all([
    db
      .select({
        id: schema.blogCategories.id,
        name: schema.blogCategories.name,
        slug: schema.blogCategories.slug,
        description: schema.blogCategories.description,
        createdAt: schema.blogCategories.createdAt,
        updatedAt: schema.blogCategories.updatedAt,
      })
      .from(schema.blogCategories)
      .orderBy(desc(schema.blogCategories.createdAt)),
    db
      .select({
        categoryId: schema.blogPosts.categoryId,
        blogCount: sql<number>`count(${schema.blogPosts.id})`,
        viewCount: sql<number>`coalesce(sum(${schema.blogPosts.viewCount}), 0)`,
      })
      .from(schema.blogPosts)
      .where(isNotNull(schema.blogPosts.categoryId))
      .groupBy(schema.blogPosts.categoryId),
  ])

  return mergeBlogCategoryStats(categories, buildBlogCategoryStatsMap(statsRows))
}

export async function getBlogCategoryById(id: number) {
  const category = await db.query.blogCategories.findFirst({
    where: eq(schema.blogCategories.id, id),
    columns: {
      id: true,
      name: true,
      slug: true,
      description: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return category ?? null
}
