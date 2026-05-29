import "server-only"

import { and, eq, sql } from "drizzle-orm"

import { db, schema } from "@/db"
import { getCurrentActiveSubscriptions } from "@/features/premium/queries"

function getMonthlyUsagePeriod(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")

  return `${year}-${month}-01`
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
    getCurrentActiveSubscriptions(userId),
    db
      .select({
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
      ),
  ])

  if (!user) {
    return null
  }

  const usage = usageRows[0]
  const activeNames = subscriptions.map((subscription) => subscription.examTypeName)
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
      subscription: subscriptions[0]
        ? {
            startsAt: subscriptions[0].startsAt,
            endsAt: subscriptions[0].endsAt,
          }
        : null,
      limits: {
        practiceSessionsPerMonth: null,
        quizSessionsPerMonth: null,
        tryoutSessionsPerMonth: null,
        aiExplanationsPerMonth: null,
      },
      usage: {
        period,
        practiceSessionsCount: Number(usage?.practiceSessionsCount ?? 0),
        quizSessionsCount: Number(usage?.quizSessionsCount ?? 0),
        tryoutSessionsCount: Number(usage?.tryoutSessionsCount ?? 0),
        aiExplanationSessionsCount: Number(usage?.aiExplanationSessionsCount ?? 0),
      },
    },
  }
}

export type AccountProfileData = NonNullable<
  Awaited<ReturnType<typeof getAccountProfile>>
>
