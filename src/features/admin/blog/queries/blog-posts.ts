"use server"

import "server-only"

import { desc, eq } from "drizzle-orm"

import { db, schema } from "@/db"

import type { BlogPostStatus } from "../constants"

export type BlogPostRow = {
  id: number
  categoryId: number | null
  categoryName: string | null
  title: string
  slug: string
  excerpt: string | null
  thumbnailUrl: string | null
  tags: string[] | null
  status: BlogPostStatus
  seoTitle: string | null
  metaDescription: string | null
  readTimeMinutes: number | null
  viewCount: number
  publishedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export type BlogPostDetails = BlogPostRow & {
  authorId: number | null
  content: string
}

function selectBlogPostColumns() {
  return {
    id: schema.blogPosts.id,
    categoryId: schema.blogPosts.categoryId,
    categoryName: schema.blogCategories.name,
    title: schema.blogPosts.title,
    slug: schema.blogPosts.slug,
    excerpt: schema.blogPosts.excerpt,
    thumbnailUrl: schema.blogPosts.thumbnailUrl,
    tags: schema.blogPosts.tags,
    status: schema.blogPosts.status,
    seoTitle: schema.blogPosts.seoTitle,
    metaDescription: schema.blogPosts.metaDescription,
    readTimeMinutes: schema.blogPosts.readTimeMinutes,
    viewCount: schema.blogPosts.viewCount,
    publishedAt: schema.blogPosts.publishedAt,
    createdAt: schema.blogPosts.createdAt,
    updatedAt: schema.blogPosts.updatedAt,
  } as const
}

export async function getBlogPosts() {
  const rows = await db
    .select(selectBlogPostColumns())
    .from(schema.blogPosts)
    .leftJoin(schema.blogCategories, eq(schema.blogPosts.categoryId, schema.blogCategories.id))
    .orderBy(desc(schema.blogPosts.createdAt))

  return rows.map<BlogPostRow>((row) => ({
    ...row,
    categoryName: row.categoryName ?? null,
    excerpt: row.excerpt ?? null,
    thumbnailUrl: row.thumbnailUrl ?? null,
    tags: row.tags ?? null,
    seoTitle: row.seoTitle ?? null,
    metaDescription: row.metaDescription ?? null,
    readTimeMinutes: row.readTimeMinutes ?? null,
    publishedAt: row.publishedAt ?? null,
  }))
}

export async function getBlogPostById(id: number) {
  const row = await db
    .select({
      ...selectBlogPostColumns(),
      authorId: schema.blogPosts.authorId,
      content: schema.blogPosts.content,
    })
    .from(schema.blogPosts)
    .leftJoin(schema.blogCategories, eq(schema.blogPosts.categoryId, schema.blogCategories.id))
    .where(eq(schema.blogPosts.id, id))
    .limit(1)

  const post = row[0]

  if (!post) {
    return null
  }

  return {
    ...post,
    categoryName: post.categoryName ?? null,
    excerpt: post.excerpt ?? null,
    thumbnailUrl: post.thumbnailUrl ?? null,
    tags: post.tags ?? null,
    seoTitle: post.seoTitle ?? null,
    metaDescription: post.metaDescription ?? null,
    readTimeMinutes: post.readTimeMinutes ?? null,
    publishedAt: post.publishedAt ?? null,
  } satisfies BlogPostDetails
}

export async function getBlogPostBySlug(slug: string) {
  const row = await db
    .select({
      ...selectBlogPostColumns(),
      authorId: schema.blogPosts.authorId,
      content: schema.blogPosts.content,
    })
    .from(schema.blogPosts)
    .leftJoin(schema.blogCategories, eq(schema.blogPosts.categoryId, schema.blogCategories.id))
    .where(eq(schema.blogPosts.slug, slug))
    .limit(1)

  const post = row[0]

  if (!post) {
    return null
  }

  return {
    ...post,
    categoryName: post.categoryName ?? null,
    excerpt: post.excerpt ?? null,
    thumbnailUrl: post.thumbnailUrl ?? null,
    tags: post.tags ?? null,
    seoTitle: post.seoTitle ?? null,
    metaDescription: post.metaDescription ?? null,
    readTimeMinutes: post.readTimeMinutes ?? null,
    publishedAt: post.publishedAt ?? null,
  } satisfies BlogPostDetails
}

