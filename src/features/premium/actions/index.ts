"use server"

import "server-only"

import crypto from "node:crypto"
import { revalidatePath } from "next/cache"
import { and, desc, eq, gt } from "drizzle-orm"

import { env } from "@/config/env"
import { PLAN_CONFIG, type PlanCode } from "@/config/plans"
import { db, schema } from "@/db"
import {
  getPlanFinalPrice,
  getPlanRank,
  isPaidPlanCode,
} from "@/lib/billing"
import {
  cancelMidtransTransaction,
  createMidtransSnapTransaction,
} from "@/lib/midtrans"
import { getCurrentUser } from "@/features/auth/services/session"

import type {
  PremiumActionResult,
  PremiumPaymentPayload,
  PremiumPendingPayment,
} from "../types"
import { mapPendingPayment } from "../queries"

const PREMIUM_PATH = "/pricing"
const PAYMENT_EXPIRY_MS = 24 * 60 * 60 * 1000
const PAYMENT_EXPIRY_HOURS = 24

type PendingPaymentRow = {
  id: number
  planCode: PlanCode
  amount: number
  status: "pending"
  gatewayOrderId: string | null
  paymentUrl: string | null
  rawPayload: Record<string, unknown> | null
  expiredAt: Date | null
  createdAt: Date
}

const pendingPaymentColumns = {
  id: schema.payments.id,
  planCode: schema.payments.planCode,
  amount: schema.payments.amount,
  status: schema.payments.status,
  gatewayOrderId: schema.payments.gatewayOrderId,
  paymentUrl: schema.payments.paymentUrl,
  rawPayload: schema.payments.rawPayload,
  expiredAt: schema.payments.expiredAt,
  createdAt: schema.payments.createdAt,
} as const

export async function startPremiumCheckoutAction(
  planCode: PlanCode,
): Promise<PremiumActionResult<PremiumPaymentPayload>> {
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

  if (!isPaidPlanCode(planCode)) {
    return {
      success: false,
      code: "invalid_plan",
      message: "Pilih paket Pro atau Max untuk berlangganan.",
    }
  }

  const now = new Date()
  const pendingPayment = await getLatestPendingPayment(user.id)

  if (pendingPayment) {
    if (isExpired(pendingPayment.expiredAt, now)) {
      await markPaymentExpired(pendingPayment.id)
    } else {
      const payload = toPremiumPaymentPayload(pendingPayment)

      if (!payload.snapToken) {
        return {
          success: false,
          code: "pending_exists",
          message:
            "Masih ada pembayaran pending. Batalkan pembayaran tersebut sebelum membuat transaksi baru.",
        }
      }

      return {
        success: false,
        code: "pending_exists",
        message: "Masih ada pembayaran pending. Lanjutkan atau batalkan pembayaran tersebut.",
        data: {
          payment: payload,
          snapToken: payload.snapToken,
        },
      }
    }
  }

  const activeSubscription = await getActiveSubscriptionForCheckout(user.id, now)

  if (activeSubscription) {
    if (activeSubscription.planCode === planCode) {
      return {
        success: false,
        code: "active_plan",
        message: `Paket ${PLAN_CONFIG[planCode].name} sudah aktif.`,
      }
    }

    if (getPlanRank(activeSubscription.planCode) > getPlanRank(planCode)) {
      return {
        success: false,
        code: "downgrade_not_allowed",
        message: "Downgrade dari Max ke Pro tidak tersedia.",
      }
    }
  }

  const amount = getPlanFinalPrice(planCode)
  const orderId = createOrderId(user.id, planCode)
  const expiredAt = new Date(now.getTime() + PAYMENT_EXPIRY_MS)
  const rawPayload = {
    provider: "midtrans_snap",
    planCode,
    amount,
    createdFrom: "premium_pricing",
  }

  const [created] = await db
    .insert(schema.payments)
    .values({
      userId: user.id,
      planCode,
      amount,
      status: "pending",
      gateway: "midtrans",
      transactionSource: "user_checkout",
      gatewayOrderId: orderId,
      expiredAt,
      notes: `Checkout paket ${PLAN_CONFIG[planCode].name} dari halaman Premium.`,
      rawPayload,
    })
    .$returningId()

  try {
    const snap = await createMidtransSnapTransaction({
      transaction_details: {
        order_id: orderId,
        gross_amount: amount,
      },
      item_details: [
        {
          id: `plan-${planCode}`,
          price: amount,
          quantity: 1,
          name: `Nalarin ${PLAN_CONFIG[planCode].name} 1 Bulan`,
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

    const snapRawPayload = {
      ...rawPayload,
      snapToken: snap.token,
      snapRedirectUrl: snap.redirect_url,
    }

    await db
      .update(schema.payments)
      .set({
        paymentUrl: snap.redirect_url,
        rawPayload: snapRawPayload,
        updatedAt: new Date(),
      })
      .where(eq(schema.payments.id, created.id))

    revalidatePremiumPage()

    const payment: NonNullable<PremiumPendingPayment> = {
      id: created.id,
      planCode,
      planName: PLAN_CONFIG[planCode].name,
      amount,
      status: "pending",
      gatewayOrderId: orderId,
      paymentUrl: snap.redirect_url,
      snapToken: snap.token,
      expiredAt: expiredAt.toISOString(),
      createdAt: now.toISOString(),
    }

    return {
      success: true,
      data: {
        payment,
        snapToken: snap.token,
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
      message: "Gagal membuat transaksi Midtrans. Coba lagi beberapa saat.",
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

  if (!payload.snapToken) {
    return {
      success: false,
      code: "not_found",
      message: "Token pembayaran Midtrans tidak ditemukan.",
    }
  }

  return {
    success: true,
    data: {
      payment: payload,
      snapToken: payload.snapToken,
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

  if (payment.gatewayOrderId) {
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

async function getLatestPendingPayment(userId: number) {
  const [payment] = await db
    .select(pendingPaymentColumns)
    .from(schema.payments)
    .where(
      and(
        eq(schema.payments.userId, userId),
        eq(schema.payments.status, "pending"),
      ),
    )
    .orderBy(desc(schema.payments.createdAt))
    .limit(1)

  return payment && payment.status === "pending" ? (payment as PendingPaymentRow) : null
}

async function getPendingPaymentById(userId: number, paymentId: number) {
  const [payment] = await db
    .select(pendingPaymentColumns)
    .from(schema.payments)
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

async function getActiveSubscriptionForCheckout(userId: number, now: Date) {
  const [subscription] = await db
    .select({
      id: schema.subscriptions.id,
      planCode: schema.subscriptions.planCode,
    })
    .from(schema.subscriptions)
    .where(
      and(
        eq(schema.subscriptions.userId, userId),
        eq(schema.subscriptions.status, "active"),
        gt(schema.subscriptions.endsAt, now),
      ),
    )
    .orderBy(desc(schema.subscriptions.startsAt))
    .limit(1)

  return subscription ?? null
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

function createOrderId(userId: number, planCode: PlanCode) {
  const suffix = crypto.randomBytes(4).toString("hex")
  return `NAL-${userId}-${planCode}-${Date.now()}-${suffix}`
}

function revalidatePremiumPage() {
  revalidatePath(PREMIUM_PATH)
}
