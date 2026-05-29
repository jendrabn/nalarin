"use server"

import { revalidatePath } from "next/cache"
import { inArray } from "drizzle-orm"

import { db, schema } from "@/db"
import { requireAdmin } from "@/features/auth/services/session"

import { getAdminPaymentById } from "../queries"
import { activatePaymentSubscription } from "../services/payment-workflow"

type ActionError = {
  success: false
  message: string
  fieldErrors?: Record<string, string[]>
}

type ActionSuccess<T = unknown> = {
  success: true
  data: T
}

export type PaymentActionResult<T = unknown> = ActionError | ActionSuccess<T>

function revalidatePaymentRoutes(paymentId?: number, userId?: number, subscriptionId?: number) {
  revalidatePath("/admin/payments")
  revalidatePath("/admin/subscribers")

  if (paymentId) {
    revalidatePath(`/admin/payments/${paymentId}`)
  }

  if (subscriptionId) {
    revalidatePath(`/admin/subscribers/${subscriptionId}`)
  }

  if (userId) {
    revalidatePath(`/admin/users/${userId}`)
    revalidatePath(`/admin/users/${userId}/edit`)
  }
}

export async function approveManualPaymentAction(
  paymentId: number,
): Promise<PaymentActionResult<{ id: number; subscriptionId: number | null }>> {
  const admin = await requireAdmin()
  const payment = await getAdminPaymentById(paymentId)

  if (!payment) {
    return {
      success: false,
      message: "Payment not found.",
    }
  }

  if (payment.gateway !== "manual" && payment.gateway !== "midtrans") {
    return {
      success: false,
      message: "Only manual or Midtrans payments can be approved.",
    }
  }

  if (payment.status !== "pending") {
    return {
      success: false,
      message: "Only pending payments can be approved.",
    }
  }

  const result = await activatePaymentSubscription(payment, {
    mode: "manual",
    adminId: admin.id,
    paidAt: new Date(),
    paymentMethod: payment.paymentMethod ?? "manual_transfer",
    allowAttachToExistingActiveSubscription: false,
  })

  if (!result.success) {
    return result
  }

  revalidatePaymentRoutes(payment.id, payment.userId, result.data.subscriptionId ?? undefined)

  return {
    success: true,
    data: {
      id: payment.id,
      subscriptionId: result.data.subscriptionId,
    },
  }
}

export async function deletePaymentsAction(
  paymentIds: number[],
): Promise<PaymentActionResult<{ deletedCount: number }>> {
  await requireAdmin()

  const uniquePaymentIds = [...new Set(paymentIds)].filter(
    (id) => Number.isInteger(id) && id > 0,
  )

  if (uniquePaymentIds.length === 0) {
    return {
      success: false,
      message: "No payments were selected.",
    }
  }

  const existingPayments = await db
    .select({
      id: schema.payments.id,
      userId: schema.payments.userId,
      subscriptionId: schema.payments.subscriptionId,
    })
    .from(schema.payments)
    .where(inArray(schema.payments.id, uniquePaymentIds))

  if (existingPayments.length !== uniquePaymentIds.length) {
    return {
      success: false,
      message: "Some selected payments were not found.",
    }
  }

  const affectedUserIds = [...new Set(existingPayments.map((row) => row.userId))]
  const affectedSubscriptionIds = [
    ...new Set(
      existingPayments
        .map((row) => row.subscriptionId)
        .filter((subscriptionId): subscriptionId is number => subscriptionId !== null),
    ),
  ]

  await db
    .delete(schema.payments)
    .where(inArray(schema.payments.id, uniquePaymentIds))

  revalidatePaymentRoutes()
  uniquePaymentIds.forEach((paymentId) => {
    revalidatePaymentRoutes(paymentId)
  })
  affectedSubscriptionIds.forEach((subscriptionId) => {
    revalidatePaymentRoutes(undefined, undefined, subscriptionId)
  })
  affectedUserIds.forEach((userId) => {
    revalidatePaymentRoutes(undefined, userId)
  })

  return {
    success: true,
    data: { deletedCount: uniquePaymentIds.length },
  }
}
