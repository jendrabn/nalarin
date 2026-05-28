import "server-only"

import { desc, eq, sql } from "drizzle-orm"

import { db, schema } from "@/db"

export type ExamTypeRow = {
  id: number
  name: string
  slug: string
  description: string | null
  logoUrl: string | null
  coverUrl: string | null
  packageId: number | null
  packagePriceId: number | null
  packageIsActive: boolean
  packagePrice: number
  packageDiscountPercent: number
  packageDurationMonths: number
  practiceQuotaPerMonth: number
  quizQuotaPerMonth: number
  tryoutQuotaPerMonth: number
  aiExplanationQuotaPerMonth: number
  premiumPracticesEnabled: boolean
  premiumTryoutsEnabled: boolean
  rankingEnabled: boolean
  countdownTitle: string | null
  countdownTargetAt: Date | null
  registrationStartAt: Date | null
  registrationEndAt: Date | null
  examStartAt: Date | null
  examEndAt: Date | null
  announcementAt: Date | null
  informationContent: string | null
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
    coverUrl: schema.examTypes.coverUrl,
    countdownTitle: schema.examTypes.countdownTitle,
    countdownTargetAt: schema.examTypes.countdownTargetAt,
    registrationStartAt: schema.examTypes.registrationStartAt,
    registrationEndAt: schema.examTypes.registrationEndAt,
    examStartAt: schema.examTypes.examStartAt,
    examEndAt: schema.examTypes.examEndAt,
    announcementAt: schema.examTypes.announcementAt,
    informationContent: schema.examTypes.informationContent,
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
      .select({
        ...selectExamTypeColumns(),
        packageId: schema.examTypePackages.id,
        packageIsActive: schema.examTypePackages.isActive,
        practiceQuotaPerMonth: schema.examTypePackages.practiceQuotaPerMonth,
        quizQuotaPerMonth: schema.examTypePackages.quizQuotaPerMonth,
        tryoutQuotaPerMonth: schema.examTypePackages.tryoutQuotaPerMonth,
        aiExplanationQuotaPerMonth: schema.examTypePackages.aiExplanationQuotaPerMonth,
        premiumPracticesEnabled: schema.examTypePackages.premiumPracticesEnabled,
        premiumTryoutsEnabled: schema.examTypePackages.premiumTryoutsEnabled,
        rankingEnabled: schema.examTypePackages.rankingEnabled,
        packagePriceId: schema.examTypePackagePrices.id,
        packagePrice: schema.examTypePackagePrices.price,
        packageDiscountPercent: schema.examTypePackagePrices.discountPercent,
        packageDurationMonths: schema.examTypePackagePrices.durationMonths,
      })
      .from(schema.examTypes)
      .leftJoin(schema.examTypePackages, eq(schema.examTypePackages.examTypeId, schema.examTypes.id))
      .leftJoin(schema.examTypePackagePrices, eq(schema.examTypePackagePrices.packageId, schema.examTypePackages.id))
      .orderBy(desc(schema.examTypes.createdAt)),
    buildExamTypeCountMaps(),
  ])

  return rows.map<ExamTypeRow>((row) => ({
    ...row,
    description: row.description ?? null,
    logoUrl: row.logoUrl ?? null,
    coverUrl: row.coverUrl ?? null,
    packageId: row.packageId ?? null,
    packagePriceId: row.packagePriceId ?? null,
    packageIsActive: row.packageIsActive ?? true,
    packagePrice: row.packagePrice ?? 100000,
    packageDiscountPercent: row.packageDiscountPercent ?? 0,
    packageDurationMonths: row.packageDurationMonths ?? 1,
    practiceQuotaPerMonth: row.practiceQuotaPerMonth ?? -1,
    quizQuotaPerMonth: row.quizQuotaPerMonth ?? -1,
    tryoutQuotaPerMonth: row.tryoutQuotaPerMonth ?? -1,
    aiExplanationQuotaPerMonth: row.aiExplanationQuotaPerMonth ?? -1,
    premiumPracticesEnabled: row.premiumPracticesEnabled ?? true,
    premiumTryoutsEnabled: row.premiumTryoutsEnabled ?? true,
    rankingEnabled: row.rankingEnabled ?? true,
    countdownTitle: row.countdownTitle ?? null,
    countdownTargetAt: row.countdownTargetAt ?? null,
    registrationStartAt: row.registrationStartAt ?? null,
    registrationEndAt: row.registrationEndAt ?? null,
    examStartAt: row.examStartAt ?? null,
    examEndAt: row.examEndAt ?? null,
    announcementAt: row.announcementAt ?? null,
    informationContent: row.informationContent ?? null,
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
