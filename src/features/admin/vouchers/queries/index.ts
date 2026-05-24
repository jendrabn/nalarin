import "server-only"

import { and, count, desc, eq, isNull } from "drizzle-orm"

import { db, schema } from "@/db"

export type AdminVoucherRow = {
  id: number
  name: string
  code: string
  startsAt: Date
  endsAt: Date
  discountPercent: number
  isPublic: boolean
  promoLabel: string | null
  isActive: boolean
  usageCount: number
  createdAt: Date
  updatedAt: Date
}

export type AdminVoucherDetails = AdminVoucherRow & {
  promoDescription: string | null
  internalNotes: string | null
  redemptions: AdminVoucherRedemptionRow[]
}

export type AdminVoucherRedemptionRow = {
  id: number
  userId: number
  userName: string
  userEmail: string
  paymentId: number
  originalAmount: number
  discountAmount: number
  finalAmount: number
  redeemedAt: Date
}

export async function getAdminVouchers() {
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
      isActive: schema.vouchers.isActive,
      createdAt: schema.vouchers.createdAt,
      updatedAt: schema.vouchers.updatedAt,
    })
    .from(schema.vouchers)
    .where(isNull(schema.vouchers.deletedAt))
    .orderBy(desc(schema.vouchers.createdAt))

  return Promise.all(
    vouchers.map(async (voucher) => ({
      ...voucher,
      usageCount: await getVoucherUsageCount(voucher.id),
    })),
  )
}

export async function getAdminVoucherById(id: number) {
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
      internalNotes: schema.vouchers.internalNotes,
      createdAt: schema.vouchers.createdAt,
      updatedAt: schema.vouchers.updatedAt,
    })
    .from(schema.vouchers)
    .where(and(eq(schema.vouchers.id, id), isNull(schema.vouchers.deletedAt)))
    .limit(1)

  if (!voucher) {
    return null
  }

  const redemptions = await db
    .select({
      id: schema.voucherRedemptions.id,
      userId: schema.users.id,
      userName: schema.users.name,
      userEmail: schema.users.email,
      paymentId: schema.voucherRedemptions.paymentId,
      originalAmount: schema.voucherRedemptions.originalAmount,
      discountAmount: schema.voucherRedemptions.discountAmount,
      finalAmount: schema.voucherRedemptions.finalAmount,
      redeemedAt: schema.voucherRedemptions.redeemedAt,
    })
    .from(schema.voucherRedemptions)
    .innerJoin(schema.users, eq(schema.voucherRedemptions.userId, schema.users.id))
    .where(eq(schema.voucherRedemptions.voucherId, id))
    .orderBy(desc(schema.voucherRedemptions.redeemedAt))

  return {
    ...voucher,
    promoDescription: voucher.promoDescription ?? null,
    internalNotes: voucher.internalNotes ?? null,
    usageCount: redemptions.length,
    redemptions,
  } satisfies AdminVoucherDetails
}

async function getVoucherUsageCount(voucherId: number) {
  const [row] = await db
    .select({ value: count() })
    .from(schema.voucherRedemptions)
    .where(eq(schema.voucherRedemptions.voucherId, voucherId))

  return row?.value ?? 0
}
