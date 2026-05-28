"use server"

import { eq, inArray } from "drizzle-orm"
import { revalidatePath } from "next/cache"

import { db, schema } from "@/db"
import { requireAdmin } from "@/features/auth/services/session"
import { normalizeNullableText } from "@/lib/utils"

import { getAdminSubscriptionById } from "../queries"

type ActionError = {
  success: false
  message: string
  fieldErrors?: Record<string, string[]>
}

type ActionSuccess<T = unknown> = {
  success: true
  data: T
}

export type SubscriberActionResult<T = unknown> = ActionError | ActionSuccess<T>

function revalidateSubscriberRoutes(subscriptionId?: number, userId?: number) {
  revalidatePath("/admin/subscribers")
  revalidatePath("/admin/payments")
  revalidatePath("/admin/subscribers/create")
  revalidatePath("/admin/users")

  if (subscriptionId) {
    revalidatePath(`/admin/subscribers/${subscriptionId}`)
  }

  if (userId) {
    revalidatePath(`/admin/users/${userId}`)
    revalidatePath(`/admin/users/${userId}/edit`)
  }
}

async function updateActiveSubscriptionStatus(
  subscriptionId: number,
  adminId: number,
  reason: string,
) {
  const existingSubscription = await getAdminSubscriptionById(subscriptionId)

  if (!existingSubscription) {
    return {
      success: false as const,
      message: "Subscription not found.",
    }
  }

  if (existingSubscription.status !== "active") {
    return {
      success: true as const,
      data: {
        id: subscriptionId,
        userId: existingSubscription.userId,
      },
    }
  }

  await db
    .update(schema.subscriptions)
    .set({
      status: "cancelled",
      cancelledAt: new Date(),
      cancelledByAdminId: adminId,
      cancellationReason: normalizeNullableText(reason),
      updatedAt: new Date(),
    })
    .where(eq(schema.subscriptions.id, subscriptionId))

  revalidateSubscriberRoutes(subscriptionId, existingSubscription.userId)

  return {
    success: true as const,
    data: {
      id: subscriptionId,
      userId: existingSubscription.userId,
    },
  }
}

export async function cancelSubscriptionAction(
  subscriptionId: number,
): Promise<SubscriberActionResult<{ id: number; userId: number }>> {
  const admin = await requireAdmin()

  return updateActiveSubscriptionStatus(
    subscriptionId,
    admin.id,
    "Cancelled by admin.",
  )
}

export async function forceDowngradeSubscriptionAction(
  subscriptionId: number,
): Promise<SubscriberActionResult<{ id: number; userId: number }>> {
  const admin = await requireAdmin()

  return updateActiveSubscriptionStatus(
    subscriptionId,
    admin.id,
    "Subscription access revoked by admin.",
  )
}

export async function deleteSubscribersAction(
  subscriptionIds: number[],
): Promise<SubscriberActionResult<{ deletedCount: number }>> {
  await requireAdmin()

  const uniqueSubscriptionIds = [...new Set(subscriptionIds)].filter(
    (id) => Number.isInteger(id) && id > 0,
  )

  if (uniqueSubscriptionIds.length === 0) {
    return {
      success: false,
      message: "No subscriptions were selected.",
    }
  }

  const existingSubscriptions = await db
    .select({
      id: schema.subscriptions.id,
      userId: schema.subscriptions.userId,
    })
    .from(schema.subscriptions)
    .where(inArray(schema.subscriptions.id, uniqueSubscriptionIds))

  if (existingSubscriptions.length !== uniqueSubscriptionIds.length) {
    return {
      success: false,
      message: "Some selected subscriptions were not found.",
    }
  }

  const affectedUserIds = [...new Set(existingSubscriptions.map((row) => row.userId))]

  await db.transaction(async (tx) => {
    await tx
      .delete(schema.payments)
      .where(inArray(schema.payments.subscriptionId, uniqueSubscriptionIds))

    await tx
      .delete(schema.subscriptions)
      .where(inArray(schema.subscriptions.id, uniqueSubscriptionIds))
  })

  revalidateSubscriberRoutes()
  uniqueSubscriptionIds.forEach((subscriptionId) => {
    revalidateSubscriberRoutes(subscriptionId)
  })
  affectedUserIds.forEach((userId) => {
    revalidateSubscriberRoutes(undefined, userId)
  })

  return {
    success: true,
    data: { deletedCount: uniqueSubscriptionIds.length },
  }
}
