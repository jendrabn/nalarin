import "server-only"

import { desc, eq, sql } from "drizzle-orm"

import { db, schema } from "@/db"

export type ExamTypeRow = {
  id: number
  name: string
  slug: string
  description: string | null
  logoUrl: string | null
  subjectCount: number
  topicCount: number
  questionCount: number
  createdAt: Date
  updatedAt: Date
}

export type ExamTypeLookup = {
  id: number
  name: string
  slug: string
}

function selectExamTypeColumns() {
  return {
    id: schema.examTypes.id,
    name: schema.examTypes.name,
    slug: schema.examTypes.slug,
    description: schema.examTypes.description,
    logoUrl: schema.examTypes.logoUrl,
    createdAt: schema.examTypes.createdAt,
    updatedAt: schema.examTypes.updatedAt,
  } as const
}

async function buildExamTypeCountMaps() {
  const [subjectCounts, topicCounts, questionCounts] = await Promise.all([
    db
      .select({
        examTypeId: schema.subjects.examTypeId,
        subjectCount: sql<number>`count(*)`,
      })
      .from(schema.subjects)
      .groupBy(schema.subjects.examTypeId),
    db
      .select({
        examTypeId: schema.subjects.examTypeId,
        topicCount: sql<number>`count(*)`,
      })
      .from(schema.topics)
      .innerJoin(schema.subjects, eq(schema.topics.subjectId, schema.subjects.id))
      .groupBy(schema.subjects.examTypeId),
    db
      .select({
        examTypeId: schema.subjects.examTypeId,
        questionCount: sql<number>`count(*)`,
      })
      .from(schema.questions)
      .innerJoin(schema.subjects, eq(schema.questions.subjectId, schema.subjects.id))
      .groupBy(schema.subjects.examTypeId),
  ])

  return {
    subjectCounts: new Map(subjectCounts.map((row) => [row.examTypeId, Number(row.subjectCount ?? 0)])),
    topicCounts: new Map(topicCounts.map((row) => [row.examTypeId, Number(row.topicCount ?? 0)])),
    questionCounts: new Map(
      questionCounts.map((row) => [row.examTypeId, Number(row.questionCount ?? 0)]),
    ),
  }
}

export async function getExamTypes() {
  const [rows, counts] = await Promise.all([
    db
      .select(selectExamTypeColumns())
      .from(schema.examTypes)
      .orderBy(desc(schema.examTypes.createdAt)),
    buildExamTypeCountMaps(),
  ])

  return rows.map<ExamTypeRow>((row) => ({
    ...row,
    description: row.description ?? null,
    logoUrl: row.logoUrl ?? null,
    subjectCount: counts.subjectCounts.get(row.id) ?? 0,
    topicCount: counts.topicCounts.get(row.id) ?? 0,
    questionCount: counts.questionCounts.get(row.id) ?? 0,
  }))
}

export async function getExamTypeById(id: number) {
  const rows = await getExamTypes()
  return rows.find((row) => row.id === id) ?? null
}

export async function getExamTypeLookups() {
  const rows = await db
    .select({
      id: schema.examTypes.id,
      name: schema.examTypes.name,
      slug: schema.examTypes.slug,
    })
    .from(schema.examTypes)
    .orderBy(schema.examTypes.name)

  return rows as ExamTypeLookup[]
}
