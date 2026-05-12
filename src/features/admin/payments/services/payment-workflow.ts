import "server-only"

import { and, eq, gt } from "drizzle-orm"

import { db, schema } from "@/db"
import { getPlanEndDate, getPlanRank } from "@/lib/billing"
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
  | "planCode"
  | "status"
  | "gateway"
  | "paymentMethod"
  | "transactionSource"
  | "gatewayOrderId"
  | "gatewayTransactionId"
  | "paymentUrl"
  | "paidAt"
  | "expiredAt"
  | "proofUrl"
  | "notes"
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
    const currentPaymentRows = await tx
      .select({
        id: schema.payments.id,
        subscriptionId: schema.payments.subscriptionId,
        userId: schema.payments.userId,
        planCode: schema.payments.planCode,
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
        rawPayload: schema.payments.rawPayload,
      })
      .from(schema.payments)
      .where(eq(schema.payments.id, payment.id))
      .limit(1)

    const currentPayment = currentPaymentRows[0]

    if (!currentPayment) {
      return {
        success: false as const,
        message: "Payment not found.",
      }
    }

    if (currentPayment.subscriptionId) {
      await tx
        .update(schema.payments)
        .set({
          status: "paid",
          paidAt: now,
          gatewayTransactionId:
            options.gatewayTransactionId ?? currentPayment.gatewayTransactionId,
          gatewayOrderId: options.gatewayOrderId ?? currentPayment.gatewayOrderId,
          paymentMethod: options.paymentMethod ?? currentPayment.paymentMethod,
          rawPayload: options.rawPayload ?? currentPayment.rawPayload,
          updatedAt: now,
        })
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

    const activeSubscriptionRows = await tx
      .select({
        id: schema.subscriptions.id,
        planCode: schema.subscriptions.planCode,
        endsAt: schema.subscriptions.endsAt,
      })
      .from(schema.subscriptions)
      .where(
        and(
          eq(schema.subscriptions.userId, currentPayment.userId),
          eq(schema.subscriptions.status, "active"),
          gt(schema.subscriptions.endsAt, now),
        ),
      )
      .limit(1)

    const activeSubscription = activeSubscriptionRows[0] ?? null

    if (activeSubscription && !options.allowAttachToExistingActiveSubscription) {
      return {
        success: false as const,
        message: "User already has an active subscription.",
      }
    }

    const shouldReplaceSubscription =
      activeSubscription &&
      getPlanRank(currentPayment.planCode) > getPlanRank(activeSubscription.planCode)

    if (activeSubscription && !shouldReplaceSubscription) {
      await tx
        .update(schema.payments)
        .set({
          status: "paid",
          paidAt: now,
          gatewayTransactionId:
            options.gatewayTransactionId ?? currentPayment.gatewayTransactionId,
          gatewayOrderId: options.gatewayOrderId ?? currentPayment.gatewayOrderId,
          paymentMethod: options.paymentMethod ?? currentPayment.paymentMethod,
          rawPayload: options.rawPayload ?? currentPayment.rawPayload,
          updatedAt: now,
        })
        .where(eq(schema.payments.id, currentPayment.id))

      return {
        success: true as const,
        data: {
          subscriptionId: activeSubscription.id,
          createdSubscription: false,
          attachedExistingSubscription: false,
        },
      }
    }

    if (activeSubscription && shouldReplaceSubscription) {
      await tx
        .update(schema.subscriptions)
        .set({
          status: "expired",
          endsAt: now,
          updatedAt: now,
        })
        .where(eq(schema.subscriptions.id, activeSubscription.id))
    }

    const [createdSubscription] = await tx
      .insert(schema.subscriptions)
      .values({
        userId: currentPayment.userId,
        planCode: currentPayment.planCode,
        status: "active",
        source: options.mode === "manual" ? "manual" : "midtrans",
        startsAt: now,
        endsAt: getPlanEndDate(now, currentPayment.planCode),
        activatedByAdminId: options.adminId ?? null,
      })
      .$returningId()

    const targetSubscriptionId = createdSubscription.id

    await tx
      .update(schema.payments)
      .set({
        status: "paid",
        paidAt: now,
        subscriptionId: targetSubscriptionId,
        gatewayTransactionId:
          options.gatewayTransactionId ?? currentPayment.gatewayTransactionId,
        gatewayOrderId: options.gatewayOrderId ?? currentPayment.gatewayOrderId,
        paymentMethod: options.paymentMethod ?? currentPayment.paymentMethod,
        rawPayload: options.rawPayload ?? currentPayment.rawPayload,
        updatedAt: now,
      })
      .where(eq(schema.payments.id, currentPayment.id))

    return {
      success: true as const,
      data: {
        subscriptionId: targetSubscriptionId,
        createdSubscription: true,
        attachedExistingSubscription: false,
      },
    }
  })
}

export function resolveMidtransPaymentMethod(payload: MidtransNotificationPayload) {
  return mapMidtransPaymentMethod(payload.payment_type)
}
