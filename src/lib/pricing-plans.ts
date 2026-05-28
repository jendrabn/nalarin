import "server-only"

import { and, asc, eq } from "drizzle-orm"

import { db, schema } from "@/db"
import { getPackageFinalPrice, isUnlimitedQuota } from "@/lib/billing"

export type PricingPlanView = {
  priceId: number
  packageId: number
  examTypeId: number
  examTypeSlug: string
  examTypeName: string
  name: string
  description: string
  logoUrl: string | null
  coverUrl: string | null
  price: number
  finalPrice: number
  discountPercent: number
  durationMonths: number
  practiceQuotaPerMonth: number
  quizQuotaPerMonth: number
  tryoutQuotaPerMonth: number
  aiExplanationQuotaPerMonth: number
  rankingEnabled: boolean
  premiumPracticesEnabled: boolean
  premiumTryoutsEnabled: boolean
  bullets: string[]
}

export async function getPricingPlanViews(): Promise<PricingPlanView[]> {
  const rows = await db
    .select({
      priceId: schema.examTypePackagePrices.id,
      packageId: schema.examTypePackages.id,
      examTypeId: schema.examTypes.id,
      examTypeSlug: schema.examTypes.slug,
      examTypeName: schema.examTypes.name,
      description: schema.examTypes.description,
      logoUrl: schema.examTypes.logoUrl,
      coverUrl: schema.examTypes.coverUrl,
      price: schema.examTypePackagePrices.price,
      discountPercent: schema.examTypePackagePrices.discountPercent,
      durationMonths: schema.examTypePackagePrices.durationMonths,
      practiceQuotaPerMonth: schema.examTypePackages.practiceQuotaPerMonth,
      quizQuotaPerMonth: schema.examTypePackages.quizQuotaPerMonth,
      tryoutQuotaPerMonth: schema.examTypePackages.tryoutQuotaPerMonth,
      aiExplanationQuotaPerMonth: schema.examTypePackages.aiExplanationQuotaPerMonth,
      rankingEnabled: schema.examTypePackages.rankingEnabled,
      premiumPracticesEnabled: schema.examTypePackages.premiumPracticesEnabled,
      premiumTryoutsEnabled: schema.examTypePackages.premiumTryoutsEnabled,
    })
    .from(schema.examTypePackagePrices)
    .innerJoin(
      schema.examTypePackages,
      eq(schema.examTypePackagePrices.packageId, schema.examTypePackages.id),
    )
    .innerJoin(schema.examTypes, eq(schema.examTypePackages.examTypeId, schema.examTypes.id))
    .where(
      and(
        eq(schema.examTypePackages.isActive, true),
        eq(schema.examTypePackagePrices.isActive, true),
      ),
    )
    .orderBy(asc(schema.examTypes.id), asc(schema.examTypePackagePrices.durationMonths))

  return rows.map((row) => {
    const finalPrice = getPackageFinalPrice(row.price, row.discountPercent)
    const plan: PricingPlanView = {
      priceId: row.priceId,
      packageId: row.packageId,
      examTypeId: row.examTypeId,
      examTypeSlug: row.examTypeSlug,
      examTypeName: row.examTypeName,
      name: row.examTypeName,
      description:
        row.description ??
        `Akses premium ${row.examTypeName} untuk latihan, tryout, ranking, dan pembahasan AI.`,
      logoUrl: row.logoUrl ?? null,
      coverUrl: row.coverUrl ?? null,
      price: row.price,
      finalPrice,
      discountPercent: row.discountPercent,
      durationMonths: row.durationMonths,
      practiceQuotaPerMonth: row.practiceQuotaPerMonth,
      quizQuotaPerMonth: row.quizQuotaPerMonth,
      tryoutQuotaPerMonth: row.tryoutQuotaPerMonth,
      aiExplanationQuotaPerMonth: row.aiExplanationQuotaPerMonth,
      rankingEnabled: row.rankingEnabled,
      premiumPracticesEnabled: row.premiumPracticesEnabled,
      premiumTryoutsEnabled: row.premiumTryoutsEnabled,
      bullets: [],
    }

    return {
      ...plan,
      bullets: getPackageBullets(plan),
    }
  })
}

function getPackageBullets(plan: PricingPlanView) {
  const bullets = [
    "Konten non-premium tetap gratis",
    formatQuota(plan.practiceQuotaPerMonth, "sesi latihan premium"),
    formatQuota(plan.quizQuotaPerMonth, "mode quiz"),
    formatQuota(plan.tryoutQuotaPerMonth, "tryout premium"),
    formatQuota(plan.aiExplanationQuotaPerMonth, "pembahasan AI"),
  ]

  if (plan.rankingEnabled) {
    bullets.push("Ranking tryout")
  }

  return bullets
}

function formatQuota(limit: number, label: string) {
  if (isUnlimitedQuota(limit)) {
    return `${capitalize(label)} tanpa batas`
  }

  return `${limit} ${label} per bulan`
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
