import "server-only"

import crypto from "node:crypto"

import { env } from "@/config/env"
import { paymentMethodValues } from "@/db/schema"

export type MidtransNotificationPayload = {
  order_id: string
  transaction_id?: string
  transaction_status: string
  status_code: string
  gross_amount: string
  signature_key: string
  payment_type?: string
  fraud_status?: string
  settlement_time?: string
  transaction_time?: string
  expiry_time?: string
  merchant_id?: string
  status_message?: string
}

export type MidtransStatusResponse = MidtransNotificationPayload & {
  currency?: string
  permata_va_number?: string
  va_numbers?: Array<{ bank: string; va_number: string }>
  bill_key?: string
  bca_va_number?: string
}

export type MidtransPaymentMethod = (typeof paymentMethodValues)[number]

function buildBasicAuthValue() {
  return Buffer.from(`${env.MIDTRANS_SERVER_KEY}:`).toString("base64")
}

export function getMidtransBaseUrl() {
  return env.MIDTRANS_IS_PRODUCTION
    ? "https://api.midtrans.com"
    : "https://api.sandbox.midtrans.com"
}

export function verifyMidtransSignature(payload: MidtransNotificationPayload) {
  const signature = crypto
    .createHash("sha512")
    .update(
      `${payload.order_id}${payload.status_code}${payload.gross_amount}${env.MIDTRANS_SERVER_KEY}`,
    )
    .digest("hex")

  return signature === payload.signature_key
}

export function mapMidtransPaymentMethod(
  paymentType: string | undefined,
): MidtransPaymentMethod | null {
  if (!paymentType) {
    return null
  }

  if (
    paymentType === "bank_transfer" ||
    paymentType === "bca_va" ||
    paymentType === "bni_va" ||
    paymentType === "bri_va" ||
    paymentType === "echannel" ||
    paymentType === "permata_va" ||
    paymentType === "other_va"
  ) {
    return "bank_transfer"
  }

  if (paymentType === "qris") {
    return "qris"
  }

  if (paymentType === "credit_card") {
    return "credit_card"
  }

  if (
    paymentType === "gopay" ||
    paymentType === "shopeepay" ||
    paymentType === "dana" ||
    paymentType === "linkaja" ||
    paymentType === "ovo"
  ) {
    return "e_wallet"
  }

  if (paymentType === "cstore") {
    return "convenience_store"
  }

  return "other"
}

export async function fetchMidtransTransactionStatus(orderId: string) {
  const response = await fetch(
    `${getMidtransBaseUrl()}/v2/${encodeURIComponent(orderId)}/status`,
    {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Basic ${buildBasicAuthValue()}`,
      },
      cache: "no-store",
    },
  )

  if (!response.ok) {
    throw new Error(`Midtrans status request failed with ${response.status}.`)
  }

  return (await response.json()) as MidtransStatusResponse
}

export async function cancelMidtransTransaction(orderId: string) {
  const response = await fetch(
    `${getMidtransBaseUrl()}/v2/${encodeURIComponent(orderId)}/cancel`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Basic ${buildBasicAuthValue()}`,
      },
      cache: "no-store",
    },
  )

  if (!response.ok) {
    throw new Error(`Midtrans cancel request failed with ${response.status}.`)
  }

  return (await response.json()) as MidtransStatusResponse
}
