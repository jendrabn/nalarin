import type { PlanCode } from "@/config/plans"

export type PremiumUser = {
  id: number
  name: string
  email: string
  isEmailVerified: boolean
}

export type PremiumSubscriptionSummary = {
  id: number
  planCode: PlanCode
  planName: string
  startsAt: string
  endsAt: string
} | null

export type PremiumPendingPayment = {
  id: number
  planCode: PlanCode
  planName: string
  amount: number
  status: "pending"
  gatewayOrderId: string | null
  paymentUrl: string | null
  snapToken: string | null
  expiredAt: string | null
  createdAt: string
} | null

export type PremiumActionResult<T = undefined> =
  | {
      success: true
      data: T
    }
  | {
      success: false
      code?:
        | "unauthenticated"
        | "email_unverified"
        | "invalid_plan"
        | "active_plan"
        | "downgrade_not_allowed"
        | "pending_exists"
        | "not_found"
        | "expired"
        | "gateway_error"
      message: string
      data?: T
    }

export type PremiumPaymentPayload = {
  payment: NonNullable<PremiumPendingPayment>
  snapToken: string
}
