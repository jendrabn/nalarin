import "server-only"

import { and, desc, eq, gt, isNull, or } from "drizzle-orm"

import { PLAN_CONFIG, type PlanCode } from "@/config/plans"
import { db, schema } from "@/db"

import type { PremiumPendingPayment, PremiumSubscriptionSummary } from "../types"

type PaymentRow = {
  id: number
  planCode: PlanCode
  amount: number
  voucherId: number | null
  voucherCodeSnapshot: string | null
  voucherNameSnapshot: string | null
  voucherDiscountPercent: number | null
  originalAmount: number | null
  discountAmount: number
  status: "pending"
  gateway: "midtrans" | "manual"
  gatewayOrderId: string | null
  paymentUrl: string | null
  rawPayload: Record<string, unknown> | null
  expiredAt: Date | null
  createdAt: Date
}

export async function getPremiumSubscriptionState(userId: number) {
  const [currentSubscription, pendingPayment] = await Promise.all([
    getCurrentActiveSubscription(userId),
    getVisiblePendingPayment(userId),
  ])

  return {
    currentSubscription,
    pendingPayment,
  }
}

export async function getCurrentActiveSubscription(
  userId: number,
): Promise<PremiumSubscriptionSummary> {
  const now = new Date()
  const [subscription] = await db
    .select({
      id: schema.subscriptions.id,
      planCode: schema.subscriptions.planCode,
      startsAt: schema.subscriptions.startsAt,
      endsAt: schema.subscriptions.endsAt,
    })
    .from(schema.subscriptions)
    .where(
      and(
        eq(schema.subscriptions.userId, userId),
        eq(schema.subscriptions.status, "active"),
        gt(schema.subscriptions.endsAt, now),
      ),
    )
    .orderBy(desc(schema.subscriptions.startsAt))
    .limit(1)

  if (!subscription) {
    return null
  }

  return {
    id: subscription.id,
    planCode: subscription.planCode,
    planName: PLAN_CONFIG[subscription.planCode].name,
    startsAt: subscription.startsAt.toISOString(),
    endsAt: subscription.endsAt.toISOString(),
  }
}

export async function getVisiblePendingPayment(
  userId: number,
): Promise<PremiumPendingPayment> {
  const now = new Date()
  const [payment] = await db
    .select({
      id: schema.payments.id,
      planCode: schema.payments.planCode,
      amount: schema.payments.amount,
      voucherId: schema.payments.voucherId,
      voucherCodeSnapshot: schema.payments.voucherCodeSnapshot,
      voucherNameSnapshot: schema.payments.voucherNameSnapshot,
      voucherDiscountPercent: schema.payments.voucherDiscountPercent,
      originalAmount: schema.payments.originalAmount,
      discountAmount: schema.payments.discountAmount,
      status: schema.payments.status,
      gateway: schema.payments.gateway,
      gatewayOrderId: schema.payments.gatewayOrderId,
      paymentUrl: schema.payments.paymentUrl,
      rawPayload: schema.payments.rawPayload,
      expiredAt: schema.payments.expiredAt,
      createdAt: schema.payments.createdAt,
    })
    .from(schema.payments)
    .where(
      and(
        eq(schema.payments.userId, userId),
        eq(schema.payments.status, "pending"),
        or(isNull(schema.payments.expiredAt), gt(schema.payments.expiredAt, now)),
      ),
    )
    .orderBy(desc(schema.payments.createdAt))
    .limit(1)

  if (!payment || payment.status !== "pending") {
    return null
  }

  return mapPendingPayment(payment as PaymentRow)
}

export function mapPendingPayment(payment: PaymentRow): NonNullable<PremiumPendingPayment> {
  return {
    id: payment.id,
    planCode: payment.planCode,
    planName: PLAN_CONFIG[payment.planCode].name,
    amount: payment.amount,
    originalAmount: payment.originalAmount ?? payment.amount,
    discountAmount: payment.discountAmount,
    voucher:
      payment.voucherId &&
      payment.voucherCodeSnapshot &&
      payment.voucherNameSnapshot &&
      payment.voucherDiscountPercent
        ? {
            id: payment.voucherId,
            code: payment.voucherCodeSnapshot,
            name: payment.voucherNameSnapshot,
            discountPercent: payment.voucherDiscountPercent,
          }
        : null,
    status: "pending",
    gateway: payment.gateway,
    gatewayOrderId: payment.gatewayOrderId ?? null,
    paymentUrl: payment.paymentUrl ?? null,
    snapToken: readSnapToken(payment.rawPayload),
    expiredAt: payment.expiredAt ? payment.expiredAt.toISOString() : null,
    createdAt: payment.createdAt.toISOString(),
  }
}

export function readSnapToken(rawPayload: Record<string, unknown> | null) {
  if (!rawPayload) {
    return null
  }

  const snapToken = rawPayload.snapToken

  return typeof snapToken === "string" && snapToken.length > 0 ? snapToken : null
}
