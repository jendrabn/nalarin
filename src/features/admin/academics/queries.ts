import "server-only"

import { desc, eq, sql } from "drizzle-orm"

import { db, schema } from "@/db"

export type ExamTypeRow = {
  id: number
  name: string
  slug: string
  description: string | null
  subjectCount: number
  topicCount: number
  questionCount: number
  createdAt: Date
  updatedAt: Date
}

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

export type ExamTypeLookup = {
  id: number
  name: string
  slug: string
}

export type SubjectLookup = {
  id: number
  examTypeId: number
  name: string
  slug: string
}

function selectExamTypeColumns() {
  return {
    id: schema.examTypes.id,
    name: schema.examTypes.name,
    slug: schema.examTypes.slug,
    description: schema.examTypes.description,
    createdAt: schema.examTypes.createdAt,
    updatedAt: schema.examTypes.updatedAt,
  } as const
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

async function buildExamTypeCountMaps() {
  const [subjectCounts, topicCounts, questionCounts] = await Promise.all([
    db
      .select({
        examTypeId: schema.subjects.examTypeId,
        subjectCount: sql<number>`count(${schema.subjects.id})`,
      })
      .from(schema.subjects)
      .groupBy(schema.subjects.examTypeId),
    db
      .select({
        examTypeId: schema.subjects.examTypeId,
        topicCount: sql<number>`count(${schema.topics.id})`,
      })
      .from(schema.topics)
      .innerJoin(schema.subjects, eq(schema.topics.subjectId, schema.subjects.id))
      .groupBy(schema.subjects.examTypeId),
    db
      .select({
        examTypeId: schema.subjects.examTypeId,
        questionCount: sql<number>`count(${schema.questions.id})`,
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

async function buildSubjectCountMaps() {
  const [topicCounts, questionCounts] = await Promise.all([
    db
      .select({
        subjectId: schema.topics.subjectId,
        topicCount: sql<number>`count(${schema.topics.id})`,
      })
      .from(schema.topics)
      .groupBy(schema.topics.subjectId),
    db
      .select({
        subjectId: schema.questions.subjectId,
        questionCount: sql<number>`count(${schema.questions.id})`,
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

async function buildTopicCountMap() {
  const questionCounts = await db
    .select({
      topicId: schema.questions.topicId,
      questionCount: sql<number>`count(${schema.questions.id})`,
    })
    .from(schema.questions)
    .groupBy(schema.questions.topicId)

  return new Map(
    questionCounts
      .filter((row) => row.topicId !== null)
      .map((row) => [row.topicId as number, Number(row.questionCount ?? 0)]),
  )
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
    subjectCount: counts.subjectCounts.get(row.id) ?? 0,
    topicCount: counts.topicCounts.get(row.id) ?? 0,
    questionCount: counts.questionCounts.get(row.id) ?? 0,
  }))
}

export async function getExamTypeById(id: number) {
  const rows = await getExamTypes()
  return rows.find((row) => row.id === id) ?? null
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

export async function getAdminAcademicLookups() {
  const [examTypes, subjects] = await Promise.all([
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
  ])

  return {
    examTypes: examTypes as ExamTypeLookup[],
    subjects: subjects as SubjectLookup[],
  }
}

