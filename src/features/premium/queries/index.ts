import "server-only"

import { and, desc, eq, gt, isNull, or } from "drizzle-orm"

import { db, schema } from "@/db"
import type { PackageBenefitSnapshot, PackagePricingSnapshot } from "@/lib/billing"

import type {
  PremiumPendingPayment,
  PremiumSubscriptionState,
  PremiumSubscriptionSummary,
} from "../types"

type PaymentRow = {
  id: number
  examTypeId: number | null
  examTypeSlug: string | null
  examTypeName: string | null
  packageId: number | null
  packagePriceId: number | null
  amount: number
  voucherId: number | null
  voucherCodeSnapshot: string | null
  voucherNameSnapshot: string | null
  voucherDiscountPercent: number | null
  originalAmount: number | null
  discountAmount: number
  packageSnapshot: PackageBenefitSnapshot | null
  pricingSnapshot: PackagePricingSnapshot | null
  status: "pending"
  gateway: "midtrans" | "manual"
  gatewayOrderId: string | null
  paymentUrl: string | null
  rawPayload: Record<string, unknown> | null
  expiredAt: Date | null
  createdAt: Date
}

export async function getPremiumSubscriptionState(
  userId: number,
): Promise<PremiumSubscriptionState> {
  const [currentSubscriptions, pendingPayments] = await Promise.all([
    getCurrentActiveSubscriptions(userId),
    getVisiblePendingPayments(userId),
  ])

  return {
    currentSubscriptions,
    pendingPayment: pendingPayments[0] ?? null,
    pendingPayments,
  }
}

export async function getCurrentActiveSubscriptions(
  userId: number,
): Promise<PremiumSubscriptionSummary[]> {
  const now = new Date()
  const rows = await db
    .select({
      id: schema.subscriptions.id,
      examTypeId: schema.subscriptions.examTypeId,
      examTypeSlug: schema.examTypes.slug,
      examTypeName: schema.examTypes.name,
      packageId: schema.subscriptions.packageId,
      packagePriceId: schema.subscriptions.packagePriceId,
      startsAt: schema.subscriptions.startsAt,
      endsAt: schema.subscriptions.endsAt,
    })
    .from(schema.subscriptions)
    .innerJoin(schema.examTypes, eq(schema.subscriptions.examTypeId, schema.examTypes.id))
    .where(
      and(
        eq(schema.subscriptions.userId, userId),
        eq(schema.subscriptions.status, "active"),
        gt(schema.subscriptions.endsAt, now),
      ),
    )
    .orderBy(desc(schema.subscriptions.endsAt))

  return rows.flatMap((subscription) => {
    if (
      subscription.examTypeId === null ||
      subscription.packageId === null ||
      subscription.packagePriceId === null
    ) {
      return []
    }

    return [{
      id: subscription.id,
      examTypeId: subscription.examTypeId,
      examTypeSlug: subscription.examTypeSlug,
      examTypeName: subscription.examTypeName,
      packageId: subscription.packageId,
      packagePriceId: subscription.packagePriceId,
      packageName: subscription.examTypeName,
      startsAt: subscription.startsAt.toISOString(),
      endsAt: subscription.endsAt.toISOString(),
    }]
  })
}

export async function getCurrentActiveSubscription(
  userId: number,
  examTypeId?: number,
): Promise<PremiumSubscriptionSummary | null> {
  const subscriptions = await getCurrentActiveSubscriptions(userId)

  if (examTypeId) {
    return subscriptions.find((subscription) => subscription.examTypeId === examTypeId) ?? null
  }

  return subscriptions[0] ?? null
}

export async function getUserPremiumExamTypeIds(userId: number) {
  const subscriptions = await getCurrentActiveSubscriptions(userId)
  return new Set(subscriptions.map((subscription) => subscription.examTypeId))
}

export async function getVisiblePendingPayment(
  userId: number,
): Promise<PremiumPendingPayment> {
  const payments = await getVisiblePendingPayments(userId)
  return payments[0] ?? null
}

export async function getVisiblePendingPayments(
  userId: number,
): Promise<Array<NonNullable<PremiumPendingPayment>>> {
  const now = new Date()
  const payments = await db
    .select({
      id: schema.payments.id,
      examTypeId: schema.payments.examTypeId,
      examTypeSlug: schema.examTypes.slug,
      examTypeName: schema.examTypes.name,
      packageId: schema.payments.packageId,
      packagePriceId: schema.payments.packagePriceId,
      amount: schema.payments.amount,
      voucherId: schema.payments.voucherId,
      voucherCodeSnapshot: schema.payments.voucherCodeSnapshot,
      voucherNameSnapshot: schema.payments.voucherNameSnapshot,
      voucherDiscountPercent: schema.payments.voucherDiscountPercent,
      originalAmount: schema.payments.originalAmount,
      discountAmount: schema.payments.discountAmount,
      packageSnapshot: schema.payments.packageSnapshot,
      pricingSnapshot: schema.payments.pricingSnapshot,
      status: schema.payments.status,
      gateway: schema.payments.gateway,
      gatewayOrderId: schema.payments.gatewayOrderId,
      paymentUrl: schema.payments.paymentUrl,
      rawPayload: schema.payments.rawPayload,
      expiredAt: schema.payments.expiredAt,
      createdAt: schema.payments.createdAt,
    })
    .from(schema.payments)
    .leftJoin(schema.examTypes, eq(schema.payments.examTypeId, schema.examTypes.id))
    .where(
      and(
        eq(schema.payments.userId, userId),
        eq(schema.payments.status, "pending"),
        or(isNull(schema.payments.expiredAt), gt(schema.payments.expiredAt, now)),
      ),
    )
    .orderBy(desc(schema.payments.createdAt))

  return payments
    .filter((payment): payment is PaymentRow => payment.status === "pending")
    .map(mapPendingPayment)
}

export function mapPendingPayment(payment: PaymentRow): NonNullable<PremiumPendingPayment> {
  const examTypeName = payment.examTypeName ?? "Paket Premium"

  return {
    id: payment.id,
    examTypeId: payment.examTypeId ?? 0,
    examTypeSlug: payment.examTypeSlug ?? "",
    examTypeName,
    packageId: payment.packageId ?? 0,
    packagePriceId: payment.packagePriceId ?? 0,
    packageName: examTypeName,
    amount: payment.amount,
    originalAmount: payment.originalAmount ?? payment.amount,
    discountAmount: payment.discountAmount,
    packageSnapshot: (payment.packageSnapshot as PackageBenefitSnapshot | null) ?? null,
    pricingSnapshot: (payment.pricingSnapshot as PackagePricingSnapshot | null) ?? null,
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
