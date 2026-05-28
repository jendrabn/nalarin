"use server"

import "server-only"

import { desc, eq } from "drizzle-orm"

import { db, schema } from "@/db"

import {
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
type PaymentGateway = (typeof paymentGatewayValues)[number]
type PaymentMethod = (typeof paymentMethodValues)[number]
type PaymentStatus = (typeof paymentStatusValues)[number]
type SubscriptionSource = (typeof subscriptionSourceValues)[number]
type SubscriptionStatus = (typeof subscriptionStatusValues)[number]
type TransactionSource = (typeof transactionSourceValues)[number]

export type AdminPaymentRow = {
  id: number
  subscriptionId: number | null
  userId: number
  userName: string
  userEmail: string
  userRole: UserRole
  userStatus: UserStatus
  avatarUrl: string | null
  examTypeId: number | null
  examTypeName: string | null
  examTypeSlug: string | null
  packageId: number | null
  packagePriceId: number | null
  amount: number
  voucherId: number | null
  voucherCodeSnapshot: string | null
  voucherNameSnapshot: string | null
  voucherDiscountPercent: number | null
  originalAmount: number | null
  discountAmount: number
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

export type AdminPaymentDetails = AdminPaymentRow & {
  rawPayload: Record<string, unknown> | null
  linkedSubscription: {
    id: number
    examTypeId: number | null
    status: SubscriptionStatus
    source: SubscriptionSource
    startsAt: Date
    endsAt: Date
    activatedByAdminId: number | null
    cancelledByAdminId: number | null
    cancelledAt: Date | null
  } | null
}

function normalizeNullableString(value: string | null) {
  return value ?? null
}

function normalizeNullablePayload(value: Record<string, unknown> | null) {
  return value ?? null
}

function selectPaymentColumns() {
  return {
    id: schema.payments.id,
    subscriptionId: schema.payments.subscriptionId,
    userId: schema.payments.userId,
    userName: schema.users.name,
    userEmail: schema.users.email,
    userRole: schema.users.role,
    userStatus: schema.users.status,
    avatarUrl: schema.users.avatarUrl,
    examTypeId: schema.payments.examTypeId,
    examTypeName: schema.examTypes.name,
    examTypeSlug: schema.examTypes.slug,
    packageId: schema.payments.packageId,
    packagePriceId: schema.payments.packagePriceId,
    amount: schema.payments.amount,
    voucherId: schema.payments.voucherId,
    voucherCodeSnapshot: schema.payments.voucherCodeSnapshot,
    voucherNameSnapshot: schema.payments.voucherNameSnapshot,
    voucherDiscountPercent: schema.payments.voucherDiscountPercent,
    originalAmount: schema.payments.originalAmount,
    discountAmount: schema.payments.discountAmount,
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
  } as const
}

function mapPaymentRow(row: {
  id: number
  subscriptionId: number | null
  userId: number
  userName: string
  userEmail: string
  userRole: UserRole
  userStatus: UserStatus
  avatarUrl: string | null
  examTypeId: number | null
  examTypeName: string | null
  examTypeSlug: string | null
  packageId: number | null
  packagePriceId: number | null
  amount: number
  voucherId: number | null
  voucherCodeSnapshot: string | null
  voucherNameSnapshot: string | null
  voucherDiscountPercent: number | null
  originalAmount: number | null
  discountAmount: number
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
}): AdminPaymentRow {
  return {
    ...row,
    avatarUrl: row.avatarUrl ?? null,
    gatewayOrderId: normalizeNullableString(row.gatewayOrderId),
    gatewayTransactionId: normalizeNullableString(row.gatewayTransactionId),
    paymentUrl: normalizeNullableString(row.paymentUrl),
    paidAt: row.paidAt ?? null,
    expiredAt: row.expiredAt ?? null,
    proofUrl: normalizeNullableString(row.proofUrl),
    notes: normalizeNullableString(row.notes),
  }
}

export async function getAdminPayments() {
  const rows = await db
    .select(selectPaymentColumns())
    .from(schema.payments)
    .innerJoin(schema.users, eq(schema.payments.userId, schema.users.id))
    .leftJoin(schema.examTypes, eq(schema.payments.examTypeId, schema.examTypes.id))
    .orderBy(desc(schema.payments.createdAt))

  return rows.map(mapPaymentRow)
}

export async function getAdminPaymentById(id: number) {
  const rows = await db
    .select({
      ...selectPaymentColumns(),
      rawPayload: schema.payments.rawPayload,
      linkedSubscriptionId: schema.subscriptions.id,
      linkedSubscriptionExamTypeId: schema.subscriptions.examTypeId,
      linkedSubscriptionStatus: schema.subscriptions.status,
      linkedSubscriptionSource: schema.subscriptions.source,
      linkedSubscriptionStartsAt: schema.subscriptions.startsAt,
      linkedSubscriptionEndsAt: schema.subscriptions.endsAt,
      linkedSubscriptionActivatedByAdminId: schema.subscriptions.activatedByAdminId,
      linkedSubscriptionCancelledByAdminId: schema.subscriptions.cancelledByAdminId,
      linkedSubscriptionCancelledAt: schema.subscriptions.cancelledAt,
    })
    .from(schema.payments)
    .innerJoin(schema.users, eq(schema.payments.userId, schema.users.id))
    .leftJoin(schema.examTypes, eq(schema.payments.examTypeId, schema.examTypes.id))
    .leftJoin(schema.subscriptions, eq(schema.payments.subscriptionId, schema.subscriptions.id))
    .where(eq(schema.payments.id, id))
    .limit(1)

  const row = rows[0]

  if (!row) {
    return null
  }

  return {
    ...mapPaymentRow(row),
    rawPayload: normalizeNullablePayload(row.rawPayload ?? null),
    linkedSubscription: row.linkedSubscriptionId
      ? {
          id: row.linkedSubscriptionId,
          examTypeId: row.linkedSubscriptionExamTypeId,
          status: row.linkedSubscriptionStatus as SubscriptionStatus,
          source: row.linkedSubscriptionSource as SubscriptionSource,
          startsAt: row.linkedSubscriptionStartsAt as Date,
          endsAt: row.linkedSubscriptionEndsAt as Date,
          activatedByAdminId: row.linkedSubscriptionActivatedByAdminId,
          cancelledByAdminId: row.linkedSubscriptionCancelledByAdminId,
          cancelledAt: row.linkedSubscriptionCancelledAt ?? null,
        }
      : null,
  } satisfies AdminPaymentDetails
}

export async function getPaymentByGatewayOrderId(orderId: string) {
  const rows = await db
    .select({
      ...selectPaymentColumns(),
      rawPayload: schema.payments.rawPayload,
      linkedSubscriptionId: schema.subscriptions.id,
      linkedSubscriptionExamTypeId: schema.subscriptions.examTypeId,
      linkedSubscriptionStatus: schema.subscriptions.status,
      linkedSubscriptionSource: schema.subscriptions.source,
      linkedSubscriptionStartsAt: schema.subscriptions.startsAt,
      linkedSubscriptionEndsAt: schema.subscriptions.endsAt,
      linkedSubscriptionActivatedByAdminId: schema.subscriptions.activatedByAdminId,
      linkedSubscriptionCancelledByAdminId: schema.subscriptions.cancelledByAdminId,
      linkedSubscriptionCancelledAt: schema.subscriptions.cancelledAt,
    })
    .from(schema.payments)
    .innerJoin(schema.users, eq(schema.payments.userId, schema.users.id))
    .leftJoin(schema.examTypes, eq(schema.payments.examTypeId, schema.examTypes.id))
    .leftJoin(schema.subscriptions, eq(schema.payments.subscriptionId, schema.subscriptions.id))
    .where(eq(schema.payments.gatewayOrderId, orderId))
    .limit(1)

  const row = rows[0]

  if (!row) {
    return null
  }

  return {
    ...mapPaymentRow(row),
    rawPayload: normalizeNullablePayload(row.rawPayload ?? null),
    linkedSubscription: row.linkedSubscriptionId
      ? {
          id: row.linkedSubscriptionId,
          examTypeId: row.linkedSubscriptionExamTypeId,
          status: row.linkedSubscriptionStatus as SubscriptionStatus,
          source: row.linkedSubscriptionSource as SubscriptionSource,
          startsAt: row.linkedSubscriptionStartsAt as Date,
          endsAt: row.linkedSubscriptionEndsAt as Date,
          activatedByAdminId: row.linkedSubscriptionActivatedByAdminId,
          cancelledByAdminId: row.linkedSubscriptionCancelledByAdminId,
          cancelledAt: row.linkedSubscriptionCancelledAt ?? null,
        }
      : null,
  } satisfies AdminPaymentDetails
}

