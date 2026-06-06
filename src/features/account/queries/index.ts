import "server-only"

import { and, desc, eq, gt, sql } from "drizzle-orm"

import { db, schema } from "@/db"

function getMonthlyUsagePeriod(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")

  return `${year}-${month}-01`
}

function readSnapshotNumber(snapshot: Record<string, unknown> | null, key: string) {
  const value = snapshot?.[key]
  return typeof value === "number" ? value : null
}

export async function getAccountProfile(userId: number) {
  const period = getMonthlyUsagePeriod()
  const [user, subscriptions, usageRows] = await Promise.all([
    db.query.users.findFirst({
      where: eq(schema.users.id, userId),
      columns: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        phoneNumber: true,
        gender: true,
        birthDate: true,
        bio: true,
        emailVerifiedAt: true,
        createdAt: true,
      },
    }),
    db
      .select({
        id: schema.subscriptions.id,
        examTypeId: schema.subscriptions.examTypeId,
        examTypeSlug: schema.examTypes.slug,
        examTypeName: schema.examTypes.name,
        packageId: schema.subscriptions.packageId,
        packagePriceId: schema.subscriptions.packagePriceId,
        startsAt: schema.subscriptions.startsAt,
        endsAt: schema.subscriptions.endsAt,
        benefitSnapshot: schema.subscriptions.benefitSnapshot,
        practiceQuotaPerMonth: schema.examTypePackages.practiceQuotaPerMonth,
        quizQuotaPerMonth: schema.examTypePackages.quizQuotaPerMonth,
        tryoutQuotaPerMonth: schema.examTypePackages.tryoutQuotaPerMonth,
        aiExplanationQuotaPerMonth:
          schema.examTypePackages.aiExplanationQuotaPerMonth,
      })
      .from(schema.subscriptions)
      .innerJoin(
        schema.examTypes,
        eq(schema.subscriptions.examTypeId, schema.examTypes.id),
      )
      .leftJoin(
        schema.examTypePackages,
        eq(schema.subscriptions.packageId, schema.examTypePackages.id),
      )
      .where(
        and(
          eq(schema.subscriptions.userId, userId),
          eq(schema.subscriptions.status, "active"),
          gt(schema.subscriptions.endsAt, new Date()),
        ),
      )
      .orderBy(desc(schema.subscriptions.endsAt)),
    db
      .select({
        examTypeId: schema.monthlyUsage.examTypeId,
        practiceSessionsCount: sql<number>`coalesce(sum(${schema.monthlyUsage.practiceSessionsCount}), 0)`,
        quizSessionsCount: sql<number>`coalesce(sum(${schema.monthlyUsage.quizSessionsCount}), 0)`,
        tryoutSessionsCount: sql<number>`coalesce(sum(${schema.monthlyUsage.tryoutSessionsCount}), 0)`,
        aiExplanationSessionsCount: sql<number>`coalesce(sum(${schema.monthlyUsage.aiExplanationSessionsCount}), 0)`,
      })
      .from(schema.monthlyUsage)
      .where(
        and(
          eq(schema.monthlyUsage.userId, userId),
          eq(schema.monthlyUsage.period, period),
        ),
      )
      .groupBy(schema.monthlyUsage.examTypeId),
  ])

  if (!user) {
    return null
  }

  const usageByExamType = new Map(
    usageRows.flatMap((usage) =>
      usage.examTypeId === null
        ? []
        : [
            [
              usage.examTypeId,
              {
                practiceSessionsCount: Number(
                  usage.practiceSessionsCount ?? 0,
                ),
                quizSessionsCount: Number(usage.quizSessionsCount ?? 0),
                tryoutSessionsCount: Number(usage.tryoutSessionsCount ?? 0),
                aiExplanationSessionsCount: Number(
                  usage.aiExplanationSessionsCount ?? 0,
                ),
              },
            ] as const,
          ],
    ),
  )
  const activeSubscriptions = subscriptions.flatMap((subscription) => {
    if (
      subscription.examTypeId === null ||
      subscription.packageId === null ||
      subscription.packagePriceId === null
    ) {
      return []
    }

    const benefitSnapshot =
      (subscription.benefitSnapshot as Record<string, unknown> | null) ?? null
    const usage = usageByExamType.get(subscription.examTypeId)

    return [
      {
        id: subscription.id,
        examTypeId: subscription.examTypeId,
        examTypeSlug: subscription.examTypeSlug,
        examTypeName: subscription.examTypeName,
        packageId: subscription.packageId,
        packagePriceId: subscription.packagePriceId,
        packageName: subscription.examTypeName,
        startsAt: subscription.startsAt.toISOString(),
        endsAt: subscription.endsAt.toISOString(),
        limits: {
          practiceSessionsPerMonth:
            readSnapshotNumber(benefitSnapshot, "practiceQuotaPerMonth") ??
            subscription.practiceQuotaPerMonth ??
            -1,
          quizSessionsPerMonth:
            readSnapshotNumber(benefitSnapshot, "quizQuotaPerMonth") ??
            subscription.quizQuotaPerMonth ??
            -1,
          tryoutSessionsPerMonth:
            readSnapshotNumber(benefitSnapshot, "tryoutQuotaPerMonth") ??
            subscription.tryoutQuotaPerMonth ??
            -1,
          aiExplanationsPerMonth:
            readSnapshotNumber(benefitSnapshot, "aiExplanationQuotaPerMonth") ??
            subscription.aiExplanationQuotaPerMonth ??
            -1,
        },
        usage: {
          period,
          practiceSessionsCount: usage?.practiceSessionsCount ?? 0,
          quizSessionsCount: usage?.quizSessionsCount ?? 0,
          tryoutSessionsCount: usage?.tryoutSessionsCount ?? 0,
          aiExplanationSessionsCount:
            usage?.aiExplanationSessionsCount ?? 0,
        },
      },
    ]
  })
  const activeNames = activeSubscriptions.map(
    (subscription) => subscription.examTypeName,
  )
  const activeDescription =
    activeNames.length > 0
      ? `Paket aktif: ${activeNames.join(", ")}.`
      : "Belum ada paket exam type aktif. Konten non-premium tetap gratis."

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      phoneNumber: user.phoneNumber,
      gender: user.gender,
      birthDate: user.birthDate,
      bio: user.bio,
      emailVerifiedAt: user.emailVerifiedAt
        ? user.emailVerifiedAt.toISOString()
        : null,
      createdAt: user.createdAt.toISOString(),
    },
    plan: {
      code: activeNames.length > 0 ? "exam-type" : "none",
      name: activeNames.length > 0 ? "Premium" : "Belum Berlangganan",
      description: activeDescription,
      activeSubscriptions,
    },
  }
}

export type AccountProfileData = NonNullable<
  Awaited<ReturnType<typeof getAccountProfile>>
>
