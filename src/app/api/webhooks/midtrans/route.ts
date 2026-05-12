import { NextResponse } from "next/server"

import { eq } from "drizzle-orm"

import { db, schema } from "@/db"
import {
  mapMidtransStatusToPaymentStatus,
  isMidtransSuccessStatus,
} from "@/lib/billing"
import {
  mapMidtransPaymentMethod,
  type MidtransNotificationPayload,
  verifyMidtransSignature,
} from "@/lib/midtrans"

import { activatePaymentSubscription } from "@/features/admin/payments/services/payment-workflow"
import { getPaymentByGatewayOrderId } from "@/features/admin/payments/queries"

function toJsonObject(payload: unknown) {
  if (typeof payload === "object" && payload !== null) {
    return payload as Record<string, unknown>
  }

  return null
}

function mergeMidtransNotificationPayload(
  currentPayload: Record<string, unknown> | null,
  notificationPayload: Record<string, unknown> | null,
) {
  return {
    ...(currentPayload ?? {}),
    midtransNotification: notificationPayload,
  }
}

export async function POST(request: Request) {
  let payload: MidtransNotificationPayload

  try {
    payload = (await request.json()) as MidtransNotificationPayload
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON payload." },
      { status: 400 },
    )
  }

  if (!verifyMidtransSignature(payload)) {
    return NextResponse.json(
      { success: false, message: "Invalid signature." },
      { status: 403 },
    )
  }

  const payment = await getPaymentByGatewayOrderId(payload.order_id)

  if (!payment) {
    return NextResponse.json({
      success: true,
      message: "Payment not found. Webhook ignored.",
    })
  }

  if (payment.status === "cancelled") {
    return NextResponse.json({
      success: true,
      message: "Cancelled payment ignored.",
    })
  }

  const nextStatus = mapMidtransStatusToPaymentStatus(payload.transaction_status)
  const paymentMethod = mapMidtransPaymentMethod(payload.payment_type)
  const rawPayload = toJsonObject(payload)
  const mergedRawPayload = mergeMidtransNotificationPayload(payment.rawPayload, rawPayload)
  const paidAt =
    payload.settlement_time || payload.transaction_time
      ? new Date(payload.settlement_time ?? payload.transaction_time ?? new Date())
      : new Date()

  if (isMidtransSuccessStatus(payload.transaction_status)) {
    const result = await activatePaymentSubscription(payment, {
      mode: "midtrans",
      paidAt,
      gatewayTransactionId: payload.transaction_id ?? payment.gatewayTransactionId,
      gatewayOrderId: payload.order_id,
      paymentMethod,
      rawPayload: mergedRawPayload,
      allowAttachToExistingActiveSubscription: true,
    })

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: result.message,
        },
        { status: 409 },
      )
    }

    return NextResponse.json({
      success: true,
      status: "paid",
      subscriptionId: result.data.subscriptionId,
      attachedExistingSubscription: result.data.attachedExistingSubscription,
      createdSubscription: result.data.createdSubscription,
    })
  }

  if (payment.status === "paid" && nextStatus !== "refunded") {
    return NextResponse.json({
      success: true,
      message: "Payment already paid. Status update skipped.",
    })
  }

  await db
    .update(schema.payments)
    .set({
      status: nextStatus,
      gatewayTransactionId: payload.transaction_id ?? payment.gatewayTransactionId,
      paymentMethod: paymentMethod ?? payment.paymentMethod,
      rawPayload: mergedRawPayload,
      expiredAt: payload.expiry_time ? new Date(payload.expiry_time) : payment.expiredAt,
      updatedAt: new Date(),
    })
    .where(eq(schema.payments.id, payment.id))

  return NextResponse.json({
    success: true,
    status: nextStatus,
  })
}
