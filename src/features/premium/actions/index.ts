"use server"

import "server-only"

import crypto from "node:crypto"
import { revalidatePath } from "next/cache"
import { and, desc, eq } from "drizzle-orm"

import { env } from "@/config/env"
import { db, schema } from "@/db"
import {
  getPackageDiscountAmount,
  getPackageFinalPrice,
  type PackageBenefitSnapshot,
  type PackagePricingSnapshot,
} from "@/lib/billing"
import {
  cancelMidtransTransaction,
  createMidtransSnapTransaction,
} from "@/lib/midtrans"
import { getCurrentUser } from "@/features/auth/services/session"
import {
  validateVoucherForCheckout,
  type VoucherApplication,
} from "@/features/vouchers/services"

import type {
  PremiumActionResult,
  PremiumPaymentPayload,
  PremiumPendingPayment,
  PremiumVoucherPreview,
} from "../types"
import { mapPendingPayment } from "../queries"

const PREMIUM_PATH = "/pricing"
const PAYMENT_EXPIRY_MS = 24 * 60 * 60 * 1000
const PAYMENT_EXPIRY_HOURS = 24

type CheckoutPackage = {
  priceId: number
  packageId: number
  examTypeId: number
  examTypeName: string
  examTypeSlug: string
  price: number
  discountPercent: number
  durationMonths: number
  practiceQuotaPerMonth: number
  quizQuotaPerMonth: number
  tryoutQuotaPerMonth: number
  aiExplanationQuotaPerMonth: number
  premiumPracticesEnabled: boolean
  premiumTryoutsEnabled: boolean
  rankingEnabled: boolean
}

type PendingPaymentRow = {
  id: number
  examTypeId: number | null
  examTypeSlug: string | null
  examTypeName: string | null
  packageId: number | null
  packagePriceId: number | null
  amount: number
  voucherId: number | null
  voucherCodeSnapshot: string | null
  voucherNameSnapshot: string | null
  voucherDiscountPercent: number | null
  originalAmount: number | null
  discountAmount: number
  status: "pending"
  gateway: "midtrans" | "manual"
  gatewayOrderId: string | null
  paymentUrl: string | null
  rawPayload: Record<string, unknown> | null
  expiredAt: Date | null
  createdAt: Date
}

const pendingPaymentColumns = {
  id: schema.payments.id,
  examTypeId: schema.payments.examTypeId,
  examTypeSlug: schema.examTypes.slug,
  examTypeName: schema.examTypes.name,
  packageId: schema.payments.packageId,
  packagePriceId: schema.payments.packagePriceId,
  amount: schema.payments.amount,
  voucherId: schema.payments.voucherId,
  voucherCodeSnapshot: schema.payments.voucherCodeSnapshot,
  voucherNameSnapshot: schema.payments.voucherNameSnapshot,
  voucherDiscountPercent: schema.payments.voucherDiscountPercent,
  originalAmount: schema.payments.originalAmount,
  discountAmount: schema.payments.discountAmount,
  status: schema.payments.status,
  gateway: schema.payments.gateway,
  gatewayOrderId: schema.payments.gatewayOrderId,
  paymentUrl: schema.payments.paymentUrl,
  rawPayload: schema.payments.rawPayload,
  expiredAt: schema.payments.expiredAt,
  createdAt: schema.payments.createdAt,
} as const

export async function previewPremiumVoucherAction(
  packagePriceId: number,
  voucherCode: string,
): Promise<PremiumActionResult<PremiumVoucherPreview>> {
  const user = await getCurrentUser()

  if (!user) {
    return {
      success: false,
      code: "unauthenticated",
      message: "Silakan login terlebih dahulu untuk menggunakan voucher.",
    }
  }

  const checkoutPackage = await getCheckoutPackage(packagePriceId)

  if (!checkoutPackage) {
    return {
      success: false,
      code: "invalid_package",
      message: "Paket tidak tersedia.",
    }
  }

  const now = new Date()
  const pendingPayment = await getLatestPendingPayment(
    user.id,
    checkoutPackage.examTypeId,
  )

  if (pendingPayment && !isExpired(pendingPayment.expiredAt, now)) {
    return {
      success: false,
      code: "pending_exists",
      message:
        "Masih ada pembayaran pending. Batalkan pembayaran tersebut sebelum menggunakan voucher.",
    }
  }

  const originalAmount = getPackageFinalPrice(
    checkoutPackage.price,
    checkoutPackage.discountPercent,
  )
  const result = await validateVoucherForCheckout({
    code: voucherCode,
    originalAmount,
    userId: user.id,
    now,
  })

  if (!result.success) {
    return {
      success: false,
      code: "voucher_invalid",
      message: result.message,
    }
  }

  return {
    success: true,
    data: result.data,
  }
}

export async function startPremiumCheckoutAction(
  packagePriceId: number,
  voucherCode?: string,
): Promise<PremiumActionResult<PremiumPaymentPayload>> {
  if (!env.PAYMENT_GATEWAY_ENABLED) {
    return {
      success: false,
      code: "gateway_error",
      message: "Pembayaran online sedang dinonaktifkan. Gunakan metode pembayaran yang tersedia.",
    }
  }

  return createPendingPayment({
    packagePriceId,
    voucherCode,
    gateway: "midtrans",
  })
}

export async function startManualPaymentAction(
  packagePriceId: number,
  voucherCode?: string,
): Promise<PremiumActionResult<PremiumPaymentPayload>> {
  return createPendingPayment({
    packagePriceId,
    voucherCode,
    gateway: "manual",
  })
}

async function createPendingPayment({
  packagePriceId,
  voucherCode,
  gateway,
}: {
  packagePriceId: number
  voucherCode?: string
  gateway: "midtrans" | "manual"
}): Promise<PremiumActionResult<PremiumPaymentPayload>> {
  const user = await getCurrentUser()

  if (!user) {
    return {
      success: false,
      code: "unauthenticated",
      message: "Silakan login terlebih dahulu untuk memilih paket.",
    }
  }

  if (!user.emailVerifiedAt) {
    return {
      success: false,
      code: "email_unverified",
      message: "Verifikasi email terlebih dahulu sebelum melakukan pembayaran.",
    }
  }

  const checkoutPackage = await getCheckoutPackage(packagePriceId)

  if (!checkoutPackage) {
    return {
      success: false,
      code: "invalid_package",
      message: "Paket tidak tersedia.",
    }
  }

  const voucher = await resolveCheckoutVoucher({
    voucherCode,
    checkoutPackage,
    userId: user.id,
  })

  if (!voucher.success) {
    return voucher
  }

  const pricing = getCheckoutPricing(checkoutPackage, voucher.data)
  const benefitSnapshot = buildBenefitSnapshot(checkoutPackage)
  const pricingSnapshot = buildPricingSnapshot(checkoutPackage)
  const amount = pricing.finalAmount
  const now = new Date()
  const orderId =
    gateway === "midtrans"
      ? createOrderId(user.id, checkoutPackage)
      : createManualOrderId(user.id, checkoutPackage)
  const expiredAt = new Date(now.getTime() + PAYMENT_EXPIRY_MS)
  const rawPayload = {
    provider: gateway === "midtrans" ? "midtrans_snap" : "manual_ewallet",
    examTypeId: checkoutPackage.examTypeId,
    examTypeSlug: checkoutPackage.examTypeSlug,
    packageId: checkoutPackage.packageId,
    packagePriceId: checkoutPackage.priceId,
    originalAmount: pricing.originalAmount,
    discountAmount: pricing.discountAmount,
    voucher: voucher.data
      ? {
          id: voucher.data.voucherId,
          code: voucher.data.code,
          name: voucher.data.name,
          discountPercent: voucher.data.discountPercent,
        }
      : null,
    amount,
    createdFrom: "exam_type_pricing",
  }

  const createResult = await db.transaction(async (tx) => {
    const pendingPayment = await getLatestPendingPaymentForUpdate(
      tx,
      user.id,
      checkoutPackage.examTypeId,
    )

    if (pendingPayment) {
      if (isExpired(pendingPayment.expiredAt, now)) {
        await tx
          .update(schema.payments)
          .set({
            status: "expired",
            updatedAt: now,
          })
          .where(eq(schema.payments.id, pendingPayment.id))
      } else {
        const payload = toPremiumPaymentPayload(pendingPayment)

        return {
          success: false,
          code: "pending_exists",
          message:
            gateway === "manual" && pendingPayment.gateway === "manual"
              ? "Masih ada pembayaran pending. Lanjutkan konfirmasi pembayaran tersebut."
              : "Masih ada pembayaran pending. Lanjutkan atau batalkan pembayaran tersebut.",
          data: {
            payment: payload,
            snapToken: payload.snapToken,
            paymentUrl: payload.paymentUrl,
          },
        } satisfies PremiumActionResult<PremiumPaymentPayload>
      }
    }

    const [created] = await tx
      .insert(schema.payments)
      .values({
        userId: user.id,
        examTypeId: checkoutPackage.examTypeId,
        packageId: checkoutPackage.packageId,
        packagePriceId: checkoutPackage.priceId,
        voucherId: voucher.data?.voucherId ?? null,
        voucherCodeSnapshot: voucher.data?.code ?? null,
        voucherNameSnapshot: voucher.data?.name ?? null,
        voucherDiscountPercent: voucher.data?.discountPercent ?? null,
        originalAmount: pricing.originalAmount,
        discountAmount: pricing.discountAmount,
        amount,
        status: "pending",
        gateway,
        paymentMethod: gateway === "manual" ? "e_wallet" : null,
        transactionSource: "user_checkout",
        gatewayOrderId: orderId,
        expiredAt,
        notes:
          gateway === "midtrans"
            ? `Checkout paket ${checkoutPackage.examTypeName} dari halaman pricing.`
            : "Pembayaran dari halaman pricing. Menunggu konfirmasi bukti transfer via WhatsApp.",
        packageSnapshot: benefitSnapshot,
        pricingSnapshot,
        rawPayload,
      })
      .$returningId()

    return {
      success: true,
      data: created,
    } as const
  })

  if (!createResult.success) {
    return createResult
  }

  const created = createResult.data

  if (gateway === "manual") {
    revalidatePremiumPage()

    return {
      success: true,
      data: {
        payment: buildPendingPaymentPayload({
          id: created.id,
          checkoutPackage,
          amount,
          pricing,
          voucher: voucher.data,
          gateway,
          orderId,
          expiredAt,
          createdAt: now,
          paymentUrl: null,
          snapToken: null,
        }),
        snapToken: null,
        paymentUrl: null,
      },
    }
  }

  try {
    const snap = await createMidtransSnapTransaction({
      transaction_details: {
        order_id: orderId,
        gross_amount: amount,
      },
      item_details: [
        {
          id: `exam-${checkoutPackage.examTypeSlug}-${checkoutPackage.durationMonths}m`,
          price: amount,
          quantity: 1,
          name: `Nalarin ${checkoutPackage.examTypeName} ${checkoutPackage.durationMonths} Bulan`,
        },
      ],
      customer_details: {
        first_name: user.name,
        email: user.email,
      },
      callbacks: {
        finish: `${env.NEXT_PUBLIC_APP_URL}/pricing`,
      },
      expiry: {
        unit: "hour",
        duration: PAYMENT_EXPIRY_HOURS,
      },
    })

    await db
      .update(schema.payments)
      .set({
        paymentUrl: snap.redirect_url,
        rawPayload: {
          ...rawPayload,
          snapToken: snap.token,
          snapRedirectUrl: snap.redirect_url,
        },
        updatedAt: new Date(),
      })
      .where(eq(schema.payments.id, created.id))

    revalidatePremiumPage()

    return {
      success: true,
      data: {
        payment: buildPendingPaymentPayload({
          id: created.id,
          checkoutPackage,
          amount,
          pricing,
          voucher: voucher.data,
          gateway,
          orderId,
          expiredAt,
          createdAt: now,
          paymentUrl: snap.redirect_url,
          snapToken: snap.token,
        }),
        snapToken: snap.token,
        paymentUrl: snap.redirect_url,
      },
    }
  } catch (error) {
    await db
      .update(schema.payments)
      .set({
        status: "failed",
        rawPayload: {
          ...rawPayload,
          error: error instanceof Error ? error.message : "Unknown Midtrans error.",
        },
        updatedAt: new Date(),
      })
      .where(eq(schema.payments.id, created.id))

    revalidatePremiumPage()

    return {
      success: false,
      code: "gateway_error",
      message: "Gagal membuat transaksi pembayaran. Coba lagi beberapa saat.",
    }
  }
}

export async function continuePremiumPaymentAction(
  paymentId: number,
): Promise<PremiumActionResult<PremiumPaymentPayload>> {
  const user = await getCurrentUser()

  if (!user) {
    return {
      success: false,
      code: "unauthenticated",
      message: "Silakan login terlebih dahulu.",
    }
  }

  const payment = await getPendingPaymentById(user.id, paymentId)

  if (!payment) {
    return {
      success: false,
      code: "not_found",
      message: "Pembayaran pending tidak ditemukan.",
    }
  }

  if (isExpired(payment.expiredAt, new Date())) {
    await markPaymentExpired(payment.id)
    revalidatePremiumPage()

    return {
      success: false,
      code: "expired",
      message: "Pembayaran sudah kedaluwarsa. Silakan buat transaksi baru.",
    }
  }

  const payload = toPremiumPaymentPayload(payment)

  return {
    success: true,
    data: {
      payment: payload,
      snapToken: payment.gateway === "manual" ? null : payload.snapToken,
      paymentUrl: payment.gateway === "manual" ? null : payload.paymentUrl,
    },
  }
}

export async function cancelPremiumPaymentAction(
  paymentId: number,
): Promise<PremiumActionResult<{ id: number }>> {
  const user = await getCurrentUser()

  if (!user) {
    return {
      success: false,
      code: "unauthenticated",
      message: "Silakan login terlebih dahulu.",
    }
  }

  const payment = await getPendingPaymentById(user.id, paymentId)

  if (!payment) {
    return {
      success: false,
      code: "not_found",
      message: "Pembayaran pending tidak ditemukan.",
    }
  }

  await db
    .update(schema.payments)
    .set({
      status: "cancelled",
      updatedAt: new Date(),
    })
    .where(eq(schema.payments.id, payment.id))

  if (payment.gateway === "midtrans" && payment.gatewayOrderId) {
    try {
      await cancelMidtransTransaction(payment.gatewayOrderId)
    } catch {
      // Payment tetap dibatalkan di sistem; Midtrans akan expire otomatis.
    }
  }

  revalidatePremiumPage()

  return {
    success: true,
    data: {
      id: payment.id,
    },
  }
}

async function getCheckoutPackage(packagePriceId: number) {
  if (!Number.isInteger(packagePriceId) || packagePriceId <= 0) {
    return null
  }

  const [row] = await db
    .select({
      priceId: schema.examTypePackagePrices.id,
      packageId: schema.examTypePackages.id,
      examTypeId: schema.examTypes.id,
      examTypeName: schema.examTypes.name,
      examTypeSlug: schema.examTypes.slug,
      price: schema.examTypePackagePrices.price,
      discountPercent: schema.examTypePackagePrices.discountPercent,
      durationMonths: schema.examTypePackagePrices.durationMonths,
      practiceQuotaPerMonth: schema.examTypePackages.practiceQuotaPerMonth,
      quizQuotaPerMonth: schema.examTypePackages.quizQuotaPerMonth,
      tryoutQuotaPerMonth: schema.examTypePackages.tryoutQuotaPerMonth,
      aiExplanationQuotaPerMonth: schema.examTypePackages.aiExplanationQuotaPerMonth,
      premiumPracticesEnabled: schema.examTypePackages.premiumPracticesEnabled,
      premiumTryoutsEnabled: schema.examTypePackages.premiumTryoutsEnabled,
      rankingEnabled: schema.examTypePackages.rankingEnabled,
    })
    .from(schema.examTypePackagePrices)
    .innerJoin(
      schema.examTypePackages,
      eq(schema.examTypePackagePrices.packageId, schema.examTypePackages.id),
    )
    .innerJoin(schema.examTypes, eq(schema.examTypePackages.examTypeId, schema.examTypes.id))
    .where(
      and(
        eq(schema.examTypePackagePrices.id, packagePriceId),
        eq(schema.examTypePackagePrices.isActive, true),
        eq(schema.examTypePackages.isActive, true),
      ),
    )
    .limit(1)

  return row ?? null
}

async function getLatestPendingPayment(userId: number, examTypeId: number) {
  const [payment] = await db
    .select(pendingPaymentColumns)
    .from(schema.payments)
    .leftJoin(schema.examTypes, eq(schema.payments.examTypeId, schema.examTypes.id))
    .where(
      and(
        eq(schema.payments.userId, userId),
        eq(schema.payments.examTypeId, examTypeId),
        eq(schema.payments.status, "pending"),
      ),
    )
    .orderBy(desc(schema.payments.createdAt))
    .limit(1)

  return payment && payment.status === "pending" ? (payment as PendingPaymentRow) : null
}

type PaymentTransaction = Pick<typeof db, "select">

async function getLatestPendingPaymentForUpdate(
  tx: PaymentTransaction,
  userId: number,
  examTypeId: number,
) {
  const [payment] = await tx
    .select(pendingPaymentColumns)
    .from(schema.payments)
    .leftJoin(schema.examTypes, eq(schema.payments.examTypeId, schema.examTypes.id))
    .where(
      and(
        eq(schema.payments.userId, userId),
        eq(schema.payments.examTypeId, examTypeId),
        eq(schema.payments.status, "pending"),
      ),
    )
    .orderBy(desc(schema.payments.createdAt))
    .limit(1)
    .for("update")

  return payment && payment.status === "pending" ? (payment as PendingPaymentRow) : null
}

async function getPendingPaymentById(userId: number, paymentId: number) {
  const [payment] = await db
    .select(pendingPaymentColumns)
    .from(schema.payments)
    .leftJoin(schema.examTypes, eq(schema.payments.examTypeId, schema.examTypes.id))
    .where(
      and(
        eq(schema.payments.userId, userId),
        eq(schema.payments.id, paymentId),
        eq(schema.payments.status, "pending"),
      ),
    )
    .limit(1)

  return payment && payment.status === "pending" ? (payment as PendingPaymentRow) : null
}

async function markPaymentExpired(paymentId: number) {
  await db
    .update(schema.payments)
    .set({
      status: "expired",
      updatedAt: new Date(),
    })
    .where(eq(schema.payments.id, paymentId))
}

function toPremiumPaymentPayload(payment: PendingPaymentRow) {
  return mapPendingPayment(payment)
}

function isExpired(expiredAt: Date | null, now: Date) {
  return Boolean(expiredAt && expiredAt <= now)
}

function createOrderId(userId: number, checkoutPackage: CheckoutPackage) {
  const suffix = crypto.randomBytes(4).toString("hex")
  return `NAL-${userId}-${checkoutPackage.examTypeSlug}-${Date.now()}-${suffix}`
}

function createManualOrderId(userId: number, checkoutPackage: CheckoutPackage) {
  const suffix = crypto.randomBytes(4).toString("hex")
  return `MANUAL-${userId}-${checkoutPackage.examTypeSlug}-${Date.now()}-${suffix}`
}

async function resolveCheckoutVoucher({
  voucherCode,
  checkoutPackage,
  userId,
}: {
  voucherCode?: string
  checkoutPackage: CheckoutPackage
  userId: number
}): Promise<
  | { success: true; data: VoucherApplication | null }
  | {
      success: false
      code: "voucher_invalid"
      message: string
    }
> {
  if (!voucherCode?.trim()) {
    return {
      success: true,
      data: null,
    }
  }

  const result = await validateVoucherForCheckout({
    code: voucherCode,
    originalAmount: getPackageFinalPrice(
      checkoutPackage.price,
      checkoutPackage.discountPercent,
    ),
    userId,
  })

  if (!result.success) {
    return {
      success: false,
      code: "voucher_invalid",
      message: result.message,
    }
  }

  return {
    success: true,
    data: result.data,
  }
}

function getCheckoutPricing(
  checkoutPackage: CheckoutPackage,
  voucher: VoucherApplication | null,
) {
  if (voucher) {
    return {
      originalAmount: voucher.originalAmount,
      discountAmount: voucher.discountAmount,
      finalAmount: voucher.finalAmount,
    }
  }

  const amount = getPackageFinalPrice(
    checkoutPackage.price,
    checkoutPackage.discountPercent,
  )

  return {
    originalAmount: amount,
    discountAmount: 0,
    finalAmount: amount,
  }
}

function buildBenefitSnapshot(
  checkoutPackage: CheckoutPackage,
): PackageBenefitSnapshot {
  return {
    examTypeId: checkoutPackage.examTypeId,
    examTypeName: checkoutPackage.examTypeName,
    examTypeSlug: checkoutPackage.examTypeSlug,
    packageId: checkoutPackage.packageId,
    packagePriceId: checkoutPackage.priceId,
    durationMonths: checkoutPackage.durationMonths,
    practiceQuotaPerMonth: checkoutPackage.practiceQuotaPerMonth,
    quizQuotaPerMonth: checkoutPackage.quizQuotaPerMonth,
    tryoutQuotaPerMonth: checkoutPackage.tryoutQuotaPerMonth,
    aiExplanationQuotaPerMonth: checkoutPackage.aiExplanationQuotaPerMonth,
    premiumPracticesEnabled: checkoutPackage.premiumPracticesEnabled,
    premiumTryoutsEnabled: checkoutPackage.premiumTryoutsEnabled,
    rankingEnabled: checkoutPackage.rankingEnabled,
  }
}

function buildPricingSnapshot(
  checkoutPackage: CheckoutPackage,
): PackagePricingSnapshot {
  const packageDiscountAmount = getPackageDiscountAmount(
    checkoutPackage.price,
    checkoutPackage.discountPercent,
  )

  return {
    price: checkoutPackage.price,
    discountPercent: checkoutPackage.discountPercent,
    packageDiscountAmount,
    packageFinalPrice: Math.max(checkoutPackage.price - packageDiscountAmount, 0),
  }
}

function buildPendingPaymentPayload({
  id,
  checkoutPackage,
  amount,
  pricing,
  voucher,
  gateway,
  orderId,
  expiredAt,
  createdAt,
  paymentUrl,
  snapToken,
}: {
  id: number
  checkoutPackage: CheckoutPackage
  amount: number
  pricing: ReturnType<typeof getCheckoutPricing>
  voucher: VoucherApplication | null
  gateway: "midtrans" | "manual"
  orderId: string
  expiredAt: Date
  createdAt: Date
  paymentUrl: string | null
  snapToken: string | null
}): NonNullable<PremiumPendingPayment> {
  return {
    id,
    examTypeId: checkoutPackage.examTypeId,
    examTypeSlug: checkoutPackage.examTypeSlug,
    examTypeName: checkoutPackage.examTypeName,
    packageId: checkoutPackage.packageId,
    packagePriceId: checkoutPackage.priceId,
    packageName: checkoutPackage.examTypeName,
    amount,
    originalAmount: pricing.originalAmount,
    discountAmount: pricing.discountAmount,
    packageSnapshot: benefitSnapshot,
    pricingSnapshot,
    voucher: voucher
      ? {
          id: voucher.voucherId,
          code: voucher.code,
          name: voucher.name,
          discountPercent: voucher.discountPercent,
        }
      : null,
    status: "pending",
    gateway,
    gatewayOrderId: orderId,
    paymentUrl,
    snapToken,
    expiredAt: expiredAt.toISOString(),
    createdAt: createdAt.toISOString(),
  }
}

function revalidatePremiumPage() {
  revalidatePath(PREMIUM_PATH)
}
