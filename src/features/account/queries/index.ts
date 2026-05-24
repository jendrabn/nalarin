import "server-only"

import { and, eq } from "drizzle-orm"

import { PLAN_CONFIG, type PlanCode } from "@/config/plans"
import { db, schema } from "@/db"
import { getCurrentActiveSubscription } from "@/features/premium/queries"

function getMonthlyUsagePeriod(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")

  return `${year}-${month}-01`
}

export async function getAccountProfile(userId: number) {
  const period = getMonthlyUsagePeriod()
  const [user, subscription, usage] = await Promise.all([
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
    getCurrentActiveSubscription(userId),
    db.query.monthlyUsage.findFirst({
      where: and(
        eq(schema.monthlyUsage.userId, userId),
        eq(schema.monthlyUsage.period, period),
      ),
      columns: {
        practiceSessionsCount: true,
        quizSessionsCount: true,
        tryoutSessionsCount: true,
        aiExplanationSessionsCount: true,
      },
    }),
  ])

  if (!user) {
    return null
  }

  const planCode = subscription?.planCode ?? ("free" satisfies PlanCode)
  const plan = PLAN_CONFIG[planCode]

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
      code: planCode,
      name: plan.name,
      description: plan.description,
      subscription: subscription
        ? {
            startsAt: subscription.startsAt,
            endsAt: subscription.endsAt,
          }
        : null,
      limits: plan.limits,
      usage: {
        period,
        practiceSessionsCount: usage?.practiceSessionsCount ?? 0,
        quizSessionsCount: usage?.quizSessionsCount ?? 0,
        tryoutSessionsCount: usage?.tryoutSessionsCount ?? 0,
        aiExplanationSessionsCount: usage?.aiExplanationSessionsCount ?? 0,
      },
    },
  }
}

export type AccountProfileData = NonNullable<
  Awaited<ReturnType<typeof getAccountProfile>>
>
