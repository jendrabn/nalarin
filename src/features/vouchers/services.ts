import "server-only"

import { and, count, eq, gt, isNull, lte } from "drizzle-orm"
import { cacheLife, cacheTag } from "next/cache"

import { db, schema } from "@/db"
import { CACHE_TAGS } from "@/lib/cache-tags"

export type VoucherValidationResult =
  | {
      success: true
      data: VoucherApplication
    }
  | {
      success: false
      code:
        | "empty_code"
        | "not_found"
        | "inactive"
        | "deleted"
        | "not_started"
        | "expired"
        | "already_used"
        | "invalid_plan"
      message: string
    }

export type VoucherApplication = {
  voucherId: number
  code: string
  name: string
  discountPercent: number
  originalAmount: number
  discountAmount: number
  finalAmount: number
  promoLabel: string | null
  promoDescription: string | null
}

type VoucherRow = {
  id: number
  name: string
  code: string
  startsAt: Date
  endsAt: Date
  discountPercent: number
  isPublic: boolean
  promoLabel: string | null
  promoDescription: string | null
  isActive: boolean
  deletedAt: Date | null
}

export function normalizeVoucherCode(code: string) {
  return code.trim().replace(/\s+/g, "").toUpperCase()
}

export async function validateVoucherForCheckout({
  code,
  originalAmount,
  now = new Date(),
}: {
  code: string
  originalAmount: number
  userId: number
  now?: Date
}): Promise<VoucherValidationResult> {
  const normalizedCode = normalizeVoucherCode(code)

  if (!normalizedCode) {
    return {
      success: false,
      code: "empty_code",
      message: "Enter a voucher code first.",
    }
  }

  if (originalAmount <= 0) {
    return {
      success: false,
      code: "invalid_plan",
      message: "Vouchers are only available for paid packages.",
    }
  }

  const voucher = await getVoucherByCode(normalizedCode)

  if (!voucher) {
    return {
      success: false,
      code: "not_found",
      message: "Voucher code was not found.",
    }
  }

  return validateVoucherRowForCheckout({
    voucher,
    originalAmount,
    now,
  })
}

export async function getPublicVoucherPromos() {
  "use cache"
  cacheLife("minutes")
  cacheTag(CACHE_TAGS.voucherPromos)

  const now = new Date()
  const vouchers = await db
    .select({
      id: schema.vouchers.id,
      name: schema.vouchers.name,
      code: schema.vouchers.code,
      startsAt: schema.vouchers.startsAt,
      endsAt: schema.vouchers.endsAt,
      discountPercent: schema.vouchers.discountPercent,
      isPublic: schema.vouchers.isPublic,
      promoLabel: schema.vouchers.promoLabel,
      promoDescription: schema.vouchers.promoDescription,
      isActive: schema.vouchers.isActive,
      deletedAt: schema.vouchers.deletedAt,
    })
    .from(schema.vouchers)
    .where(
      and(
        eq(schema.vouchers.isPublic, true),
        eq(schema.vouchers.isActive, true),
        isNull(schema.vouchers.deletedAt),
        lte(schema.vouchers.startsAt, now),
        gt(schema.vouchers.endsAt, now),
      ),
    )

  const promos = await Promise.all(
    vouchers
      .map(async (voucher) => {
        const usageCount = await getVoucherGlobalUsageCount(voucher.id)

        if (usageCount >= 1) {
          return null
        }

        return {
          id: voucher.id,
          code: voucher.code,
          name: voucher.name,
          discountPercent: voucher.discountPercent,
          promoLabel: voucher.promoLabel,
          promoDescription: voucher.promoDescription,
          endsAt: voucher.endsAt.toISOString(),
        }
      }),
  )

  return promos.filter((promo): promo is NonNullable<typeof promo> => promo !== null)
}

async function validateVoucherRowForCheckout({
  voucher,
  originalAmount,
  now,
}: {
  voucher: VoucherRow
  originalAmount: number
  now: Date
}): Promise<VoucherValidationResult> {
  if (voucher.deletedAt) {
    return {
      success: false,
      code: "deleted",
      message: "Voucher is no longer available.",
    }
  }

  if (!voucher.isActive) {
    return {
      success: false,
      code: "inactive",
      message: "Voucher is inactive.",
    }
  }

  if (voucher.startsAt > now) {
    return {
      success: false,
      code: "not_started",
      message: "Voucher is not available yet.",
    }
  }

  if (voucher.endsAt <= now) {
    return {
      success: false,
      code: "expired",
      message: "Voucher has expired.",
    }
  }

  const usageCount = await getVoucherGlobalUsageCount(voucher.id)

  if (usageCount >= 1) {
    return {
      success: false,
      code: "already_used",
      message: "Voucher has already been used.",
    }
  }

  const discountAmount = Math.min(
    Math.round((originalAmount * voucher.discountPercent) / 100),
    originalAmount,
  )

  return {
    success: true,
    data: {
      voucherId: voucher.id,
      code: voucher.code,
      name: voucher.name,
      discountPercent: voucher.discountPercent,
      originalAmount,
      discountAmount,
      finalAmount: Math.max(originalAmount - discountAmount, 0),
      promoLabel: voucher.promoLabel,
      promoDescription: voucher.promoDescription,
    },
  }
}

async function getVoucherByCode(code: string): Promise<VoucherRow | null> {
  const [voucher] = await db
    .select({
      id: schema.vouchers.id,
      name: schema.vouchers.name,
      code: schema.vouchers.code,
      startsAt: schema.vouchers.startsAt,
      endsAt: schema.vouchers.endsAt,
      discountPercent: schema.vouchers.discountPercent,
      isPublic: schema.vouchers.isPublic,
      promoLabel: schema.vouchers.promoLabel,
      promoDescription: schema.vouchers.promoDescription,
      isActive: schema.vouchers.isActive,
      deletedAt: schema.vouchers.deletedAt,
    })
    .from(schema.vouchers)
    .where(eq(schema.vouchers.code, code))
    .limit(1)

  return voucher ?? null
}

async function getVoucherGlobalUsageCount(voucherId: number) {
  const [row] = await db
    .select({ value: count() })
    .from(schema.voucherRedemptions)
    .where(eq(schema.voucherRedemptions.voucherId, voucherId))

  return row?.value ?? 0
}
