import "server-only"

import { and, asc, eq, inArray, isNotNull, sql } from "drizzle-orm"
import { cacheLife, cacheTag } from "next/cache"

import { db, schema } from "@/db"
import { CACHE_TAGS, cacheTagFor } from "@/lib/cache-tags"

import type { TryoutAvailabilityStatus } from "../utils/status"
import { resolveTryoutAvailabilityStatus } from "../utils/status"

export type PublicTryoutExamType = {
  id: number
  name: string
  slug: string
  description: string | null
  logoUrl: string | null
  coverUrl: string | null
}

export type PublicTryoutSummary = {
  id: number
  examTypeId: number
  examTypeName: string
  examTypeSlug: string
  title: string
  slug: string
  description: string | null
  isFree: boolean
  startsAt: string | null
  endsAt: string | null
  contentStatus: "published" | "archived"
  publishedAt: string | null
  showResultAfterSubmit: boolean
  resultReleaseAt: string | null
  showRankingAfterSubmit: boolean
  rankingReleaseAt: string | null
  showExplanationAfterSubmit: boolean
  explanationReleaseAt: string | null
  enforceEndTime: boolean
  wrongAnswerPenalty: number
  scoringMethod: "raw_score" | "irt_3pl"
  sectionCount: number
  questionCount: number
  totalDurationMinutes: number
  availabilityStatus: TryoutAvailabilityStatus
}

export type PublicTryoutSection = {
  id: number
  subjectId: number
  subjectName: string
  subjectSlug: string
  title: string
  description: string | null
  durationMinutes: number
  orderIndex: number
  wrongAnswerPenalty: number | null
  questionCount: number
}

export type PublicTryoutDetail = PublicTryoutSummary & {
  sections: PublicTryoutSection[]
  navigationMode: "free" | "sequential"
  allowReviewBeforeSubmit: boolean
  shuffleQuestions: boolean
  shuffleOptions: boolean
}

export type PublicTryoutSessionSummary = {
  id: number
  tryoutId: number
  status: "pending" | "in_progress" | "submitted" | "grading" | "graded" | "cancelled"
  startedAt: string
  submittedAt: string | null
  gradedAt: string | null
}

export type PublicTryoutDiscoveryData = {
  examTypes: PublicTryoutExamType[]
  tryouts: PublicTryoutSummary[]
  userSessions: PublicTryoutSessionSummary[]
  serverNow: string
}

type PublicTryoutCatalogData = Omit<PublicTryoutDiscoveryData, "userSessions">

const visibleTryoutCondition = and(
  inArray(schema.tryouts.status, ["published", "archived"]),
  isNotNull(schema.tryouts.publishedAt),
)

export async function getPublicTryoutDiscoveryData(
  userId?: number,
): Promise<PublicTryoutDiscoveryData> {
  const [catalog, userSessions] = await Promise.all([
    getPublicTryoutCatalog(),
    userId ? getUserTryoutSessions(userId) : Promise.resolve([]),
  ])

  return {
    ...catalog,
    userSessions: userSessions.map(mapUserSessionSummary),
  }
}

async function getPublicTryoutCatalog(): Promise<PublicTryoutCatalogData> {
  "use cache"
  cacheLife("minutes")
  cacheTag(CACHE_TAGS.tryouts, CACHE_TAGS.examTypes, CACHE_TAGS.sitemap)

  const now = new Date()
  const [examTypes, tryouts, stats] = await Promise.all([
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
    getVisibleTryoutRows(),
    getTryoutCompositionStats(),
  ])

  const statMap = new Map(stats.map((row) => [row.tryoutId, row]))
  const publicTryouts = tryouts.map((tryout) =>
    mapPublicTryoutSummary(tryout, statMap.get(tryout.id), now),
  )
  return {
    examTypes: examTypes.map((examType) => ({
      ...examType,
      description: examType.description ?? null,
      logoUrl: examType.logoUrl ?? null,
      coverUrl: examType.coverUrl ?? null,
    })),
    tryouts: publicTryouts,
    serverNow: now.toISOString(),
  }
}

export async function getPublicTryoutBySlug(
  slug: string,
): Promise<PublicTryoutDetail | null> {
  "use cache"
  cacheLife("minutes")
  cacheTag(CACHE_TAGS.tryouts, cacheTagFor.tryout(slug))

  const now = new Date()
  const rows = await db
    .select(selectVisibleTryoutColumns())
    .from(schema.tryouts)
    .innerJoin(schema.examTypes, eq(schema.tryouts.examTypeId, schema.examTypes.id))
    .where(and(visibleTryoutCondition, eq(schema.tryouts.slug, slug)))
    .limit(1)

  const tryout = rows[0]

  if (!tryout) {
    return null
  }

  const [sections, questionCounts] = await Promise.all([
    db
      .select({
        id: schema.tryoutSections.id,
        subjectId: schema.tryoutSections.subjectId,
        subjectName: schema.subjects.name,
        subjectSlug: schema.subjects.slug,
        title: schema.tryoutSections.title,
        description: schema.tryoutSections.description,
        durationMinutes: schema.tryoutSections.durationMinutes,
        orderIndex: schema.tryoutSections.orderIndex,
        wrongAnswerPenalty: schema.tryoutSections.wrongAnswerPenalty,
      })
      .from(schema.tryoutSections)
      .innerJoin(schema.subjects, eq(schema.tryoutSections.subjectId, schema.subjects.id))
      .where(eq(schema.tryoutSections.tryoutId, tryout.id))
      .orderBy(schema.tryoutSections.orderIndex),
    db
      .select({
        tryoutSectionId: schema.tryoutQuestions.tryoutSectionId,
        count: sql<number>`count(${schema.tryoutQuestions.id})`,
      })
      .from(schema.tryoutQuestions)
      .innerJoin(
        schema.tryoutSections,
        eq(schema.tryoutQuestions.tryoutSectionId, schema.tryoutSections.id),
      )
      .where(eq(schema.tryoutSections.tryoutId, tryout.id))
      .groupBy(schema.tryoutQuestions.tryoutSectionId),
  ])

  const questionCountMap = new Map(
    questionCounts.map((row) => [row.tryoutSectionId, Number(row.count ?? 0)]),
  )
  const sectionDetails = sections.map<PublicTryoutSection>((section) => ({
    ...section,
    description: section.description ?? null,
    wrongAnswerPenalty:
      section.wrongAnswerPenalty === null ? null : Number(section.wrongAnswerPenalty),
    questionCount: questionCountMap.get(section.id) ?? 0,
  }))
  const stats = {
    tryoutId: tryout.id,
    sectionCount: sectionDetails.length,
    questionCount: sectionDetails.reduce((total, section) => total + section.questionCount, 0),
    totalDurationMinutes: sectionDetails.reduce(
      (total, section) => total + section.durationMinutes,
      0,
    ),
  }

  return {
    ...mapPublicTryoutSummary(tryout, stats, now),
    sections: sectionDetails,
    navigationMode: tryout.navigationMode,
    allowReviewBeforeSubmit: tryout.allowReviewBeforeSubmit,
    shuffleQuestions: tryout.shuffleQuestions,
    shuffleOptions: tryout.shuffleOptions,
  }
}

export async function getUserTryoutSessionForTryout(userId: number, tryoutId: number) {
  const sessions = await getUserTryoutSessions(userId, tryoutId)
  return sessions[0] ? mapUserSessionSummary(sessions[0]) : null
}

function selectVisibleTryoutColumns() {
  return {
    id: schema.tryouts.id,
    examTypeId: schema.tryouts.examTypeId,
    examTypeName: schema.examTypes.name,
    examTypeSlug: schema.examTypes.slug,
    title: schema.tryouts.title,
    slug: schema.tryouts.slug,
    description: schema.tryouts.description,
    isFree: schema.tryouts.isFree,
    startsAt: schema.tryouts.startsAt,
    endsAt: schema.tryouts.endsAt,
    contentStatus: schema.tryouts.status,
    publishedAt: schema.tryouts.publishedAt,
    showResultAfterSubmit: schema.tryouts.showResultAfterSubmit,
    resultReleaseAt: schema.tryouts.resultReleaseAt,
    showRankingAfterSubmit: schema.tryouts.showRankingAfterSubmit,
    rankingReleaseAt: schema.tryouts.rankingReleaseAt,
    showExplanationAfterSubmit: schema.tryouts.showExplanationAfterSubmit,
    explanationReleaseAt: schema.tryouts.explanationReleaseAt,
    enforceEndTime: schema.tryouts.enforceEndTime,
    wrongAnswerPenalty: schema.tryouts.wrongAnswerPenalty,
    scoringMethod: schema.tryouts.scoringMethod,
    navigationMode: schema.tryouts.navigationMode,
    allowReviewBeforeSubmit: schema.tryouts.allowReviewBeforeSubmit,
    shuffleQuestions: schema.tryouts.shuffleQuestions,
    shuffleOptions: schema.tryouts.shuffleOptions,
  } as const
}

function getVisibleTryoutRows() {
  return db
    .select(selectVisibleTryoutColumns())
    .from(schema.tryouts)
    .innerJoin(schema.examTypes, eq(schema.tryouts.examTypeId, schema.examTypes.id))
    .where(visibleTryoutCondition)
    .orderBy(asc(schema.tryouts.startsAt), asc(schema.tryouts.id))
}

async function getTryoutCompositionStats() {
  const [sections, questions] = await Promise.all([
    db
      .select({
        tryoutId: schema.tryoutSections.tryoutId,
        sectionCount: sql<number>`count(${schema.tryoutSections.id})`,
        totalDurationMinutes: sql<number>`coalesce(sum(${schema.tryoutSections.durationMinutes}), 0)`,
      })
      .from(schema.tryoutSections)
      .groupBy(schema.tryoutSections.tryoutId),
    db
      .select({
        tryoutId: schema.tryoutSections.tryoutId,
        questionCount: sql<number>`count(${schema.tryoutQuestions.id})`,
      })
      .from(schema.tryoutQuestions)
      .innerJoin(
        schema.tryoutSections,
        eq(schema.tryoutQuestions.tryoutSectionId, schema.tryoutSections.id),
      )
      .groupBy(schema.tryoutSections.tryoutId),
  ])

  const questionMap = new Map(questions.map((row) => [row.tryoutId, Number(row.questionCount)]))

  return sections.map((section) => ({
    tryoutId: section.tryoutId,
    sectionCount: Number(section.sectionCount ?? 0),
    questionCount: questionMap.get(section.tryoutId) ?? 0,
    totalDurationMinutes: Number(section.totalDurationMinutes ?? 0),
  }))
}

function getUserTryoutSessions(userId: number, tryoutId?: number) {
  return db
    .select({
      id: schema.tryoutSessions.id,
      tryoutId: schema.tryoutSessions.tryoutId,
      status: schema.tryoutSessions.status,
      startedAt: schema.tryoutSessions.startedAt,
      submittedAt: schema.tryoutSessions.submittedAt,
      gradedAt: schema.tryoutSessions.gradedAt,
      createdAt: schema.tryoutSessions.createdAt,
    })
    .from(schema.tryoutSessions)
    .where(
      tryoutId
        ? and(
            eq(schema.tryoutSessions.userId, userId),
            eq(schema.tryoutSessions.tryoutId, tryoutId),
          )
        : eq(schema.tryoutSessions.userId, userId),
    )
    .orderBy(asc(schema.tryoutSessions.createdAt))
}

type VisibleTryoutRow = Awaited<ReturnType<typeof getVisibleTryoutRows>>[number]

function mapPublicTryoutSummary(
  row: VisibleTryoutRow,
  stats:
    | {
        sectionCount: number
        questionCount: number
        totalDurationMinutes: number
      }
    | undefined,
  now: Date,
): PublicTryoutSummary {
  const startsAt = row.startsAt?.toISOString() ?? null
  const endsAt = row.endsAt?.toISOString() ?? null

  return {
    id: row.id,
    examTypeId: row.examTypeId,
    examTypeName: row.examTypeName,
    examTypeSlug: row.examTypeSlug,
    title: row.title,
    slug: row.slug,
    description: row.description ?? null,
    isFree: row.isFree,
    startsAt,
    endsAt,
    contentStatus: row.contentStatus as "published" | "archived",
    publishedAt: row.publishedAt?.toISOString() ?? null,
    showResultAfterSubmit: row.showResultAfterSubmit,
    resultReleaseAt: row.resultReleaseAt?.toISOString() ?? null,
    showRankingAfterSubmit: row.showRankingAfterSubmit,
    rankingReleaseAt: row.rankingReleaseAt?.toISOString() ?? null,
    showExplanationAfterSubmit: row.showExplanationAfterSubmit,
    explanationReleaseAt: row.explanationReleaseAt?.toISOString() ?? null,
    enforceEndTime: row.enforceEndTime,
    wrongAnswerPenalty: Number(row.wrongAnswerPenalty ?? 0),
    scoringMethod: row.scoringMethod,
    sectionCount: stats?.sectionCount ?? 0,
    questionCount: stats?.questionCount ?? 0,
    totalDurationMinutes: stats?.totalDurationMinutes ?? 0,
    availabilityStatus: resolveTryoutAvailabilityStatus(
      {
        contentStatus: row.contentStatus as "published" | "archived",
        startsAt,
        endsAt,
      },
      now,
    ),
  }
}

type UserSessionRow = Awaited<ReturnType<typeof getUserTryoutSessions>>[number]

function mapUserSessionSummary(row: UserSessionRow): PublicTryoutSessionSummary {
  return {
    id: row.id,
    tryoutId: row.tryoutId,
    status: row.status,
    startedAt: row.startedAt.toISOString(),
    submittedAt: row.submittedAt?.toISOString() ?? null,
    gradedAt: row.gradedAt?.toISOString() ?? null,
  }
}
