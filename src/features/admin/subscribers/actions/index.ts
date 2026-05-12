"use server"

import { and, eq, gt, inArray } from "drizzle-orm"
import { revalidatePath } from "next/cache"

import { db, schema } from "@/db"
import { requireAdmin } from "@/features/auth/services/session"
import { isPaidPlanCode } from "@/lib/billing"
import { flattenZodError } from "@/lib/actions"
import { normalizeNullableText } from "@/lib/utils"

import { getAdminSubscriptionById } from "../queries"
import { subscriberGrantFormSchema, type SubscriberGrantFormValues } from "../schemas"

type ActionError = {
  success: false
  message: string
  fieldErrors?: Partial<Record<keyof SubscriberGrantFormValues, string[]>>
}

type ActionSuccess<T = unknown> = {
  success: true
  data: T
}

export type SubscriberActionResult<T = unknown> = ActionError | ActionSuccess<T>

function parseGrantValues(values: SubscriberGrantFormValues) {
  const validated = subscriberGrantFormSchema.safeParse(values)

  if (!validated.success) {
    return {
      success: false as const,
      message: "Please fix the highlighted fields.",
      fieldErrors: flattenZodError(validated.error),
    }
  }

  const userId = Number(validated.data.userId)
  const startsAt = new Date(validated.data.startsAt)
  const endsAt = new Date(validated.data.endsAt)

  if (!Number.isInteger(userId) || userId <= 0) {
    return {
      success: false as const,
      message: "Please select a valid user.",
      fieldErrors: {
        userId: ["The selected user is invalid."],
      },
    }
  }

  if (Number.isNaN(startsAt.getTime())) {
    return {
      success: false as const,
      message: "Please choose a valid start date.",
      fieldErrors: {
        startsAt: ["The selected start date is invalid."],
      },
    }
  }

  if (Number.isNaN(endsAt.getTime())) {
    return {
      success: false as const,
      message: "Please choose a valid end date.",
      fieldErrors: {
        endsAt: ["The selected end date is invalid."],
      },
    }
  }

  if (endsAt <= startsAt) {
    return {
      success: false as const,
      message: "End date must be after start date.",
      fieldErrors: {
        endsAt: ["The end date must be after the start date."],
      },
    }
  }

  if (endsAt <= new Date()) {
    return {
      success: false as const,
      message: "End date must be in the future.",
      fieldErrors: {
        endsAt: ["The end date must be in the future."],
      },
    }
  }

  if (!isPaidPlanCode(validated.data.planCode)) {
    return {
      success: false as const,
      message: "Manual subscription can only be created for Pro or Max.",
      fieldErrors: {
        planCode: ["Manual subscription is only available for Pro and Max."],
      },
    }
  }

  return {
    success: true as const,
    data: {
      userId,
      planCode: validated.data.planCode,
      startsAt,
      endsAt,
    },
  }
}

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

export async function createManualSubscriptionAction(
  values: SubscriberGrantFormValues,
): Promise<SubscriberActionResult<{ id: number; userId: number }>> {
  const admin = await requireAdmin()
  const parsed = parseGrantValues(values)

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

  const [created] = await db.transaction(async (tx) => {
    const activeSubscriptionRows = await tx
      .select({
        id: schema.subscriptions.id,
      })
      .from(schema.subscriptions)
      .where(
        and(
          eq(schema.subscriptions.userId, user.id),
          eq(schema.subscriptions.status, "active"),
          gt(schema.subscriptions.endsAt, new Date()),
        ),
      )
      .limit(1)

    if (activeSubscriptionRows.length > 0) {
      return [] as const
    }

    const [inserted] = await tx
      .insert(schema.subscriptions)
      .values({
        userId: user.id,
        planCode: parsed.data.planCode,
        status: "active",
        source: "admin_grant",
        startsAt: parsed.data.startsAt,
        endsAt: parsed.data.endsAt,
        activatedByAdminId: admin.id,
      })
      .$returningId()

    return [inserted]
  })

  if (!created) {
    return {
      success: false,
      message: "This user already has an active subscription.",
      fieldErrors: {
        userId: ["The selected user already has an active subscription."],
      },
    }
  }

  revalidateSubscriberRoutes(created.id, user.id)

  return {
    success: true,
    data: {
      id: created.id,
      userId: user.id,
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
    "Force downgraded to Free by admin.",
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
