"use server"

import { revalidatePath } from "next/cache"
import { and, desc, eq, gt, inArray } from "drizzle-orm"

import { db, schema } from "@/db"
import { requireAdmin } from "@/features/auth/services/session"
import { getPlanEndDate, getPlanFinalPrice } from "@/lib/billing"
import { flattenZodError } from "@/lib/actions"

import { getAdminPaymentById } from "../queries"
import {
  manualSubscriptionFormSchema,
  type ManualSubscriptionFormValues,
} from "../schemas"
import { activatePaymentSubscription } from "../services/payment-workflow"

type ActionError = {
  success: false
  message: string
  fieldErrors?: Partial<Record<keyof ManualSubscriptionFormValues, string[]>>
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

function parseManualSubscriptionValues(values: ManualSubscriptionFormValues) {
  const validated = manualSubscriptionFormSchema.safeParse(values)

  if (!validated.success) {
    return {
      success: false as const,
      message: "Please fix the highlighted fields.",
      fieldErrors: flattenZodError(validated.error),
    }
  }

  const userId = Number(validated.data.userId)

  if (!Number.isInteger(userId) || userId <= 0) {
    return {
      success: false as const,
      message: "Please select a valid user.",
      fieldErrors: {
        userId: ["The selected user is invalid."],
      },
    }
  }

  return {
    success: true as const,
    data: {
      userId,
      planCode: validated.data.planCode,
    },
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

  if (payment.gateway !== "manual") {
    return {
      success: false,
      message: "Only manual payments can be approved manually.",
    }
  }

  if (payment.status !== "pending") {
    return {
      success: false,
      message: "Only pending manual payments can be approved.",
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

export async function createManualSubscriptionAction(
  values: ManualSubscriptionFormValues,
): Promise<
  PaymentActionResult<{
    subscriptionId: number
    paymentId: number
    userId: number
    previousSubscriptionId: number | null
    action: "created" | "updated"
  }>
> {
  const admin = await requireAdmin()
  const parsed = parseManualSubscriptionValues(values)

  if (!parsed.success) {
    return parsed
  }

  const user = await db.query.users.findFirst({
    where: eq(schema.users.id, parsed.data.userId),
    columns: {
      id: true,
      name: true,
      email: true,
    },
  })

  if (!user) {
    return {
      success: false,
      message: "User not found.",
      fieldErrors: {
        userId: ["The selected user was not found."],
      },
    }
  }

  const now = new Date()

  const result = await db.transaction(async (tx) => {
    const activeSubscriptionRows = await tx
      .select({
        id: schema.subscriptions.id,
      })
      .from(schema.subscriptions)
      .where(
        and(
          eq(schema.subscriptions.userId, user.id),
          eq(schema.subscriptions.status, "active"),
          gt(schema.subscriptions.endsAt, now),
        ),
      )
      .orderBy(desc(schema.subscriptions.createdAt))
      .limit(1)

    const previousSubscriptionId = activeSubscriptionRows[0]?.id ?? null

    if (previousSubscriptionId) {
      await tx
        .update(schema.subscriptions)
        .set({
          planCode: parsed.data.planCode,
          status: "active",
          source: "admin_grant",
          startsAt: now,
          endsAt: getPlanEndDate(now, parsed.data.planCode),
          activatedByAdminId: admin.id,
          cancelledAt: null,
          cancelledByAdminId: null,
          cancellationReason: null,
          updatedAt: now,
        })
        .where(eq(schema.subscriptions.id, previousSubscriptionId))

      const existingPaymentRows = await tx
        .select({
          id: schema.payments.id,
        })
        .from(schema.payments)
        .where(eq(schema.payments.subscriptionId, previousSubscriptionId))
        .limit(1)

      const previousPayment = existingPaymentRows[0] ?? null

      const paymentPayload = {
        userId: user.id,
        subscriptionId: previousSubscriptionId,
        planCode: parsed.data.planCode,
        amount: getPlanFinalPrice(parsed.data.planCode),
        status: "paid" as const,
        gateway: "manual" as const,
        paymentMethod: "manual_transfer" as const,
        transactionSource: "admin_manual" as const,
        gatewayOrderId: null,
        gatewayTransactionId: null,
        paymentUrl: null,
        paidAt: now,
        expiredAt: null,
        proofUrl: null,
        notes: "Manual subscription grant by admin.",
        rawPayload: {
          action: "admin_grant",
          adminId: admin.id,
          planCode: parsed.data.planCode,
        },
        updatedAt: now,
      }

      const paymentId = previousPayment
        ? previousPayment.id
        : (
            await tx
              .insert(schema.payments)
              .values({
                ...paymentPayload,
                createdAt: now,
              })
              .$returningId()
          )[0].id

      if (previousPayment) {
        await tx
          .update(schema.payments)
          .set(paymentPayload)
          .where(eq(schema.payments.id, previousPayment.id))
      }

      return {
        subscriptionId: previousSubscriptionId,
        paymentId,
        previousSubscriptionId,
        action: "updated" as const,
      }
    }

    const [created] = await tx
      .insert(schema.subscriptions)
      .values({
        userId: user.id,
        planCode: parsed.data.planCode,
        status: "active",
        source: "admin_grant",
        startsAt: now,
        endsAt: getPlanEndDate(now, parsed.data.planCode),
        activatedByAdminId: admin.id,
      })
      .$returningId()

    const paymentPayload = {
      userId: user.id,
      subscriptionId: created.id,
      planCode: parsed.data.planCode,
      amount: getPlanFinalPrice(parsed.data.planCode),
      status: "paid" as const,
      gateway: "manual" as const,
      paymentMethod: "manual_transfer" as const,
      transactionSource: "admin_manual" as const,
      gatewayOrderId: null,
      gatewayTransactionId: null,
      paymentUrl: null,
      paidAt: now,
      expiredAt: null,
      proofUrl: null,
      notes: "Manual subscription grant by admin.",
      rawPayload: {
        action: "admin_grant",
        adminId: admin.id,
        planCode: parsed.data.planCode,
      },
      createdAt: now,
      updatedAt: now,
    }

    const [paymentCreated] = await tx
      .insert(schema.payments)
      .values(paymentPayload)
      .$returningId()

    return {
      subscriptionId: created.id,
      paymentId: paymentCreated.id,
      previousSubscriptionId,
      action: "created" as const,
    }
  })

  revalidatePaymentRoutes(result.paymentId, user.id, result.subscriptionId)
  if (result.previousSubscriptionId) {
    revalidatePath(`/admin/subscribers/${result.previousSubscriptionId}`)
  }
  revalidatePath("/admin/payments")

  return {
    success: true,
    data: {
      subscriptionId: result.subscriptionId,
      paymentId: result.paymentId,
      userId: user.id,
      previousSubscriptionId: result.previousSubscriptionId,
      action: result.action,
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
