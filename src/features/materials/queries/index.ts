import "server-only"

import { and, asc, desc, eq, isNotNull, lte, notInArray, sql } from "drizzle-orm"

import { db, schema } from "@/db"

import { extractYouTubeVideoId } from "../utils/youtube"

export type PublicMaterialExamType = {
  id: number
  name: string
  slug: string
  description: string | null
  logoUrl: string | null
  coverUrl: string | null
}

export type PublicMaterialSubject = {
  id: number
  examTypeId: number
  name: string
  slug: string
  description: string | null
  logoUrl: string | null
  materialCount: number
}

export type PublicMaterialSummary = {
  id: number
  examTypeId: number
  examTypeName: string
  examTypeSlug: string
  subjectId: number
  subjectName: string
  subjectSlug: string
  topicId: number | null
  topicName: string | null
  topicSlug: string | null
  title: string
  slug: string
  excerpt: string | null
  youtubeUrl: string | null
  youtubeVideoId: string | null
  content: string | null
  thumbnailUrl: string | null
  isFree: boolean
  contentMode: "video" | "text" | "mixed"
  publishedAt: string | null
}

export type PublicMaterialDetail = PublicMaterialSummary & {
  relatedMaterials: PublicMaterialSummary[]
}

export type PublicMaterialDiscoveryData = {
  examTypes: PublicMaterialExamType[]
  subjects: PublicMaterialSubject[]
  materials: PublicMaterialSummary[]
  serverNow: string
}

type MaterialSummaryRow = {
  id: number
  examTypeId: number
  examTypeName: string
  examTypeSlug: string
  subjectId: number
  subjectName: string
  subjectSlug: string
  topicId: number | null
  topicName: string | null
  topicSlug: string | null
  title: string
  slug: string
  excerpt: string | null
  youtubeUrl: string | null
  content: string | null
  thumbnailUrl: string | null
  isFree: boolean
  publishedAt: Date | null
}

type MaterialRowWithUpdatedAt = MaterialSummaryRow & {
  updatedAt: Date
}

export async function getPublicMaterialDiscoveryData(): Promise<PublicMaterialDiscoveryData> {
  const now = new Date()
  const [examTypes, subjects, materials, subjectMaterialCounts] = await Promise.all([
    db
      .select({
        id: schema.examTypes.id,
        name: schema.examTypes.name,
        slug: schema.examTypes.slug,
        description: schema.examTypes.description,
        logoUrl: schema.examTypes.logoUrl,
        coverUrl: schema.examTypes.coverUrl,
      })
      .from(schema.examTypes)
      .orderBy(asc(schema.examTypes.id)),
    db
      .select({
        id: schema.subjects.id,
        examTypeId: schema.subjects.examTypeId,
        name: schema.subjects.name,
        slug: schema.subjects.slug,
        description: schema.subjects.description,
        logoUrl: schema.subjects.logoUrl,
      })
      .from(schema.subjects)
      .orderBy(asc(schema.subjects.id)),
    getVisibleMaterialRows(now),
    db
      .select({
        subjectId: schema.materials.subjectId,
        count: sql<number>`count(${schema.materials.id})`,
      })
      .from(schema.materials)
      .where(publishedMaterialCondition(now))
      .groupBy(schema.materials.subjectId),
  ])

  const materialCountBySubject = new Map(
    subjectMaterialCounts.map((row) => [row.subjectId, Number(row.count ?? 0)]),
  )

  return {
    examTypes: examTypes.map((examType) => ({
      ...examType,
      description: examType.description ?? null,
      logoUrl: examType.logoUrl ?? null,
      coverUrl: examType.coverUrl ?? null,
    })),
    subjects: subjects.map((subject) => ({
      ...subject,
      description: subject.description ?? null,
      logoUrl: subject.logoUrl ?? null,
      materialCount: materialCountBySubject.get(subject.id) ?? 0,
    })),
    materials: materials.map(mapMaterialSummary),
    serverNow: now.toISOString(),
  }
}

export async function getPublishedMaterialBySlug(
  slug: string,
): Promise<PublicMaterialDetail | null> {
  const now = new Date()
  const [row] = await db
    .select(selectVisibleMaterialColumns())
    .from(schema.materials)
    .innerJoin(schema.examTypes, eq(schema.materials.examTypeId, schema.examTypes.id))
    .innerJoin(schema.subjects, eq(schema.materials.subjectId, schema.subjects.id))
    .leftJoin(schema.topics, eq(schema.materials.topicId, schema.topics.id))
    .where(and(publishedMaterialCondition(now), eq(schema.materials.slug, slug)))
    .limit(1)

  if (!row) {
    return null
  }

  const relatedMaterials = await getRelatedMaterials(row.id, row.examTypeId, row.subjectId)

  return {
    ...mapMaterialSummary(row),
    relatedMaterials,
  }
}

export async function getPublishedMaterialByExamTypeAndSlug(
  examTypeSlug: string,
  slug: string,
): Promise<PublicMaterialDetail | null> {
  const now = new Date()
  const [row] = await db
    .select(selectVisibleMaterialColumns())
    .from(schema.materials)
    .innerJoin(schema.examTypes, eq(schema.materials.examTypeId, schema.examTypes.id))
    .innerJoin(schema.subjects, eq(schema.materials.subjectId, schema.subjects.id))
    .leftJoin(schema.topics, eq(schema.materials.topicId, schema.topics.id))
    .where(
      and(
        publishedMaterialCondition(now),
        eq(schema.examTypes.slug, examTypeSlug),
        eq(schema.materials.slug, slug),
      ),
    )
    .limit(1)

  if (!row) {
    return null
  }

  const relatedMaterials = await getRelatedMaterials(row.id, row.examTypeId, row.subjectId)

  return {
    ...mapMaterialSummary(row),
    relatedMaterials,
  }
}

export async function getPublishedMaterialSitemapEntries() {
  const rows = await getVisibleMaterialRows(new Date())

  return rows.map((row) => ({
    examTypeSlug: row.examTypeSlug,
    slug: row.slug,
    updatedAt: row.updatedAt,
    thumbnailUrl: row.thumbnailUrl ?? null,
  }))
}

function selectVisibleMaterialColumns() {
  return {
    id: schema.materials.id,
    examTypeId: schema.materials.examTypeId,
    examTypeName: schema.examTypes.name,
    examTypeSlug: schema.examTypes.slug,
    subjectId: schema.materials.subjectId,
    subjectName: schema.subjects.name,
    subjectSlug: schema.subjects.slug,
    topicId: schema.materials.topicId,
    topicName: schema.topics.name,
    topicSlug: schema.topics.slug,
    title: schema.materials.title,
    slug: schema.materials.slug,
    excerpt: schema.materials.excerpt,
    youtubeUrl: schema.materials.youtubeUrl,
    content: schema.materials.content,
    thumbnailUrl: schema.materials.thumbnailUrl,
    isFree: schema.materials.isFree,
    publishedAt: schema.materials.publishedAt,
  } as const
}

function publishedMaterialCondition(now: Date) {
  return and(
    eq(schema.materials.status, "published"),
    isNotNull(schema.materials.publishedAt),
    lte(schema.materials.publishedAt, now),
  )
}

function getVisibleMaterialRows(now: Date) {
  return db
    .select({
      ...selectVisibleMaterialColumns(),
      updatedAt: schema.materials.updatedAt,
    })
    .from(schema.materials)
    .innerJoin(schema.examTypes, eq(schema.materials.examTypeId, schema.examTypes.id))
    .innerJoin(schema.subjects, eq(schema.materials.subjectId, schema.subjects.id))
    .leftJoin(schema.topics, eq(schema.materials.topicId, schema.topics.id))
    .where(publishedMaterialCondition(now))
    .orderBy(asc(schema.materials.examTypeId), asc(schema.materials.subjectId), asc(schema.materials.id))
}

async function getRelatedMaterials(
  currentMaterialId: number,
  examTypeId: number,
  subjectId: number,
) {
  const rows = await db
    .select(selectVisibleMaterialColumns())
    .from(schema.materials)
    .innerJoin(schema.examTypes, eq(schema.materials.examTypeId, schema.examTypes.id))
    .innerJoin(schema.subjects, eq(schema.materials.subjectId, schema.subjects.id))
    .leftJoin(schema.topics, eq(schema.materials.topicId, schema.topics.id))
    .where(
      and(
        publishedMaterialCondition(new Date()),
        eq(schema.materials.examTypeId, examTypeId),
        eq(schema.materials.subjectId, subjectId),
        notInArray(schema.materials.id, [currentMaterialId]),
      ),
    )
    .orderBy(desc(schema.materials.publishedAt), desc(schema.materials.createdAt))
    .limit(3)

  if (rows.length >= 3) {
    return rows.map(mapMaterialSummary)
  }

  const excludedIds = [currentMaterialId, ...rows.map((item) => item.id)]
  const fallbackRows = await db
    .select(selectVisibleMaterialColumns())
    .from(schema.materials)
    .innerJoin(schema.examTypes, eq(schema.materials.examTypeId, schema.examTypes.id))
    .innerJoin(schema.subjects, eq(schema.materials.subjectId, schema.subjects.id))
    .leftJoin(schema.topics, eq(schema.materials.topicId, schema.topics.id))
    .where(
      and(
        publishedMaterialCondition(new Date()),
        eq(schema.materials.examTypeId, examTypeId),
        excludedIds.length ? notInArray(schema.materials.id, excludedIds) : undefined,
      ),
    )
    .orderBy(desc(schema.materials.publishedAt), desc(schema.materials.createdAt))
    .limit(3 - rows.length)

  return [...rows, ...fallbackRows].map(mapMaterialSummary)
}

type VisibleMaterialRow = Awaited<ReturnType<typeof getVisibleMaterialRows>>[number]

function mapMaterialSummary(row: MaterialSummaryRow): PublicMaterialSummary {
  const youtubeVideoId = extractYouTubeVideoId(row.youtubeUrl)
  const hasVideo = Boolean(youtubeVideoId)
  const hasText = Boolean(row.content?.trim())

  return {
    id: row.id,
    examTypeId: row.examTypeId,
    examTypeName: row.examTypeName,
    examTypeSlug: row.examTypeSlug,
    subjectId: row.subjectId,
    subjectName: row.subjectName,
    subjectSlug: row.subjectSlug,
    topicId: row.topicId ?? null,
    topicName: row.topicName ?? null,
    topicSlug: row.topicSlug ?? null,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt ?? null,
    youtubeUrl: row.youtubeUrl ?? null,
    youtubeVideoId,
    content: row.content ?? null,
    thumbnailUrl: row.thumbnailUrl ?? null,
    isFree: row.isFree,
    contentMode: hasVideo && hasText ? "mixed" : hasVideo ? "video" : "text",
    publishedAt: row.publishedAt?.toISOString() ?? null,
  }
}
