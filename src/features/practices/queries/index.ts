import "server-only"

import { and, asc, eq, isNotNull, sql } from "drizzle-orm"

import { db, schema } from "@/db"

import {
  getPracticeDifficulty,
  type DifficultyCounts,
  type PracticeDifficulty,
} from "../utils/difficulty"

export type PracticeDiscoveryExamType = {
  id: number
  name: string
  slug: string
  description: string | null
}

export type PracticeDiscoverySubject = {
  id: number
  examTypeId: number
  name: string
  slug: string
  description: string | null
  practiceCount: number
}

export type PracticeDiscoveryTopic = {
  id: number
  examTypeId: number
  subjectId: number
  name: string
  slug: string
  description: string | null
  practiceCount: number
}

export type PracticeDiscoveryPractice = {
  id: number
  examTypeId: number
  examTypeSlug: string
  subjectId: number
  subjectSlug: string
  topicId: number | null
  title: string
  slug: string
  description: string | null
  isFree: boolean
  hasPracticeMode: boolean
  hasQuizMode: boolean
  quizDurationMinutes: number | null
  questionCount: number
  difficultyCounts: DifficultyCounts
  difficulty: PracticeDifficulty
}

export type PracticeDiscoveryData = {
  examTypes: PracticeDiscoveryExamType[]
  subjects: PracticeDiscoverySubject[]
  topics: PracticeDiscoveryTopic[]
  practices: PracticeDiscoveryPractice[]
}

const publishedPracticeCondition = and(
  eq(schema.practices.status, "published"),
  isNotNull(schema.practices.publishedAt),
)

export async function getPracticeDiscoveryData(): Promise<PracticeDiscoveryData> {
  const [examTypes, subjects, topics, practices, questionStats] = await Promise.all([
    db
      .select({
        id: schema.examTypes.id,
        name: schema.examTypes.name,
        slug: schema.examTypes.slug,
        description: schema.examTypes.description,
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
      })
      .from(schema.subjects)
      .orderBy(asc(schema.subjects.id)),
    db
      .select({
        id: schema.topics.id,
        examTypeId: schema.subjects.examTypeId,
        subjectId: schema.topics.subjectId,
        name: schema.topics.name,
        slug: schema.topics.slug,
        description: schema.topics.description,
      })
      .from(schema.topics)
      .innerJoin(schema.subjects, eq(schema.topics.subjectId, schema.subjects.id))
      .orderBy(asc(schema.topics.id)),
    db
      .select({
        id: schema.practices.id,
        examTypeId: schema.practices.examTypeId,
        examTypeSlug: schema.examTypes.slug,
        subjectId: schema.practices.subjectId,
        subjectSlug: schema.subjects.slug,
        topicId: schema.practices.topicId,
        title: schema.practices.title,
        slug: schema.practices.slug,
        description: schema.practices.description,
        isFree: schema.practices.isFree,
        hasPracticeMode: schema.practices.hasPracticeMode,
        hasQuizMode: schema.practices.hasQuizMode,
        quizDurationMinutes: schema.practices.quizDurationMinutes,
      })
      .from(schema.practices)
      .innerJoin(schema.examTypes, eq(schema.practices.examTypeId, schema.examTypes.id))
      .innerJoin(schema.subjects, eq(schema.practices.subjectId, schema.subjects.id))
      .where(publishedPracticeCondition)
      .orderBy(asc(schema.practices.id)),
    db
      .select({
        practiceId: schema.practiceQuestions.practiceId,
        questionCount: sql<number>`count(${schema.practiceQuestions.id})`,
        easyCount: sql<number>`sum(case when ${schema.questions.difficulty} = 'easy' then 1 else 0 end)`,
        mediumCount: sql<number>`sum(case when ${schema.questions.difficulty} = 'medium' then 1 else 0 end)`,
        hardCount: sql<number>`sum(case when ${schema.questions.difficulty} = 'hard' then 1 else 0 end)`,
      })
      .from(schema.practiceQuestions)
      .innerJoin(schema.questions, eq(schema.practiceQuestions.questionId, schema.questions.id))
      .groupBy(schema.practiceQuestions.practiceId),
  ])

  const practiceCountBySubject = new Map<number, number>()
  const practiceCountByTopic = new Map<number, number>()

  for (const practice of practices) {
    practiceCountBySubject.set(
      practice.subjectId,
      (practiceCountBySubject.get(practice.subjectId) ?? 0) + 1,
    )

    if (practice.topicId) {
      practiceCountByTopic.set(
        practice.topicId,
        (practiceCountByTopic.get(practice.topicId) ?? 0) + 1,
      )
    }
  }

  const questionStatsByPractice = new Map(
    questionStats.map((row) => [
      row.practiceId,
      {
        questionCount: Number(row.questionCount ?? 0),
        difficultyCounts: {
          easy: Number(row.easyCount ?? 0),
          medium: Number(row.mediumCount ?? 0),
          hard: Number(row.hardCount ?? 0),
        } satisfies DifficultyCounts,
      },
    ]),
  )

  return {
    examTypes: examTypes.map((examType) => ({
      ...examType,
      description: examType.description ?? null,
    })),
    subjects: subjects.map((subject) => ({
      ...subject,
      description: subject.description ?? null,
      practiceCount: practiceCountBySubject.get(subject.id) ?? 0,
    })),
    topics: topics.map((topic) => ({
      ...topic,
      description: topic.description ?? null,
      practiceCount: practiceCountByTopic.get(topic.id) ?? 0,
    })),
    practices: practices.map((practice) => {
      const stats = questionStatsByPractice.get(practice.id)
      const difficultyCounts = stats?.difficultyCounts ?? {
        easy: 0,
        medium: 0,
        hard: 0,
      }

      return {
        ...practice,
        topicId: practice.topicId ?? null,
        description: practice.description ?? null,
        quizDurationMinutes: practice.quizDurationMinutes ?? null,
        questionCount: stats?.questionCount ?? 0,
        difficultyCounts,
        difficulty: getPracticeDifficulty(difficultyCounts),
      }
    }),
  }
}
