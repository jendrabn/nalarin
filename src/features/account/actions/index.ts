"use server"

import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"

import { db, schema } from "@/db"
import { getSession, requireUser } from "@/features/auth/services/session"

import { deleteAccountSchema, profileFormSchema } from "../schemas"
import { purgeAccountData } from "../services/delete-account"

type ActionResult =
  | { success: true; message: string; redirectTo?: string }
  | { success: false; message: string; fieldErrors?: Record<string, string[]> }

function mapValidationError(error: unknown): ActionResult {
  if (
    error &&
    typeof error === "object" &&
    "flatten" in error &&
    typeof error.flatten === "function"
  ) {
    const flattened = error.flatten() as {
      fieldErrors: Record<string, string[]>
    }

    return {
      success: false,
      message: "Periksa kembali data yang kamu isi.",
      fieldErrors: flattened.fieldErrors,
    }
  }

  return {
    success: false,
    message: "Data tidak valid.",
  }
}

export async function updateProfileAction(values: unknown): Promise<ActionResult> {
  const user = await requireUser()
  const parsed = profileFormSchema.safeParse(values)

  if (!parsed.success) {
    return mapValidationError(parsed.error)
  }

  await db
    .update(schema.users)
    .set({
      name: parsed.data.name,
      phoneNumber: parsed.data.phoneNumber,
      birthDate: parsed.data.birthDate,
      gender: parsed.data.gender,
      bio: parsed.data.bio,
      avatarUrl: parsed.data.avatarUrl,
      updatedAt: new Date(),
    })
    .where(eq(schema.users.id, user.id))

  revalidatePath("/profile")

  return {
    success: true,
    message: "Profil berhasil diperbarui.",
  }
}

export async function deleteAccountAction(values: unknown): Promise<ActionResult> {
  const user = await requireUser()
  const parsed = deleteAccountSchema.safeParse(values)

  if (!parsed.success) {
    return mapValidationError(parsed.error)
  }

  if (parsed.data.email.trim().toLowerCase() !== user.email.toLowerCase()) {
    return {
      success: false,
      message: "Email konfirmasi tidak sesuai.",
      fieldErrors: {
        email: ["Email konfirmasi tidak sesuai."],
      },
    }
  }

  await db.transaction(async (tx) => {
    await purgeAccountData(tx, user.id)
  })

  const session = await getSession()
  session.destroy()

  return {
    success: true,
    message: "Akun berhasil dihapus.",
    redirectTo: "/",
  }
}
