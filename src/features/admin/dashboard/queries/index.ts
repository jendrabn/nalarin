"use server"

import "server-only"

import { and, eq, gte, isNotNull, sql } from "drizzle-orm"

import { db, schema } from "@/db"
import {
  contentStatusValues,
  paymentGatewayValues,
  sessionStatusValues,
} from "@/db/schema"

import { formatMonthKey, getMonthBuckets } from "../utils/date"

type PaymentGateway = (typeof paymentGatewayValues)[number]
type SessionStatus = (typeof sessionStatusValues)[number]
type ContentStatus = (typeof contentStatusValues)[number]

export type AdminDashboardData = {
  generatedAt: string
  summary: {
    users: {
      total: number
      active: number
      inactive: number
      suspended: number
    }
    subscriptions: {
      freeUsers: number
      subscribedUsers: number
      activeSubscriptions: number
      activeExamTypes: number
    }
    payments: {
      pending: number
      pendingMidtrans: number
      pendingManual: number
      currentMonthRevenue: number
      currentMonthMidtrans: number
      currentMonthManual: number
    }
    practiceSessions: {
      total: number
      practiceMode: number
      quizMode: number
      inProgress: number
      graded: number
    }
    tryoutSessions: {
      total: number
      inProgress: number
      submitted: number
      graded: number
      cancelled: number
    }
    learning: {
      completionRate: number
      averageScore: number
      accuracy: number
      totalScore: number
      totalCorrect: number
      totalQuestions: number
      gradedSessions: number
      totalSessions: number
    }
    content: {
      questions: {
        total: number
        draft: number
        published: number
        archived: number
      }
      practices: {
        total: number
        draft: number
        published: number
        archived: number
      }
      tryouts: {
        total: number
        draft: number
        published: number
        archived: number
      }
    }
  }
  charts: {
    practiceActivity: Array<{
      period: string
      practice: number
      quiz: number
    }>
    tryoutParticipation: Array<{
      period: string
      inProgress: number
      submitted: number
      graded: number
      cancelled: number
    }>
    revenue: Array<{
      period: string
      midtrans: number
      manual: number
    }>
    subscriptionMix: Array<{
      key: string
      label: string
      value: number
    }>
    questionGrowth: Array<{
      period: string
      draft: number
      published: number
      archived: number
    }>
    completionRate: Array<{
      period: string
      completionRate: number
    }>
  }
}

type RevenueRow = {
  period: string
  gateway: PaymentGateway
  amount: number
}

type SessionPeriodRow = {
  period: string
  status: SessionStatus
  count: number
}

type ContentPeriodRow = {
  period: string
  status: ContentStatus
  count: number
}

type UsagePeriodRow = {
  period: string
  practice: number
  quiz: number
}

function toNumber(value: number | string | bigint | null | undefined) {
  return Number(value ?? 0)
}

function createSessionStatusMap() {
  return {
    pending: 0,
    in_progress: 0,
    submitted: 0,
    grading: 0,
    graded: 0,
    cancelled: 0,
  } satisfies Record<SessionStatus, number>
}

function createContentStatusMap() {
  return {
    draft: 0,
    published: 0,
    archived: 0,
  } satisfies Record<ContentStatus, number>
}

function createRevenueMap() {
  return {
    midtrans: 0,
    manual: 0,
  }
}

function createUsageMap() {
  return {
    practice: 0,
    quiz: 0,
  }
}

function getRowCount<Row extends Record<string, number | undefined>>(
  row: Row | undefined,
  key: keyof Row,
) {
  return toNumber(row?.[key])
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const months = getMonthBuckets(6)
  const monthStart = months[0]?.date ?? new Date()
  const monthStartKey = formatMonthKey(monthStart)

  const paymentMonthKey = sql<string>`date_format(${schema.payments.paidAt}, '%Y-%m-01')`
  const practiceMonthKey = sql<string>`date_format(${schema.practiceSessions.startedAt}, '%Y-%m-01')`
  const tryoutMonthKey = sql<string>`date_format(${schema.tryoutSessions.startedAt}, '%Y-%m-01')`
  const questionMonthKey = sql<string>`date_format(${schema.questions.createdAt}, '%Y-%m-01')`

  const [
    userSummaryRows,
    subscriptionRows,
    activeSubscriberRows,
    paymentSummaryRows,
    revenueRows,
    usageRows,
    practiceSummaryRows,
    practiceMonthRows,
    tryoutSummaryRows,
    tryoutMonthRows,
    questionSummaryRows,
    questionGrowthRows,
    practiceContentRows,
    tryoutContentRows,
  ] = await Promise.all([
    db
      .select({
        total: sql<number>`count(${schema.users.id})`,
        active: sql<number>`coalesce(sum(case when ${schema.users.status} = 'active' then 1 else 0 end), 0)`,
        inactive: sql<number>`coalesce(sum(case when ${schema.users.status} = 'inactive' then 1 else 0 end), 0)`,
        suspended: sql<number>`coalesce(sum(case when ${schema.users.status} = 'suspended' then 1 else 0 end), 0)`,
      })
      .from(schema.users),
    db
      .select({
        examTypeId: schema.subscriptions.examTypeId,
        examTypeName: schema.examTypes.name,
        count: sql<number>`count(${schema.subscriptions.id})`,
      })
      .from(schema.subscriptions)
      .leftJoin(schema.examTypes, eq(schema.subscriptions.examTypeId, schema.examTypes.id))
      .where(and(eq(schema.subscriptions.status, "active"), gte(schema.subscriptions.endsAt, new Date())))
      .groupBy(schema.subscriptions.examTypeId, schema.examTypes.name),
    db
      .select({
        count: sql<number>`count(distinct ${schema.subscriptions.userId})`,
      })
      .from(schema.subscriptions)
      .where(and(eq(schema.subscriptions.status, "active"), gte(schema.subscriptions.endsAt, new Date()))),
    db
      .select({
        pending: sql<number>`coalesce(sum(case when ${schema.payments.status} = 'pending' then 1 else 0 end), 0)`,
        pendingMidtrans: sql<number>`coalesce(sum(case when ${schema.payments.status} = 'pending' and ${schema.payments.gateway} = 'midtrans' then 1 else 0 end), 0)`,
        pendingManual: sql<number>`coalesce(sum(case when ${schema.payments.status} = 'pending' and ${schema.payments.gateway} = 'manual' then 1 else 0 end), 0)`,
      })
      .from(schema.payments),
    db
      .select({
        period: paymentMonthKey,
        gateway: schema.payments.gateway,
        amount: sql<number>`coalesce(sum(${schema.payments.amount}), 0)`,
      })
      .from(schema.payments)
      .where(
        and(
          eq(schema.payments.status, "paid"),
          isNotNull(schema.payments.paidAt),
          gte(schema.payments.paidAt, monthStart),
        ),
      )
      .groupBy(paymentMonthKey, schema.payments.gateway)
      .orderBy(paymentMonthKey),
    db
      .select({
        period: schema.monthlyUsage.period,
        practice: sql<number>`coalesce(sum(${schema.monthlyUsage.practiceSessionsCount}), 0)`,
        quiz: sql<number>`coalesce(sum(${schema.monthlyUsage.quizSessionsCount}), 0)`,
      })
      .from(schema.monthlyUsage)
      .where(gte(schema.monthlyUsage.period, monthStartKey))
      .groupBy(schema.monthlyUsage.period)
      .orderBy(schema.monthlyUsage.period),
    db
      .select({
        total: sql<number>`count(${schema.practiceSessions.id})`,
        practiceMode: sql<number>`coalesce(sum(case when ${schema.practiceSessions.mode} = 'practice' then 1 else 0 end), 0)`,
        quizMode: sql<number>`coalesce(sum(case when ${schema.practiceSessions.mode} = 'quiz' then 1 else 0 end), 0)`,
        inProgress: sql<number>`coalesce(sum(case when ${schema.practiceSessions.status} = 'in_progress' then 1 else 0 end), 0)`,
        graded: sql<number>`coalesce(sum(case when ${schema.practiceSessions.status} = 'graded' then 1 else 0 end), 0)`,
        totalScore: sql<number>`coalesce(sum(case when ${schema.practiceSessions.status} = 'graded' then ${schema.practiceSessions.totalScore} else 0 end), 0)`,
        totalCorrect: sql<number>`coalesce(sum(case when ${schema.practiceSessions.status} = 'graded' then ${schema.practiceSessions.totalCorrect} else 0 end), 0)`,
        totalQuestions: sql<number>`coalesce(sum(case when ${schema.practiceSessions.status} = 'graded' then ${schema.practiceSessions.totalQuestions} else 0 end), 0)`,
      })
      .from(schema.practiceSessions),
    db
      .select({
        period: practiceMonthKey,
        status: schema.practiceSessions.status,
        count: sql<number>`count(${schema.practiceSessions.id})`,
      })
      .from(schema.practiceSessions)
      .where(gte(schema.practiceSessions.startedAt, monthStart))
      .groupBy(practiceMonthKey, schema.practiceSessions.status)
      .orderBy(practiceMonthKey),
    db
      .select({
        total: sql<number>`count(${schema.tryoutSessions.id})`,
        inProgress: sql<number>`coalesce(sum(case when ${schema.tryoutSessions.status} = 'in_progress' then 1 else 0 end), 0)`,
        submitted: sql<number>`coalesce(sum(case when ${schema.tryoutSessions.status} = 'submitted' then 1 else 0 end), 0)`,
        graded: sql<number>`coalesce(sum(case when ${schema.tryoutSessions.status} = 'graded' then 1 else 0 end), 0)`,
        cancelled: sql<number>`coalesce(sum(case when ${schema.tryoutSessions.status} = 'cancelled' then 1 else 0 end), 0)`,
        totalScore: sql<number>`coalesce(sum(case when ${schema.tryoutSessions.status} = 'graded' then ${schema.tryoutSessions.totalScore} else 0 end), 0)`,
        totalCorrect: sql<number>`coalesce(sum(case when ${schema.tryoutSessions.status} = 'graded' then ${schema.tryoutSessions.totalCorrect} else 0 end), 0)`,
        totalQuestions: sql<number>`coalesce(sum(case when ${schema.tryoutSessions.status} = 'graded' then ${schema.tryoutSessions.totalQuestions} else 0 end), 0)`,
      })
      .from(schema.tryoutSessions),
    db
      .select({
        period: tryoutMonthKey,
        status: schema.tryoutSessions.status,
        count: sql<number>`count(${schema.tryoutSessions.id})`,
      })
      .from(schema.tryoutSessions)
      .where(gte(schema.tryoutSessions.startedAt, monthStart))
      .groupBy(tryoutMonthKey, schema.tryoutSessions.status)
      .orderBy(tryoutMonthKey),
    db
      .select({
        total: sql<number>`count(${schema.questions.id})`,
        draft: sql<number>`coalesce(sum(case when ${schema.questions.status} = 'draft' then 1 else 0 end), 0)`,
        published: sql<number>`coalesce(sum(case when ${schema.questions.status} = 'published' then 1 else 0 end), 0)`,
        archived: sql<number>`coalesce(sum(case when ${schema.questions.status} = 'archived' then 1 else 0 end), 0)`,
      })
      .from(schema.questions),
    db
      .select({
        period: questionMonthKey,
        status: schema.questions.status,
        count: sql<number>`count(${schema.questions.id})`,
      })
      .from(schema.questions)
      .where(gte(schema.questions.createdAt, monthStart))
      .groupBy(questionMonthKey, schema.questions.status)
      .orderBy(questionMonthKey),
    db
      .select({
        total: sql<number>`count(${schema.practices.id})`,
        draft: sql<number>`coalesce(sum(case when ${schema.practices.status} = 'draft' then 1 else 0 end), 0)`,
        published: sql<number>`coalesce(sum(case when ${schema.practices.status} = 'published' then 1 else 0 end), 0)`,
        archived: sql<number>`coalesce(sum(case when ${schema.practices.status} = 'archived' then 1 else 0 end), 0)`,
      })
      .from(schema.practices),
    db
      .select({
        total: sql<number>`count(${schema.tryouts.id})`,
        draft: sql<number>`coalesce(sum(case when ${schema.tryouts.status} = 'draft' then 1 else 0 end), 0)`,
        published: sql<number>`coalesce(sum(case when ${schema.tryouts.status} = 'published' then 1 else 0 end), 0)`,
        archived: sql<number>`coalesce(sum(case when ${schema.tryouts.status} = 'archived' then 1 else 0 end), 0)`,
      })
      .from(schema.tryouts),
  ])

  const userSummary = userSummaryRows[0]
  const subscriptionMix = subscriptionRows
    .filter((row) => row.examTypeId !== null)
    .map((row) => ({
      key: `exam-${row.examTypeId}`,
      label: row.examTypeName ?? "Unknown exam type",
      value: toNumber(row.count),
    }))
    .sort((a, b) => b.value - a.value)

  const totalActiveSubscriptions = subscriptionMix.reduce(
    (sum, item) => sum + item.value,
    0,
  )

  const usersTotal = toNumber(userSummary?.total)
  const subscribedUsers = toNumber(activeSubscriberRows[0]?.count)
  const freeUsers = Math.max(usersTotal - subscribedUsers, 0)

  const paymentSummary = paymentSummaryRows[0]
  const revenueCounts = new Map<string, ReturnType<typeof createRevenueMap>>()
  for (const bucket of months) {
    revenueCounts.set(bucket.key, createRevenueMap())
  }
  for (const row of revenueRows as RevenueRow[]) {
    const current = revenueCounts.get(row.period)
    if (current) {
      current[row.gateway] = toNumber(row.amount)
    }
  }
  const revenue = months.map((bucket) => {
    const row = revenueCounts.get(bucket.key) ?? createRevenueMap()
    return {
      period: bucket.label,
      midtrans: row.midtrans,
      manual: row.manual,
    }
  })
  const currentMonthRevenue = revenue[revenue.length - 1] ?? {
    period: months.at(-1)?.label ?? "",
    midtrans: 0,
    manual: 0,
  }

  const usageCounts = new Map<string, ReturnType<typeof createUsageMap>>()
  for (const bucket of months) {
    usageCounts.set(bucket.key, createUsageMap())
  }
  for (const row of usageRows as UsagePeriodRow[]) {
    const current = usageCounts.get(row.period)
    if (current) {
      current.practice = toNumber(row.practice)
      current.quiz = toNumber(row.quiz)
    }
  }
  const practiceActivity = months.map((bucket) => {
    const row = usageCounts.get(bucket.key) ?? createUsageMap()
    return {
      period: bucket.label,
      practice: row.practice,
      quiz: row.quiz,
    }
  })

  const practiceStatusCounts = new Map<string, ReturnType<typeof createSessionStatusMap>>()
  for (const bucket of months) {
    practiceStatusCounts.set(bucket.key, createSessionStatusMap())
  }
  for (const row of practiceMonthRows as SessionPeriodRow[]) {
    const current = practiceStatusCounts.get(row.period)
    if (current) {
      current[row.status] = toNumber(row.count)
    }
  }
  const practiceCompletionByMonth = months.map((bucket) => {
    const row = practiceStatusCounts.get(bucket.key) ?? createSessionStatusMap()
    const total = Object.values(row).reduce((sum, value) => sum + value, 0)
    const graded = row.graded

    return {
      period: bucket.label,
      total,
      graded,
      completionRate: total > 0 ? (graded / total) * 100 : 0,
    }
  })

  const tryoutStatusCounts = new Map<string, ReturnType<typeof createSessionStatusMap>>()
  for (const bucket of months) {
    tryoutStatusCounts.set(bucket.key, createSessionStatusMap())
  }
  for (const row of tryoutMonthRows as SessionPeriodRow[]) {
    const current = tryoutStatusCounts.get(row.period)
    if (current) {
      current[row.status] = toNumber(row.count)
    }
  }
  const tryoutParticipation = months.map((bucket) => {
    const row = tryoutStatusCounts.get(bucket.key) ?? createSessionStatusMap()
    const total = Object.values(row).reduce((sum, value) => sum + value, 0)

    return {
      period: bucket.label,
      inProgress: row.in_progress,
      submitted: row.submitted,
      graded: row.graded,
      cancelled: row.cancelled,
      total,
    }
  })

  const completionRate = months.map((bucket) => {
    const practice = practiceCompletionByMonth.find((row) => row.period === bucket.label)
    const tryout = tryoutParticipation.find((row) => row.period === bucket.label)

    const total = (practice?.total ?? 0) + (tryout?.total ?? 0)
    const graded = (practice?.graded ?? 0) + (tryout?.graded ?? 0)

    return {
      period: bucket.label,
      completionRate: total > 0 ? (graded / total) * 100 : 0,
    }
  })

  const questionGrowthCounts = new Map<string, ReturnType<typeof createContentStatusMap>>()
  for (const bucket of months) {
    questionGrowthCounts.set(bucket.key, createContentStatusMap())
  }
  for (const row of questionGrowthRows as ContentPeriodRow[]) {
    const current = questionGrowthCounts.get(row.period)
    if (current) {
      current[row.status] = toNumber(row.count)
    }
  }
  const questionGrowth = months.map((bucket) => {
    const row = questionGrowthCounts.get(bucket.key) ?? createContentStatusMap()
    return {
      period: bucket.label,
      draft: row.draft,
      published: row.published,
      archived: row.archived,
    }
  })

  const questionsSummary = questionSummaryRows[0]
  const practicesSummary = practiceContentRows[0]
  const tryoutsSummary = tryoutContentRows[0]
  const practiceSummary = practiceSummaryRows[0]
  const tryoutSummary = tryoutSummaryRows[0]

  const totalSessions = toNumber(practiceSummary?.total) + toNumber(tryoutSummary?.total)
  const gradedSessions = toNumber(practiceSummary?.graded) + toNumber(tryoutSummary?.graded)
  const totalScore = toNumber(practiceSummary?.totalScore) + toNumber(tryoutSummary?.totalScore)
  const totalCorrect = toNumber(practiceSummary?.totalCorrect) + toNumber(tryoutSummary?.totalCorrect)
  const totalQuestions = toNumber(practiceSummary?.totalQuestions) + toNumber(tryoutSummary?.totalQuestions)

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      users: {
        total: usersTotal,
        active: getRowCount(userSummary, "active"),
        inactive: getRowCount(userSummary, "inactive"),
        suspended: getRowCount(userSummary, "suspended"),
      },
      subscriptions: {
        freeUsers,
        subscribedUsers,
        activeSubscriptions: totalActiveSubscriptions,
        activeExamTypes: subscriptionMix.length,
      },
      payments: {
        pending: getRowCount(paymentSummary, "pending"),
        pendingMidtrans: getRowCount(paymentSummary, "pendingMidtrans"),
        pendingManual: getRowCount(paymentSummary, "pendingManual"),
        currentMonthRevenue: currentMonthRevenue.midtrans + currentMonthRevenue.manual,
        currentMonthMidtrans: currentMonthRevenue.midtrans,
        currentMonthManual: currentMonthRevenue.manual,
      },
      practiceSessions: {
        total: getRowCount(practiceSummary, "total"),
        practiceMode: getRowCount(practiceSummary, "practiceMode"),
        quizMode: getRowCount(practiceSummary, "quizMode"),
        inProgress: getRowCount(practiceSummary, "inProgress"),
        graded: getRowCount(practiceSummary, "graded"),
      },
      tryoutSessions: {
        total: getRowCount(tryoutSummary, "total"),
        inProgress: getRowCount(tryoutSummary, "inProgress"),
        submitted: getRowCount(tryoutSummary, "submitted"),
        graded: getRowCount(tryoutSummary, "graded"),
        cancelled: getRowCount(tryoutSummary, "cancelled"),
      },
      learning: {
        completionRate: totalSessions > 0 ? (gradedSessions / totalSessions) * 100 : 0,
        averageScore: gradedSessions > 0 ? totalScore / gradedSessions : 0,
        accuracy: totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0,
        totalScore,
        totalCorrect,
        totalQuestions,
        gradedSessions,
        totalSessions,
      },
      content: {
        questions: {
          total: getRowCount(questionsSummary, "total"),
          draft: getRowCount(questionsSummary, "draft"),
          published: getRowCount(questionsSummary, "published"),
          archived: getRowCount(questionsSummary, "archived"),
        },
        practices: {
          total: getRowCount(practicesSummary, "total"),
          draft: getRowCount(practicesSummary, "draft"),
          published: getRowCount(practicesSummary, "published"),
          archived: getRowCount(practicesSummary, "archived"),
        },
        tryouts: {
          total: getRowCount(tryoutsSummary, "total"),
          draft: getRowCount(tryoutsSummary, "draft"),
          published: getRowCount(tryoutsSummary, "published"),
          archived: getRowCount(tryoutsSummary, "archived"),
        },
      },
    },
    charts: {
      practiceActivity,
      tryoutParticipation: tryoutParticipation.map((row) => ({
        period: row.period,
        inProgress: row.inProgress,
        submitted: row.submitted,
        graded: row.graded,
        cancelled: row.cancelled,
      })),
      revenue,
      subscriptionMix,
      questionGrowth,
      completionRate,
    },
  }
}
