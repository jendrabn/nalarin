"use server"

import { revalidatePath, updateTag } from "next/cache"
import { inArray } from "drizzle-orm"

import { db, schema } from "@/db"
import { flattenZodError, isDuplicateEntryError, type ActionResult } from "@/lib/actions"
import { CACHE_TAGS } from "@/lib/cache-tags"
import { requireAdmin } from "@/features/auth/services/session"
import { normalizeVoucherCode } from "@/features/vouchers/services"

import { voucherFormSchema, type VoucherFormValues } from "../schemas"

type VoucherActionResult<T = unknown> = ActionResult<VoucherFormValues, T>

export async function createVoucherAction(
  values: VoucherFormValues,
): Promise<VoucherActionResult<{ id: number }>> {
  await requireAdmin()
  const parsed = voucherFormSchema.safeParse(values)

  if (!parsed.success) {
    return {
      success: false,
      message: "Review the voucher fields.",
      fieldErrors: flattenZodError(parsed.error),
    }
  }

  const data = parsed.data

  try {
    const [created] = await db
      .insert(schema.vouchers)
      .values({
        name: data.name,
        code: normalizeVoucherCode(data.code),
        startsAt: new Date(data.startsAt),
        endsAt: new Date(data.endsAt),
        discountPercent: data.discountPercent,
        isPublic: data.isPublic,
        promoLabel: data.promoLabel || null,
        promoDescription: data.promoDescription || null,
        isActive: data.isActive,
        internalNotes: data.internalNotes || null,
      })
      .$returningId()

    revalidateVoucherRoutes(created.id)

    return {
      success: true,
      data: {
        id: created.id,
      },
    }
  } catch (error) {
    if (isDuplicateEntryError(error)) {
      return {
        success: false,
        message: "Voucher code is already used.",
        fieldErrors: {
          code: ["Voucher code is already used."],
        },
      }
    }

    return {
      success: false,
      message: "Voucher could not be created.",
    }
  }
}

export async function deleteVouchersAction(
  voucherIds: number[],
): Promise<{ success: true; data: { deletedCount: number } } | { success: false; message: string }> {
  await requireAdmin()

  const uniqueVoucherIds = [...new Set(voucherIds)].filter(
    (id) => Number.isInteger(id) && id > 0,
  )

  if (uniqueVoucherIds.length === 0) {
    return {
      success: false,
      message: "No vouchers selected.",
    }
  }

  await db
    .update(schema.vouchers)
    .set({
      deletedAt: new Date(),
      isActive: false,
      updatedAt: new Date(),
    })
    .where(inArray(schema.vouchers.id, uniqueVoucherIds))

  revalidateVoucherRoutes()
  uniqueVoucherIds.forEach((id) => revalidateVoucherRoutes(id))

  return {
    success: true,
    data: {
      deletedCount: uniqueVoucherIds.length,
    },
  }
}

export async function deleteVoucherAction(voucherId: number) {
  return deleteVouchersAction([voucherId])
}

function revalidateVoucherRoutes(voucherId?: number) {
  updateTag(CACHE_TAGS.voucherPromos)

  revalidatePath("/admin/vouchers")
  revalidatePath("/pricing")

  if (voucherId) {
    revalidatePath(`/admin/vouchers/${voucherId}`)
  }
}
