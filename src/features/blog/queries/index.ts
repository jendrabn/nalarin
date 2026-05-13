import "server-only";

import { cache } from "react";
import {
  and,
  count,
  desc,
  eq,
  isNotNull,
  like,
  lte,
  ne,
  notInArray,
  or,
  sql,
} from "drizzle-orm";

import { db, schema } from "@/db";

import { BLOG_PAGE_SIZE } from "../utils";

export type PublishedBlogPostSummary = {
  id: number;
  categoryId: number | null;
  categoryName: string | null;
  title: string;
  slug: string;
  excerpt: string | null;
  thumbnailUrl: string | null;
  thumbnailCaption: string | null;
  tags: string[] | null;
  authorName: string | null;
  readTimeMinutes: number | null;
  publishedAt: Date | null;
  updatedAt: Date;
};

export type PublishedBlogPostDetails = PublishedBlogPostSummary & {
  authorId: number | null;
  content: string;
  seoTitle: string | null;
  metaDescription: string | null;
};

export type PublishedBlogCategory = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  postCount: number;
};

export type BlogListingResult = {
  posts: PublishedBlogPostSummary[];
  categories: PublishedBlogCategory[];
  totalPosts: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
};

export type BlogSitemapEntry = {
  slug: string;
  updatedAt: Date;
  thumbnailUrl: string | null;
};

type SummaryRow = {
  id: number;
  categoryId: number | null;
  categoryName: string | null;
  title: string;
  slug: string;
  excerpt: string | null;
  thumbnailUrl: string | null;
  thumbnailCaption: string | null;
  tags: string[] | null;
  authorName: string | null;
  readTimeMinutes: number | null;
  publishedAt: Date | null;
  updatedAt: Date;
};

const now = () => new Date();

function publishedPostCondition() {
  return and(
    eq(schema.blogPosts.status, "published"),
    isNotNull(schema.blogPosts.publishedAt),
    lte(schema.blogPosts.publishedAt, now()),
  );
}

function searchCondition(query: string) {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return undefined;
  }

  const pattern = `%${normalizedQuery}%`;

  return or(
    like(schema.blogPosts.title, pattern),
    like(schema.blogPosts.excerpt, pattern),
    like(schema.blogCategories.name, pattern),
    like(schema.users.name, pattern),
  );
}

function categoryCondition(categorySlug: string) {
  const normalizedCategorySlug = categorySlug.trim();

  if (!normalizedCategorySlug) {
    return undefined;
  }

  return eq(schema.blogCategories.slug, normalizedCategorySlug);
}

function blogListWhere(query: string, categorySlug: string) {
  return and(
    publishedPostCondition(),
    searchCondition(query),
    categoryCondition(categorySlug),
  );
}

function selectSummaryColumns() {
  return {
    id: schema.blogPosts.id,
    categoryId: schema.blogPosts.categoryId,
    categoryName: schema.blogCategories.name,
    title: schema.blogPosts.title,
    slug: schema.blogPosts.slug,
    excerpt: schema.blogPosts.excerpt,
    thumbnailUrl: schema.blogPosts.thumbnailUrl,
    thumbnailCaption: schema.blogPosts.thumbnailCaption,
    tags: schema.blogPosts.tags,
    authorName: schema.users.name,
    readTimeMinutes: schema.blogPosts.readTimeMinutes,
    publishedAt: schema.blogPosts.publishedAt,
    updatedAt: schema.blogPosts.updatedAt,
  } as const;
}

function mapSummary(row: SummaryRow): PublishedBlogPostSummary {
  return {
    id: row.id,
    categoryId: row.categoryId ?? null,
    categoryName: row.categoryName ?? null,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt ?? null,
    thumbnailUrl: row.thumbnailUrl ?? null,
    thumbnailCaption: row.thumbnailCaption ?? null,
    tags: row.tags ?? null,
    authorName: row.authorName ?? null,
    readTimeMinutes: row.readTimeMinutes ?? null,
    publishedAt: row.publishedAt ?? null,
    updatedAt: row.updatedAt,
  };
}

export async function getPublishedBlogListing({
  page,
  query,
  categorySlug = "",
}: {
  page: number;
  query: string;
  categorySlug?: string;
}): Promise<BlogListingResult> {
  const safePage = Math.max(page, 1);
  const offset = (safePage - 1) * BLOG_PAGE_SIZE;
  const where = blogListWhere(query, categorySlug);

  const [posts, totalRows, categories] = await Promise.all([
    db
      .select(selectSummaryColumns())
      .from(schema.blogPosts)
      .leftJoin(schema.blogCategories, eq(schema.blogPosts.categoryId, schema.blogCategories.id))
      .leftJoin(schema.users, eq(schema.blogPosts.authorId, schema.users.id))
      .where(where)
      .orderBy(desc(schema.blogPosts.publishedAt), desc(schema.blogPosts.createdAt))
      .limit(BLOG_PAGE_SIZE)
      .offset(offset),
    db
      .select({ total: count(schema.blogPosts.id) })
      .from(schema.blogPosts)
      .leftJoin(schema.blogCategories, eq(schema.blogPosts.categoryId, schema.blogCategories.id))
      .leftJoin(schema.users, eq(schema.blogPosts.authorId, schema.users.id))
      .where(where),
    getPublishedBlogCategories(),
  ]);

  const totalPosts = Number(totalRows[0]?.total ?? 0);

  return {
    posts: posts.map(mapSummary),
    categories,
    totalPosts,
    totalPages: Math.max(Math.ceil(totalPosts / BLOG_PAGE_SIZE), 1),
    currentPage: safePage,
    pageSize: BLOG_PAGE_SIZE,
  };
}

export const getPublishedBlogCategories = cache(async () => {
  const postCount = sql<number>`count(${schema.blogPosts.id})`;
  const rows = await db
    .select({
      id: schema.blogCategories.id,
      name: schema.blogCategories.name,
      slug: schema.blogCategories.slug,
      description: schema.blogCategories.description,
      postCount,
    })
    .from(schema.blogCategories)
    .innerJoin(schema.blogPosts, eq(schema.blogPosts.categoryId, schema.blogCategories.id))
    .where(publishedPostCondition())
    .groupBy(
      schema.blogCategories.id,
      schema.blogCategories.name,
      schema.blogCategories.slug,
      schema.blogCategories.description,
    )
    .orderBy(desc(postCount), schema.blogCategories.name);

  return rows.map<PublishedBlogCategory>((row) => ({
    ...row,
    description: row.description ?? null,
    postCount: Number(row.postCount ?? 0),
  }));
});

export const getPublishedBlogPostBySlug = cache(async (slug: string) => {
  const [post] = await db
    .select({
      ...selectSummaryColumns(),
      authorId: schema.blogPosts.authorId,
      content: schema.blogPosts.content,
      seoTitle: schema.blogPosts.seoTitle,
      metaDescription: schema.blogPosts.metaDescription,
    })
    .from(schema.blogPosts)
    .leftJoin(schema.blogCategories, eq(schema.blogPosts.categoryId, schema.blogCategories.id))
    .leftJoin(schema.users, eq(schema.blogPosts.authorId, schema.users.id))
    .where(and(publishedPostCondition(), eq(schema.blogPosts.slug, slug)))
    .limit(1);

  if (!post) {
    return null;
  }

  return {
    ...mapSummary(post),
    authorId: post.authorId ?? null,
    content: post.content,
    seoTitle: post.seoTitle ?? null,
    metaDescription: post.metaDescription ?? null,
  } satisfies PublishedBlogPostDetails;
});

export async function getRelatedBlogPosts(post: PublishedBlogPostDetails) {
  const relatedPosts = post.categoryId
    ? await db
        .select(selectSummaryColumns())
        .from(schema.blogPosts)
        .leftJoin(schema.blogCategories, eq(schema.blogPosts.categoryId, schema.blogCategories.id))
        .leftJoin(schema.users, eq(schema.blogPosts.authorId, schema.users.id))
        .where(
          and(
            publishedPostCondition(),
            eq(schema.blogPosts.categoryId, post.categoryId),
            ne(schema.blogPosts.id, post.id),
          ),
        )
        .orderBy(desc(schema.blogPosts.publishedAt), desc(schema.blogPosts.createdAt))
        .limit(3)
    : [];

  if (relatedPosts.length >= 3) {
    return relatedPosts.map(mapSummary);
  }

  const excludedIds = [post.id, ...relatedPosts.map((item) => item.id)];
  const latestPosts = await db
    .select(selectSummaryColumns())
    .from(schema.blogPosts)
    .leftJoin(schema.blogCategories, eq(schema.blogPosts.categoryId, schema.blogCategories.id))
    .leftJoin(schema.users, eq(schema.blogPosts.authorId, schema.users.id))
    .where(
      and(
        publishedPostCondition(),
        excludedIds.length ? notInArray(schema.blogPosts.id, excludedIds) : undefined,
      ),
    )
    .orderBy(desc(schema.blogPosts.publishedAt), desc(schema.blogPosts.createdAt))
    .limit(3 - relatedPosts.length);

  return [...relatedPosts, ...latestPosts].map(mapSummary);
}

export async function getPublishedBlogSitemapEntries() {
  const rows = await db
    .select({
      slug: schema.blogPosts.slug,
      updatedAt: schema.blogPosts.updatedAt,
      thumbnailUrl: schema.blogPosts.thumbnailUrl,
    })
    .from(schema.blogPosts)
    .where(publishedPostCondition())
    .orderBy(desc(schema.blogPosts.publishedAt));

  return rows.map<BlogSitemapEntry>((row) => ({
    slug: row.slug,
    updatedAt: row.updatedAt,
    thumbnailUrl: row.thumbnailUrl ?? null,
  }));
}
