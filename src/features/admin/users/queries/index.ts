"use server"

import "server-only"

import { and, desc, eq, gt, isNull, sql } from "drizzle-orm"

import { db, schema } from "@/db"

import {
  genderValues,
  paymentGatewayValues,
  paymentMethodValues,
  paymentStatusValues,
  subscriptionSourceValues,
  subscriptionStatusValues,
  transactionSourceValues,
  userRoleValues,
  userStatusValues,
} from "@/db/schema"

type UserRole = (typeof userRoleValues)[number]
type UserStatus = (typeof userStatusValues)[number]
type UserGender = (typeof genderValues)[number]
type PaymentGateway = (typeof paymentGatewayValues)[number]
type PaymentMethod = (typeof paymentMethodValues)[number]
type PaymentStatus = (typeof paymentStatusValues)[number]
type SubscriptionSource = (typeof subscriptionSourceValues)[number]
type SubscriptionStatus = (typeof subscriptionStatusValues)[number]
type TransactionSource = (typeof transactionSourceValues)[number]

export type AdminUserSubscriptionSummary = {
  id: number
  examTypeId: number | null
  examTypeName: string | null
  packageName: string | null
  status: SubscriptionStatus
  source: SubscriptionSource
  startsAt: Date
  endsAt: Date
  activatedByAdminId: number | null
  cancelledByAdminId: number | null
  cancelledAt: Date | null
  cancellationReason: string | null
  createdAt: Date
  updatedAt: Date
}

export type AdminUserPaymentSummary = {
  id: number
  subscriptionId: number | null
  examTypeId: number | null
  examTypeName: string | null
  packageName: string | null
  amount: number
  status: PaymentStatus
  gateway: PaymentGateway
  paymentMethod: PaymentMethod | null
  transactionSource: TransactionSource
  gatewayOrderId: string | null
  gatewayTransactionId: string | null
  paymentUrl: string | null
  paidAt: Date | null
  expiredAt: Date | null
  proofUrl: string | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

export type AdminUserRow = {
  id: number
  name: string
  email: string
  avatarUrl: string | null
  role: UserRole
  status: UserStatus
  gender: UserGender | null
  phoneNumber: string | null
  emailVerifiedAt: Date | null
  activePackageName: string | null
  activeExamTypeName: string | null
  activeSubscriptionEndsAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export type AdminUserDetails = AdminUserRow & {
  googleId: string | null
  facebookId: string | null
  appleId: string | null
  activeSubscription: AdminUserSubscriptionSummary | null
  latestSubscription: AdminUserSubscriptionSummary | null
  latestPayment: AdminUserPaymentSummary | null
  sessionStats: {
    totalSessions: number
    activeSessions: number
    lastActiveAt: Date | null
  }
  usageStats: {
    practiceSessions: number
    tryoutSessions: number
    monthlyUsageRows: number
    progressSnapshots: number
  }
  contentStats: {
    blogPosts: number
  }
}

function normalizeNullableString(value: string | null) {
  return value ?? null
}

function buildSubscriptionSummary(
  subscription: {
    id: number
    examTypeId: number | null
    examTypeName: string | null
    packageName: string | null
    status: SubscriptionStatus
    source: SubscriptionSource
    startsAt: Date
    endsAt: Date
    activatedByAdminId: number | null
    cancelledByAdminId: number | null
    cancelledAt: Date | null
    cancellationReason: string | null
    createdAt: Date
    updatedAt: Date
  } | null,
): AdminUserSubscriptionSummary | null {
  if (!subscription) {
    return null
  }

  return {
    ...subscription,
    cancellationReason: normalizeNullableString(subscription.cancellationReason),
    cancelledAt: subscription.cancelledAt ?? null,
  }
}

function buildPaymentSummary(
  payment: {
    id: number
    subscriptionId: number | null
    examTypeId: number | null
    examTypeName: string | null
    packageName: string | null
    amount: number
    status: PaymentStatus
    gateway: PaymentGateway
    paymentMethod: PaymentMethod | null
    transactionSource: TransactionSource
    gatewayOrderId: string | null
    gatewayTransactionId: string | null
    paymentUrl: string | null
    paidAt: Date | null
    expiredAt: Date | null
    proofUrl: string | null
    notes: string | null
    createdAt: Date
    updatedAt: Date
  } | null,
): AdminUserPaymentSummary | null {
  if (!payment) {
    return null
  }

  return {
    ...payment,
    gatewayOrderId: normalizeNullableString(payment.gatewayOrderId),
    gatewayTransactionId: normalizeNullableString(payment.gatewayTransactionId),
    paymentUrl: normalizeNullableString(payment.paymentUrl),
    proofUrl: normalizeNullableString(payment.proofUrl),
    notes: normalizeNullableString(payment.notes),
  }
}

function getSubscriptionPackageLabel(subscription: AdminUserSubscriptionSummary | null) {
  if (!subscription) {
    return null
  }

  return subscription.examTypeName ?? subscription.packageName ?? null
}

export async function getAdminUsers() {
  const [users, activeSubscriptions] = await Promise.all([
    db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        avatarUrl: schema.users.avatarUrl,
        role: schema.users.role,
        status: schema.users.status,
        gender: schema.users.gender,
        phoneNumber: schema.users.phoneNumber,
        emailVerifiedAt: schema.users.emailVerifiedAt,
        createdAt: schema.users.createdAt,
        updatedAt: schema.users.updatedAt,
      })
      .from(schema.users)
      .orderBy(desc(schema.users.createdAt)),
    db
      .select({
        userId: schema.subscriptions.userId,
        id: schema.subscriptions.id,
        examTypeId: schema.subscriptions.examTypeId,
        examTypeName: schema.examTypes.name,
        packageName: sql<string | null>`null`,
        status: schema.subscriptions.status,
        source: schema.subscriptions.source,
        startsAt: schema.subscriptions.startsAt,
        endsAt: schema.subscriptions.endsAt,
        activatedByAdminId: schema.subscriptions.activatedByAdminId,
        cancelledByAdminId: schema.subscriptions.cancelledByAdminId,
        cancelledAt: schema.subscriptions.cancelledAt,
        cancellationReason: schema.subscriptions.cancellationReason,
        createdAt: schema.subscriptions.createdAt,
        updatedAt: schema.subscriptions.updatedAt,
      })
      .from(schema.subscriptions)
      .leftJoin(schema.examTypes, eq(schema.subscriptions.examTypeId, schema.examTypes.id))
      .leftJoin(
        schema.examTypePackages,
        eq(schema.subscriptions.packageId, schema.examTypePackages.id),
      )
      .where(eq(schema.subscriptions.status, "active"))
      .orderBy(desc(schema.subscriptions.endsAt)),
  ])

  const activeSubscriptionMap = new Map<number, AdminUserSubscriptionSummary>()

  for (const subscription of activeSubscriptions) {
    if (!activeSubscriptionMap.has(subscription.userId)) {
      const summary = buildSubscriptionSummary(subscription)

      if (summary) {
        activeSubscriptionMap.set(subscription.userId, summary)
      }
    }
  }

  return users.map<AdminUserRow>((user) => {
    const activeSubscription = activeSubscriptionMap.get(user.id) ?? null

    return {
      ...user,
      avatarUrl: user.avatarUrl ?? null,
      gender: user.gender ?? null,
      phoneNumber: user.phoneNumber ?? null,
      emailVerifiedAt: user.emailVerifiedAt ?? null,
      activePackageName: getSubscriptionPackageLabel(activeSubscription),
      activeExamTypeName: activeSubscription?.examTypeName ?? null,
      activeSubscriptionEndsAt: activeSubscription?.endsAt ?? null,
    }
  })
}

export async function getAdminUserById(id: number) {
  const userRows = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      avatarUrl: schema.users.avatarUrl,
      role: schema.users.role,
      status: schema.users.status,
      gender: schema.users.gender,
      phoneNumber: schema.users.phoneNumber,
      emailVerifiedAt: schema.users.emailVerifiedAt,
      googleId: schema.users.googleId,
      facebookId: schema.users.facebookId,
      appleId: schema.users.appleId,
      createdAt: schema.users.createdAt,
      updatedAt: schema.users.updatedAt,
    })
    .from(schema.users)
    .where(eq(schema.users.id, id))
    .limit(1)

  const user = userRows[0]

  if (!user) {
    return null
  }

  const now = new Date()

  const [
    subscriptions,
    latestPaymentRow,
    totalSessionRows,
    activeSessionRows,
    lastActiveRows,
    practiceSessionRows,
    tryoutSessionRows,
    monthlyUsageRows,
    progressSnapshotRows,
    authoredBlogPostRows,
  ] = await Promise.all([
    db
      .select({
        id: schema.subscriptions.id,
        examTypeId: schema.subscriptions.examTypeId,
        examTypeName: schema.examTypes.name,
        packageName: sql<string | null>`null`,
        status: schema.subscriptions.status,
        source: schema.subscriptions.source,
        startsAt: schema.subscriptions.startsAt,
        endsAt: schema.subscriptions.endsAt,
        activatedByAdminId: schema.subscriptions.activatedByAdminId,
        cancelledByAdminId: schema.subscriptions.cancelledByAdminId,
        cancelledAt: schema.subscriptions.cancelledAt,
        cancellationReason: schema.subscriptions.cancellationReason,
        createdAt: schema.subscriptions.createdAt,
        updatedAt: schema.subscriptions.updatedAt,
      })
      .from(schema.subscriptions)
      .leftJoin(schema.examTypes, eq(schema.subscriptions.examTypeId, schema.examTypes.id))
      .leftJoin(
        schema.examTypePackages,
        eq(schema.subscriptions.packageId, schema.examTypePackages.id),
      )
      .where(eq(schema.subscriptions.userId, id))
      .orderBy(desc(schema.subscriptions.createdAt)),
    db
      .select({
        id: schema.payments.id,
        subscriptionId: schema.payments.subscriptionId,
        examTypeId: schema.payments.examTypeId,
        examTypeName: schema.examTypes.name,
        packageName: sql<string | null>`null`,
        amount: schema.payments.amount,
        status: schema.payments.status,
        gateway: schema.payments.gateway,
        paymentMethod: schema.payments.paymentMethod,
        transactionSource: schema.payments.transactionSource,
        gatewayOrderId: schema.payments.gatewayOrderId,
        gatewayTransactionId: schema.payments.gatewayTransactionId,
        paymentUrl: schema.payments.paymentUrl,
        paidAt: schema.payments.paidAt,
        expiredAt: schema.payments.expiredAt,
        proofUrl: schema.payments.proofUrl,
        notes: schema.payments.notes,
        createdAt: schema.payments.createdAt,
        updatedAt: schema.payments.updatedAt,
      })
      .from(schema.payments)
      .leftJoin(schema.examTypes, eq(schema.payments.examTypeId, schema.examTypes.id))
      .leftJoin(
        schema.examTypePackages,
        eq(schema.payments.packageId, schema.examTypePackages.id),
      )
      .where(eq(schema.payments.userId, id))
      .orderBy(desc(schema.payments.createdAt))
      .limit(1),
    db
      .select({
        totalSessions: sql<number>`count(*)`,
      })
      .from(schema.userSessions)
      .where(eq(schema.userSessions.userId, id)),
    db
      .select({
        activeSessions: sql<number>`count(*)`,
      })
      .from(schema.userSessions)
      .where(
        and(
          eq(schema.userSessions.userId, id),
          isNull(schema.userSessions.revokedAt),
          gt(schema.userSessions.expiresAt, now),
        ),
      ),
    db
      .select({
        lastActiveAt: sql<Date | null>`max(${schema.userSessions.lastActiveAt})`,
      })
      .from(schema.userSessions)
      .where(eq(schema.userSessions.userId, id)),
    db
      .select({
        practiceSessions: sql<number>`count(*)`,
      })
      .from(schema.practiceSessions)
      .where(eq(schema.practiceSessions.userId, id)),
    db
      .select({
        tryoutSessions: sql<number>`count(*)`,
      })
      .from(schema.tryoutSessions)
      .where(eq(schema.tryoutSessions.userId, id)),
    db
      .select({
        monthlyUsageRows: sql<number>`count(*)`,
      })
      .from(schema.monthlyUsage)
      .where(eq(schema.monthlyUsage.userId, id)),
    db
      .select({
        progressSnapshots: sql<number>`count(*)`,
      })
      .from(schema.userProgressSnapshots)
      .where(eq(schema.userProgressSnapshots.userId, id)),
    db
      .select({
        blogPosts: sql<number>`count(*)`,
      })
      .from(schema.blogPosts)
      .where(eq(schema.blogPosts.authorId, id)),
  ])

  const latestSubscription = subscriptions[0] ?? null
  const activeSubscription =
    subscriptions.find((subscription) => subscription.status === "active") ?? null

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl ?? null,
    role: user.role,
    status: user.status,
    gender: user.gender ?? null,
    phoneNumber: user.phoneNumber ?? null,
    emailVerifiedAt: user.emailVerifiedAt ?? null,
    googleId: user.googleId ?? null,
    facebookId: user.facebookId ?? null,
    appleId: user.appleId ?? null,
    activePackageName: getSubscriptionPackageLabel(buildSubscriptionSummary(activeSubscription)),
    activeExamTypeName: activeSubscription?.examTypeName ?? null,
    activeSubscriptionEndsAt: activeSubscription?.endsAt ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    activeSubscription: buildSubscriptionSummary(activeSubscription),
    latestSubscription: buildSubscriptionSummary(latestSubscription),
    latestPayment: buildPaymentSummary(latestPaymentRow[0] ?? null),
    sessionStats: {
      totalSessions: Number(totalSessionRows[0]?.totalSessions ?? 0),
      activeSessions: Number(activeSessionRows[0]?.activeSessions ?? 0),
      lastActiveAt: lastActiveRows[0]?.lastActiveAt ?? null,
    },
    usageStats: {
      practiceSessions: Number(practiceSessionRows[0]?.practiceSessions ?? 0),
      tryoutSessions: Number(tryoutSessionRows[0]?.tryoutSessions ?? 0),
      monthlyUsageRows: Number(monthlyUsageRows[0]?.monthlyUsageRows ?? 0),
      progressSnapshots: Number(progressSnapshotRows[0]?.progressSnapshots ?? 0),
    },
    contentStats: {
      blogPosts: Number(authoredBlogPostRows[0]?.blogPosts ?? 0),
    },
  } satisfies AdminUserDetails
}
