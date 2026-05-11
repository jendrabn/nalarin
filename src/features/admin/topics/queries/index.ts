import "server-only"

import { desc, eq, sql } from "drizzle-orm"

import { db, schema } from "@/db"

export type TopicRow = {
  id: number
  examTypeId: number
  examTypeName: string
  subjectId: number
  subjectName: string
  subjectSlug: string
  name: string
  slug: string
  description: string | null
  questionCount: number
  createdAt: Date
  updatedAt: Date
}

function selectTopicColumns() {
  return {
    id: schema.topics.id,
    examTypeId: schema.examTypes.id,
    examTypeName: schema.examTypes.name,
    subjectId: schema.topics.subjectId,
    subjectName: schema.subjects.name,
    subjectSlug: schema.subjects.slug,
    name: schema.topics.name,
    slug: schema.topics.slug,
    description: schema.topics.description,
    createdAt: schema.topics.createdAt,
    updatedAt: schema.topics.updatedAt,
  } as const
}

async function buildTopicCountMap() {
  const questionCounts = await db
    .select({
      topicId: schema.questions.topicId,
      questionCount: sql<number>`count(*)`,
    })
    .from(schema.questions)
    .groupBy(schema.questions.topicId)

  return new Map(
    questionCounts
      .filter((row) => row.topicId !== null)
      .map((row) => [row.topicId as number, Number(row.questionCount ?? 0)]),
  )
}

export async function getTopics() {
  const [rows, questionCountMap] = await Promise.all([
    db
      .select(selectTopicColumns())
      .from(schema.topics)
      .innerJoin(schema.subjects, eq(schema.topics.subjectId, schema.subjects.id))
      .innerJoin(schema.examTypes, eq(schema.subjects.examTypeId, schema.examTypes.id))
      .orderBy(desc(schema.topics.createdAt)),
    buildTopicCountMap(),
  ])

  return rows.map<TopicRow>((row) => ({
    ...row,
    description: row.description ?? null,
    questionCount: questionCountMap.get(row.id) ?? 0,
  }))
}

export async function getTopicById(id: number) {
  const rows = await getTopics()
  return rows.find((row) => row.id === id) ?? null
}
