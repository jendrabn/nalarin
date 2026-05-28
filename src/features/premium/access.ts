import "server-only"

import { and, eq, gt } from "drizzle-orm"

import { db, schema } from "@/db"

export type ExamTypeEntitlement = {
  examTypeId: number
  practiceQuotaPerMonth: number
  quizQuotaPerMonth: number
  tryoutQuotaPerMonth: number
  aiExplanationQuotaPerMonth: number
  premiumPracticesEnabled: boolean
  premiumTryoutsEnabled: boolean
  rankingEnabled: boolean
}

export async function getActiveExamTypeEntitlement(
  userId: number,
  examTypeId: number,
): Promise<ExamTypeEntitlement | null> {
  const now = new Date()
  const [subscription] = await db
    .select({
      examTypeId: schema.subscriptions.examTypeId,
      benefitSnapshot: schema.subscriptions.benefitSnapshot,
      practiceQuotaPerMonth: schema.examTypePackages.practiceQuotaPerMonth,
      quizQuotaPerMonth: schema.examTypePackages.quizQuotaPerMonth,
      tryoutQuotaPerMonth: schema.examTypePackages.tryoutQuotaPerMonth,
      aiExplanationQuotaPerMonth: schema.examTypePackages.aiExplanationQuotaPerMonth,
      premiumPracticesEnabled: schema.examTypePackages.premiumPracticesEnabled,
      premiumTryoutsEnabled: schema.examTypePackages.premiumTryoutsEnabled,
      rankingEnabled: schema.examTypePackages.rankingEnabled,
    })
    .from(schema.subscriptions)
    .leftJoin(
      schema.examTypePackages,
      eq(schema.subscriptions.packageId, schema.examTypePackages.id),
    )
    .where(
      and(
        eq(schema.subscriptions.userId, userId),
        eq(schema.subscriptions.examTypeId, examTypeId),
        eq(schema.subscriptions.status, "active"),
        gt(schema.subscriptions.endsAt, now),
      ),
    )
    .limit(1)

  if (!subscription || subscription.examTypeId === null) {
    return null
  }

  return {
    examTypeId: subscription.examTypeId,
    practiceQuotaPerMonth:
      readSnapshotNumber(subscription.benefitSnapshot, "practiceQuotaPerMonth") ??
      subscription.practiceQuotaPerMonth ??
      -1,
    quizQuotaPerMonth:
      readSnapshotNumber(subscription.benefitSnapshot, "quizQuotaPerMonth") ??
      subscription.quizQuotaPerMonth ??
      -1,
    tryoutQuotaPerMonth:
      readSnapshotNumber(subscription.benefitSnapshot, "tryoutQuotaPerMonth") ??
      subscription.tryoutQuotaPerMonth ??
      -1,
    aiExplanationQuotaPerMonth:
      readSnapshotNumber(subscription.benefitSnapshot, "aiExplanationQuotaPerMonth") ??
      subscription.aiExplanationQuotaPerMonth ??
      -1,
    premiumPracticesEnabled:
      readSnapshotBoolean(subscription.benefitSnapshot, "premiumPracticesEnabled") ??
      subscription.premiumPracticesEnabled ??
      true,
    premiumTryoutsEnabled:
      readSnapshotBoolean(subscription.benefitSnapshot, "premiumTryoutsEnabled") ??
      subscription.premiumTryoutsEnabled ??
      true,
    rankingEnabled:
      readSnapshotBoolean(subscription.benefitSnapshot, "rankingEnabled") ??
      subscription.rankingEnabled ??
      true,
  }
}

function readSnapshotNumber(snapshot: Record<string, unknown> | null, key: string) {
  const value = snapshot?.[key]
  return typeof value === "number" ? value : null
}

function readSnapshotBoolean(snapshot: Record<string, unknown> | null, key: string) {
  const value = snapshot?.[key]
  return typeof value === "boolean" ? value : null
}
