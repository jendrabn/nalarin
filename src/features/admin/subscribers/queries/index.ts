"use server"

import "server-only"

import { desc, eq, inArray } from "drizzle-orm"

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

export type AdminSubscriptionRow = {
  id: number
  userId: number
  userName: string
  userEmail: string
  userRole: UserRole
  userStatus: UserStatus
  avatarUrl: string | null
  examTypeId: number | null
  examTypeName: string | null
  status: SubscriptionStatus
  source: SubscriptionSource
  startsAt: Date
  endsAt: Date
  activatedByAdminId: number | null
  cancelledByAdminId: number | null
  cancelledAt: Date | null
  cancellationReason: string | null
  paymentStatus: PaymentStatus | null
  paymentGateway: PaymentGateway | null
  paymentMethod: PaymentMethod | null
  paymentTransactionSource: TransactionSource | null
  gatewayOrderId: string | null
  paidAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export type AdminSubscriptionDetails = AdminSubscriptionRow & {
  paymentId: number | null
  paymentAmount: number | null
  gatewayTransactionId: string | null
  paymentUrl: string | null
  expiredAt: Date | null
  proofUrl: string | null
  notes: string | null
  rawPayload: Record<string, unknown> | null
  activatedByAdminName: string | null
  cancelledByAdminName: string | null
}

function normalizeNullableString(value: string | null) {
  return value ?? null
}

function normalizeNullablePayload(value: Record<string, unknown> | null) {
  return value ?? null
}

async function resolveAdminNames(adminIds: number[]) {
  if (adminIds.length === 0) {
    return new Map<number, string>()
  }

  const rows = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
    })
    .from(schema.users)
    .where(inArray(schema.users.id, adminIds))

  return new Map(rows.map((row) => [row.id, row.name]))
}

function selectSubscriptionColumns() {
  return {
    id: schema.subscriptions.id,
    userId: schema.subscriptions.userId,
    userName: schema.users.name,
    userEmail: schema.users.email,
    userRole: schema.users.role,
    userStatus: schema.users.status,
    avatarUrl: schema.users.avatarUrl,
    examTypeId: schema.subscriptions.examTypeId,
    examTypeName: schema.examTypes.name,
    status: schema.subscriptions.status,
    source: schema.subscriptions.source,
    startsAt: schema.subscriptions.startsAt,
    endsAt: schema.subscriptions.endsAt,
    activatedByAdminId: schema.subscriptions.activatedByAdminId,
    cancelledByAdminId: schema.subscriptions.cancelledByAdminId,
    cancelledAt: schema.subscriptions.cancelledAt,
    cancellationReason: schema.subscriptions.cancellationReason,
    paymentStatus: schema.payments.status,
    paymentGateway: schema.payments.gateway,
    paymentMethod: schema.payments.paymentMethod,
    paymentTransactionSource: schema.payments.transactionSource,
    gatewayOrderId: schema.payments.gatewayOrderId,
    paidAt: schema.payments.paidAt,
    createdAt: schema.subscriptions.createdAt,
    updatedAt: schema.subscriptions.updatedAt,
  } as const
}

function mapSubscriptionRow(row: {
  id: number
  userId: number
  userName: string
  userEmail: string
  userRole: UserRole
  userStatus: UserStatus
  avatarUrl: string | null
  examTypeId: number | null
  examTypeName: string | null
  status: SubscriptionStatus
  source: SubscriptionSource
  startsAt: Date
  endsAt: Date
  activatedByAdminId: number | null
  cancelledByAdminId: number | null
  cancelledAt: Date | null
  cancellationReason: string | null
  paymentStatus: PaymentStatus | null
  paymentGateway: PaymentGateway | null
  paymentMethod: PaymentMethod | null
  paymentTransactionSource: TransactionSource | null
  gatewayOrderId: string | null
  paidAt: Date | null
  createdAt: Date
  updatedAt: Date
}): AdminSubscriptionRow {
  return {
    ...row,
    avatarUrl: row.avatarUrl ?? null,
    cancelledAt: row.cancelledAt ?? null,
    cancellationReason: normalizeNullableString(row.cancellationReason),
    paymentStatus: row.paymentStatus ?? null,
    paymentGateway: row.paymentGateway ?? null,
    paymentMethod: row.paymentMethod ?? null,
    paymentTransactionSource: row.paymentTransactionSource ?? null,
    gatewayOrderId: normalizeNullableString(row.gatewayOrderId),
    paidAt: row.paidAt ?? null,
  }
}

export async function getAdminSubscriptions() {
  const rows = await db
    .select(selectSubscriptionColumns())
    .from(schema.subscriptions)
    .innerJoin(schema.users, eq(schema.subscriptions.userId, schema.users.id))
    .leftJoin(schema.examTypes, eq(schema.subscriptions.examTypeId, schema.examTypes.id))
    .leftJoin(schema.payments, eq(schema.payments.subscriptionId, schema.subscriptions.id))
    .orderBy(desc(schema.subscriptions.createdAt))

  return rows.map(mapSubscriptionRow)
}

export async function getAdminSubscriptionById(id: number) {
  const rows = await db
    .select({
      ...selectSubscriptionColumns(),
      paymentId: schema.payments.id,
      paymentAmount: schema.payments.amount,
      gatewayTransactionId: schema.payments.gatewayTransactionId,
      paymentUrl: schema.payments.paymentUrl,
      expiredAt: schema.payments.expiredAt,
      proofUrl: schema.payments.proofUrl,
      notes: schema.payments.notes,
      rawPayload: schema.payments.rawPayload,
    })
    .from(schema.subscriptions)
    .innerJoin(schema.users, eq(schema.subscriptions.userId, schema.users.id))
    .leftJoin(schema.examTypes, eq(schema.subscriptions.examTypeId, schema.examTypes.id))
    .leftJoin(schema.payments, eq(schema.payments.subscriptionId, schema.subscriptions.id))
    .where(eq(schema.subscriptions.id, id))
    .limit(1)

  const row = rows[0]

  if (!row) {
    return null
  }

  const adminIds = [
    row.activatedByAdminId,
    row.cancelledByAdminId,
  ].filter((adminId): adminId is number => typeof adminId === "number")
  const adminNameMap = await resolveAdminNames(adminIds)

  return {
    ...mapSubscriptionRow(row),
    paymentId: row.paymentId ?? null,
    paymentAmount: row.paymentAmount ?? null,
    gatewayTransactionId: normalizeNullableString(row.gatewayTransactionId),
    paymentUrl: normalizeNullableString(row.paymentUrl),
    expiredAt: row.expiredAt ?? null,
    proofUrl: normalizeNullableString(row.proofUrl),
    notes: normalizeNullableString(row.notes),
    rawPayload: normalizeNullablePayload(row.rawPayload ?? null),
    activatedByAdminName:
      row.activatedByAdminId !== null
        ? adminNameMap.get(row.activatedByAdminId) ?? null
        : null,
    cancelledByAdminName:
      row.cancelledByAdminId !== null
        ? adminNameMap.get(row.cancelledByAdminId) ?? null
        : null,
  } satisfies AdminSubscriptionDetails
}

export async function findActiveSubscriptionByUserId(userId: number) {
  const rows = await db
    .select({
      id: schema.subscriptions.id,
      examTypeId: schema.subscriptions.examTypeId,
      status: schema.subscriptions.status,
      endsAt: schema.subscriptions.endsAt,
    })
    .from(schema.subscriptions)
    .where(eq(schema.subscriptions.userId, userId))
    .orderBy(desc(schema.subscriptions.createdAt))

  return (
    rows.find(
      (row) => row.status === "active" && row.endsAt.getTime() > Date.now(),
    ) ?? null
  )
}

export async function getSubscriptionByUserId(userId: number) {
  const row = await db
    .select({
      id: schema.subscriptions.id,
      userId: schema.subscriptions.userId,
      examTypeId: schema.subscriptions.examTypeId,
      status: schema.subscriptions.status,
      source: schema.subscriptions.source,
      startsAt: schema.subscriptions.startsAt,
      endsAt: schema.subscriptions.endsAt,
      createdAt: schema.subscriptions.createdAt,
      updatedAt: schema.subscriptions.updatedAt,
    })
    .from(schema.subscriptions)
    .where(eq(schema.subscriptions.userId, userId))
    .orderBy(desc(schema.subscriptions.createdAt))
    .limit(1)

  return row[0] ?? null
}
