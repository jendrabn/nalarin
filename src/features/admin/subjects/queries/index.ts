import "server-only"

import { desc, eq, sql } from "drizzle-orm"

import { db, schema } from "@/db"

export type SubjectRow = {
  id: number
  examTypeId: number
  examTypeName: string
  examTypeSlug: string
  name: string
  slug: string
  description: string | null
  topicCount: number
  questionCount: number
  createdAt: Date
  updatedAt: Date
}

export type SubjectLookup = {
  id: number
  examTypeId: number
  name: string
  slug: string
}

function selectSubjectColumns() {
  return {
    id: schema.subjects.id,
    examTypeId: schema.subjects.examTypeId,
    examTypeName: schema.examTypes.name,
    examTypeSlug: schema.examTypes.slug,
    name: schema.subjects.name,
    slug: schema.subjects.slug,
    description: schema.subjects.description,
    createdAt: schema.subjects.createdAt,
    updatedAt: schema.subjects.updatedAt,
  } as const
}

async function buildSubjectCountMaps() {
  const [topicCounts, questionCounts] = await Promise.all([
    db
      .select({
        subjectId: schema.topics.subjectId,
        topicCount: sql<number>`count(*)`,
      })
      .from(schema.topics)
      .groupBy(schema.topics.subjectId),
    db
      .select({
        subjectId: schema.questions.subjectId,
        questionCount: sql<number>`count(*)`,
      })
      .from(schema.questions)
      .groupBy(schema.questions.subjectId),
  ])

  return {
    topicCounts: new Map(topicCounts.map((row) => [row.subjectId, Number(row.topicCount ?? 0)])),
    questionCounts: new Map(
      questionCounts.map((row) => [row.subjectId, Number(row.questionCount ?? 0)]),
    ),
  }
}

export async function getSubjects() {
  const [rows, counts] = await Promise.all([
    db
      .select(selectSubjectColumns())
      .from(schema.subjects)
      .innerJoin(schema.examTypes, eq(schema.subjects.examTypeId, schema.examTypes.id))
      .orderBy(desc(schema.subjects.createdAt)),
    buildSubjectCountMaps(),
  ])

  return rows.map<SubjectRow>((row) => ({
    ...row,
    description: row.description ?? null,
    topicCount: counts.topicCounts.get(row.id) ?? 0,
    questionCount: counts.questionCounts.get(row.id) ?? 0,
  }))
}

export async function getSubjectById(id: number) {
  const rows = await getSubjects()
  return rows.find((row) => row.id === id) ?? null
}

export async function getSubjectLookups() {
  const rows = await db
    .select({
      id: schema.subjects.id,
      examTypeId: schema.subjects.examTypeId,
      name: schema.subjects.name,
      slug: schema.subjects.slug,
    })
    .from(schema.subjects)
    .orderBy(schema.subjects.name)

  return rows as SubjectLookup[]
}
