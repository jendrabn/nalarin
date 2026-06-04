import "server-only"

import { and, desc, eq, gt } from "drizzle-orm"
import { revalidateTag } from "next/cache"

import { db, schema } from "@/db"
import { getPackageEndDate, getRenewalStartDate } from "@/lib/billing"
import { CACHE_TAGS } from "@/lib/cache-tags"
import { mapMidtransPaymentMethod, type MidtransNotificationPayload } from "@/lib/midtrans"

import type { AdminPaymentDetails } from "../queries"

export type PaymentActivationMode = "manual" | "midtrans"

export type PaymentActivationResult = {
  subscriptionId: number | null
  createdSubscription: boolean
  attachedExistingSubscription: boolean
}

type PaymentActivationOptions = {
  mode: PaymentActivationMode
  adminId?: number | null
  paidAt?: Date
  gatewayTransactionId?: string | null
  gatewayOrderId?: string | null
  paymentMethod?: "bank_transfer" | "e_wallet" | "qris" | "credit_card" | "convenience_store" | "manual_transfer" | "other" | null
  rawPayload?: Record<string, unknown> | null
  allowAttachToExistingActiveSubscription?: boolean
}

type ActivationTarget = Pick<
  AdminPaymentDetails,
  | "id"
  | "subscriptionId"
  | "userId"
  | "examTypeId"
  | "packageId"
  | "packagePriceId"
  | "voucherId"
  | "originalAmount"
  | "discountAmount"
  | "amount"
  | "status"
  | "gateway"
  | "paymentMethod"
  | "gatewayOrderId"
  | "gatewayTransactionId"
  | "rawPayload"
>

export async function activatePaymentSubscription(
  payment: ActivationTarget,
  options: PaymentActivationOptions,
): Promise<
  | { success: true; data: PaymentActivationResult }
  | { success: false; message: string }
> {
  const now = options.paidAt ?? new Date()

  if (payment.status === "cancelled" && options.mode === "midtrans") {
    return {
      success: true,
      data: {
        subscriptionId: payment.subscriptionId ?? null,
        createdSubscription: false,
        attachedExistingSubscription: false,
      },
    }
  }

  return db.transaction(async (tx) => {
    const [currentPayment] = await tx
      .select({
        id: schema.payments.id,
        subscriptionId: schema.payments.subscriptionId,
        userId: schema.payments.userId,
        examTypeId: schema.payments.examTypeId,
        packageId: schema.payments.packageId,
        packagePriceId: schema.payments.packagePriceId,
        voucherId: schema.payments.voucherId,
        originalAmount: schema.payments.originalAmount,
        discountAmount: schema.payments.discountAmount,
        amount: schema.payments.amount,
        status: schema.payments.status,
        gatewayTransactionId: schema.payments.gatewayTransactionId,
        gatewayOrderId: schema.payments.gatewayOrderId,
        paymentMethod: schema.payments.paymentMethod,
        packageSnapshot: schema.payments.packageSnapshot,
        pricingSnapshot: schema.payments.pricingSnapshot,
        rawPayload: schema.payments.rawPayload,
      })
      .from(schema.payments)
      .where(eq(schema.payments.id, payment.id))
      .limit(1)

    if (!currentPayment) {
      return {
        success: false as const,
        message: "Payment not found.",
      }
    }

    if (
      !currentPayment.examTypeId ||
      !currentPayment.packageId ||
      !currentPayment.packagePriceId
    ) {
      return {
        success: false as const,
        message: "Payment is missing exam type package data.",
      }
    }

    async function createRedemptionIfNeeded(): Promise<
      | { success: true }
      | { success: false; message: string }
    > {
      if (!currentPayment.voucherId || currentPayment.discountAmount <= 0) {
        return { success: true }
      }

      const [existingRedemption] = await tx
        .select({ id: schema.voucherRedemptions.id })
        .from(schema.voucherRedemptions)
        .where(eq(schema.voucherRedemptions.paymentId, currentPayment.id))
        .limit(1)

      if (existingRedemption) {
        return { success: true }
      }

      const [existingVoucherRedemption] = await tx
        .select({ id: schema.voucherRedemptions.id })
        .from(schema.voucherRedemptions)
        .where(eq(schema.voucherRedemptions.voucherId, currentPayment.voucherId))
        .limit(1)

      if (existingVoucherRedemption) {
        return {
          success: false,
          message: "Voucher has already been redeemed.",
        }
      }

      await tx.insert(schema.voucherRedemptions).values({
        voucherId: currentPayment.voucherId,
        userId: currentPayment.userId,
        paymentId: currentPayment.id,
        originalAmount: currentPayment.originalAmount ?? currentPayment.amount,
        discountAmount: currentPayment.discountAmount,
        finalAmount: currentPayment.amount,
        redeemedAt: now,
      })

      revalidateTag(CACHE_TAGS.voucherPromos, { expire: 0 })

      return { success: true }
    }

    const redemptionResult = await createRedemptionIfNeeded()

    if (!redemptionResult.success) {
      return redemptionResult
    }

    if (currentPayment.subscriptionId) {
      await tx
        .update(schema.payments)
        .set(getPaidPaymentUpdate(currentPayment, options, now))
        .where(eq(schema.payments.id, currentPayment.id))

      return {
        success: true as const,
        data: {
          subscriptionId: currentPayment.subscriptionId,
          createdSubscription: false,
          attachedExistingSubscription: false,
        },
      }
    }

    const [activeSubscription] = await tx
      .select({
        id: schema.subscriptions.id,
        endsAt: schema.subscriptions.endsAt,
      })
      .from(schema.subscriptions)
      .where(
        and(
          eq(schema.subscriptions.userId, currentPayment.userId),
          eq(schema.subscriptions.examTypeId, currentPayment.examTypeId),
          eq(schema.subscriptions.status, "active"),
          gt(schema.subscriptions.endsAt, now),
        ),
      )
      .orderBy(desc(schema.subscriptions.endsAt))
      .limit(1)

    const durationMonths = getDurationMonths(currentPayment.packageSnapshot)
    const startsAt = getRenewalStartDate(activeSubscription?.endsAt ?? null, now)
    const endsAt = getPackageEndDate(startsAt, durationMonths)

    if (activeSubscription) {
      if (!options.allowAttachToExistingActiveSubscription && options.mode !== "manual") {
        return {
          success: false as const,
          message: "User already has an active subscription for this exam type.",
        }
      }

      await tx
        .update(schema.subscriptions)
        .set({
          packageId: currentPayment.packageId,
          packagePriceId: currentPayment.packagePriceId,
          startsAt: now,
          endsAt,
          benefitSnapshot: currentPayment.packageSnapshot,
          pricingSnapshot: currentPayment.pricingSnapshot,
          activatedByAdminId: options.adminId ?? null,
          updatedAt: now,
        })
        .where(eq(schema.subscriptions.id, activeSubscription.id))

      await tx
        .update(schema.payments)
        .set({
          ...getPaidPaymentUpdate(currentPayment, options, now),
          subscriptionId: activeSubscription.id,
        })
        .where(eq(schema.payments.id, currentPayment.id))

      return {
        success: true as const,
        data: {
          subscriptionId: activeSubscription.id,
          createdSubscription: false,
          attachedExistingSubscription: true,
        },
      }
    }

    const [createdSubscription] = await tx
      .insert(schema.subscriptions)
      .values({
        userId: currentPayment.userId,
        examTypeId: currentPayment.examTypeId,
        packageId: currentPayment.packageId,
        packagePriceId: currentPayment.packagePriceId,
        status: "active",
        source: options.mode === "manual" ? "manual" : "midtrans",
        startsAt: now,
        endsAt,
        benefitSnapshot: currentPayment.packageSnapshot,
        pricingSnapshot: currentPayment.pricingSnapshot,
        activatedByAdminId: options.adminId ?? null,
      })
      .$returningId()

    await tx
      .update(schema.payments)
      .set({
        ...getPaidPaymentUpdate(currentPayment, options, now),
        subscriptionId: createdSubscription.id,
      })
      .where(eq(schema.payments.id, currentPayment.id))

    return {
      success: true as const,
      data: {
        subscriptionId: createdSubscription.id,
        createdSubscription: true,
        attachedExistingSubscription: false,
      },
    }
  })
}

function getPaidPaymentUpdate(
  currentPayment: {
    gatewayTransactionId: string | null
    gatewayOrderId: string | null
    paymentMethod: PaymentActivationOptions["paymentMethod"]
    rawPayload: Record<string, unknown> | null
  },
  options: PaymentActivationOptions,
  now: Date,
) {
  return {
    status: "paid" as const,
    paidAt: now,
    gatewayTransactionId:
      options.gatewayTransactionId ?? currentPayment.gatewayTransactionId,
    gatewayOrderId: options.gatewayOrderId ?? currentPayment.gatewayOrderId,
    paymentMethod: options.paymentMethod ?? currentPayment.paymentMethod,
    rawPayload: options.rawPayload ?? currentPayment.rawPayload,
    updatedAt: now,
  }
}

function getDurationMonths(snapshot: Record<string, unknown> | null) {
  const value = snapshot?.durationMonths

  return typeof value === "number" && Number.isInteger(value) && value > 0
    ? value
    : 1
}

export function resolveMidtransPaymentMethod(payload: MidtransNotificationPayload) {
  return mapMidtransPaymentMethod(payload.payment_type)
}
