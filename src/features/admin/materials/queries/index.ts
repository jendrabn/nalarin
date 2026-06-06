import "server-only"

import { desc, eq } from "drizzle-orm"

import { db, schema } from "@/db"

export type MaterialRow = {
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
  thumbnailUrl: string | null
  youtubeUrl: string | null
  content: string | null
  isFree: boolean
  status: (typeof schema.contentStatusValues)[number]
  publishedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export type MaterialDetails = MaterialRow

export type MaterialExamTypeLookup = {
  id: number
  name: string
  slug: string
}

export type MaterialSubjectLookup = {
  id: number
  examTypeId: number
  name: string
  slug: string
}

export type MaterialTopicLookup = {
  id: number
  examTypeId: number
  subjectId: number
  name: string
  slug: string
}

type MaterialLookupRow = {
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
  thumbnailUrl: string | null
  youtubeUrl: string | null
  content: string | null
  isFree: boolean
  status: (typeof schema.contentStatusValues)[number]
  publishedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

function selectMaterialColumns() {
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
    thumbnailUrl: schema.materials.thumbnailUrl,
    youtubeUrl: schema.materials.youtubeUrl,
    content: schema.materials.content,
    isFree: schema.materials.isFree,
    status: schema.materials.status,
    publishedAt: schema.materials.publishedAt,
    createdAt: schema.materials.createdAt,
    updatedAt: schema.materials.updatedAt,
  } as const
}

function normalizeMaterialRow(row: MaterialLookupRow): MaterialRow {
  return {
    ...row,
    topicId: row.topicId ?? null,
    topicName: row.topicName ?? null,
    topicSlug: row.topicSlug ?? null,
    excerpt: row.excerpt ?? null,
    thumbnailUrl: row.thumbnailUrl ?? null,
    youtubeUrl: row.youtubeUrl ?? null,
    content: row.content ?? null,
    publishedAt: row.publishedAt ?? null,
  }
}

export async function getMaterials() {
  const rows = await db
    .select(selectMaterialColumns())
    .from(schema.materials)
    .innerJoin(schema.examTypes, eq(schema.materials.examTypeId, schema.examTypes.id))
    .innerJoin(schema.subjects, eq(schema.materials.subjectId, schema.subjects.id))
    .leftJoin(schema.topics, eq(schema.materials.topicId, schema.topics.id))
    .orderBy(desc(schema.materials.createdAt))

  return rows.map(normalizeMaterialRow)
}

export async function getMaterialById(id: number) {
  const rows = await db
    .select(selectMaterialColumns())
    .from(schema.materials)
    .innerJoin(schema.examTypes, eq(schema.materials.examTypeId, schema.examTypes.id))
    .innerJoin(schema.subjects, eq(schema.materials.subjectId, schema.subjects.id))
    .leftJoin(schema.topics, eq(schema.materials.topicId, schema.topics.id))
    .where(eq(schema.materials.id, id))
    .limit(1)

  const material = rows[0]

  return material ? normalizeMaterialRow(material) : null
}

export async function getAdminMaterialLookups() {
  const [examTypes, subjects, topics] = await Promise.all([
    db
      .select({
        id: schema.examTypes.id,
        name: schema.examTypes.name,
        slug: schema.examTypes.slug,
      })
      .from(schema.examTypes)
      .orderBy(schema.examTypes.name),
    db
      .select({
        id: schema.subjects.id,
        examTypeId: schema.subjects.examTypeId,
        name: schema.subjects.name,
        slug: schema.subjects.slug,
      })
      .from(schema.subjects)
      .orderBy(schema.subjects.name),
    db
      .select({
        id: schema.topics.id,
        examTypeId: schema.subjects.examTypeId,
        subjectId: schema.topics.subjectId,
        name: schema.topics.name,
        slug: schema.topics.slug,
      })
      .from(schema.topics)
      .innerJoin(schema.subjects, eq(schema.topics.subjectId, schema.subjects.id))
      .orderBy(schema.topics.name),
  ])

  return {
    examTypes: examTypes as MaterialExamTypeLookup[],
    subjects: subjects as MaterialSubjectLookup[],
    topics: topics as MaterialTopicLookup[],
  }
}
