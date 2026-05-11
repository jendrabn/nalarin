"use server"

import { revalidatePath } from "next/cache"
import { and, eq, ne, sql } from "drizzle-orm"
import { z } from "zod"

import { db, schema } from "@/db"
import { requireAdmin } from "@/features/auth/services/session"

import {
  userRoleStatusFormSchema,
  type UserRoleStatusFormValues,
} from "../schemas"
import { deleteUserData, detachUserReferences } from "../services/user-cleanup"
import { getAdminUserById } from "../queries"

type ActionError = {
  success: false
  message: string
  fieldErrors?: Partial<Record<keyof UserRoleStatusFormValues, string[]>>
}

type ActionSuccess<T = unknown> = {
  success: true
  data: T
}

export type UserActionResult<T = unknown> = ActionError | ActionSuccess<T>

function flattenZodError(error: z.ZodError<UserRoleStatusFormValues>) {
  return error.flatten().fieldErrors as Partial<
    Record<keyof UserRoleStatusFormValues, string[]>
  >
}

function parseValues(values: UserRoleStatusFormValues) {
  const validated = userRoleStatusFormSchema.safeParse(values)

  if (!validated.success) {
    return {
      success: false as const,
      message: "Please fix the highlighted fields.",
      fieldErrors: flattenZodError(validated.error),
    }
  }

  return {
    success: true as const,
    data: validated.data,
  }
}

function revalidateUserRoutes(userId?: number) {
  revalidatePath("/admin/users")

  if (userId) {
    revalidatePath(`/admin/users/${userId}`)
    revalidatePath(`/admin/users/${userId}/edit`)
  }
}

async function canDeleteAdminUser(userId: number) {
  const [remainingAdminRows] = await db
    .select({
      count: sql<number>`count(*)`,
    })
    .from(schema.users)
    .where(
      and(
        eq(schema.users.role, "admin"),
        eq(schema.users.status, "active"),
        ne(schema.users.id, userId),
      ),
    )

  return Number(remainingAdminRows?.count ?? 0) > 0
}

export async function updateUserRoleStatusAction(
  userId: number,
  values: UserRoleStatusFormValues,
): Promise<UserActionResult<{ id: number }>> {
  await requireAdmin()

  const parsed = parseValues(values)

  if (!parsed.success) {
    return parsed
  }

  const existingUser = await getAdminUserById(userId)

  if (!existingUser) {
    return {
      success: false,
      message: "User not found.",
    }
  }

  await db
    .update(schema.users)
    .set({
      role: parsed.data.role,
      status: parsed.data.status,
    })
    .where(eq(schema.users.id, userId))

  revalidateUserRoutes(userId)

  return {
    success: true,
    data: { id: userId },
  }
}

export async function deleteUserAction(
  userId: number,
): Promise<UserActionResult<{ id: number }>> {
  const currentUser = await requireAdmin()

  if (currentUser.id === userId) {
    return {
      success: false,
      message: "You cannot delete your own account.",
    }
  }

  const existingUser = await getAdminUserById(userId)

  if (!existingUser) {
    return {
      success: false,
      message: "User not found.",
    }
  }

  if (existingUser.role === "admin" && !(await canDeleteAdminUser(userId))) {
    return {
      success: false,
      message: "At least one admin account must remain active.",
    }
  }

  await db.transaction(async (tx) => {
    await detachUserReferences(tx, userId)
    await deleteUserData(tx, userId)
    await tx.delete(schema.users).where(eq(schema.users.id, userId))
  })

  revalidateUserRoutes()

  return {
    success: true,
    data: { id: userId },
  }
}
