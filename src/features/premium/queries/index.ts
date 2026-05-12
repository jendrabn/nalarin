import "server-only"

import { and, desc, eq, gt, isNull, or } from "drizzle-orm"

import { PLAN_CONFIG, type PlanCode } from "@/config/plans"
import { db, schema } from "@/db"

import type { PremiumPendingPayment, PremiumSubscriptionSummary } from "../types"

type PaymentRow = {
  id: number
  planCode: PlanCode
  amount: number
  status: "pending"
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
      status: schema.payments.status,
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
    status: "pending",
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
