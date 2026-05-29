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

export type MidtransSnapTransactionPayload = {
  transaction_details: {
    order_id: string
    gross_amount: number
  }
  item_details?: Array<{
    id: string
    price: number
    quantity: number
    name: string
  }>
  customer_details?: {
    first_name?: string
    email?: string
  }
  callbacks?: {
    finish?: string
  }
  expiry?: {
    unit: "minute" | "hour" | "day"
    duration: number
  }
}

export type MidtransSnapTransactionResponse = {
  token: string
  redirect_url: string
}

export type MidtransPaymentMethod = (typeof paymentMethodValues)[number]

function getMidtransServerKey() {
  if (!env.MIDTRANS_SERVER_KEY) {
    throw new Error("MIDTRANS_SERVER_KEY is required for Midtrans requests.")
  }

  return env.MIDTRANS_SERVER_KEY
}

function buildBasicAuthValue() {
  return Buffer.from(`${getMidtransServerKey()}:`).toString("base64")
}

export function getMidtransBaseUrl() {
  return env.MIDTRANS_IS_PRODUCTION
    ? "https://api.midtrans.com"
    : "https://api.sandbox.midtrans.com"
}

export function getMidtransSnapBaseUrl() {
  return env.MIDTRANS_IS_PRODUCTION
    ? "https://app.midtrans.com"
    : "https://app.sandbox.midtrans.com"
}

export function getMidtransSnapScriptUrl() {
  return `${getMidtransSnapBaseUrl()}/snap/snap.js`
}

export function verifyMidtransSignature(payload: MidtransNotificationPayload) {
  const signature = crypto
    .createHash("sha512")
    .update(
      `${payload.order_id}${payload.status_code}${payload.gross_amount}${getMidtransServerKey()}`,
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

export async function createMidtransSnapTransaction(
  payload: MidtransSnapTransactionPayload,
) {
  const response = await fetch(`${getMidtransSnapBaseUrl()}/snap/v1/transactions`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Basic ${buildBasicAuthValue()}`,
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  })

  if (!response.ok) {
    const responseText = await response.text()
    let responseMessage = responseText.trim()

    try {
      const parsed = JSON.parse(responseText) as {
        status_message?: string
        message?: string
      }

      responseMessage = parsed.status_message ?? parsed.message ?? responseMessage
    } catch {
      // Keep the raw text as fallback.
    }

    const detail = responseMessage ? `: ${responseMessage}` : ""
    throw new Error(`Midtrans Snap request failed with ${response.status}${detail}.`)
  }

  const data = (await response.json()) as MidtransSnapTransactionResponse

  if (!data.token || !data.redirect_url) {
    throw new Error("Midtrans Snap response missing token or redirect_url.")
  }

  return data
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
