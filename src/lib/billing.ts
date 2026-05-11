import { PLAN_CONFIG, type PlanCode } from "@/config/plans"
import { paymentStatusValues } from "@/db/schema"

export type PaymentStatus = (typeof paymentStatusValues)[number]

export function getPlanDurationDays(planCode: PlanCode) {
  return PLAN_CONFIG[planCode].durationDays ?? 0
}

export function isPaidPlanCode(planCode: PlanCode) {
  return planCode !== "free"
}

export function getPlanBasePrice(planCode: PlanCode) {
  return PLAN_CONFIG[planCode].price
}

export function getPlanDiscountAmount(planCode: PlanCode) {
  const plan = PLAN_CONFIG[planCode]

  if (plan.discountPercent <= 0) {
    return 0
  }

  return Math.round((plan.price * plan.discountPercent) / 100)
}

export function getPlanFinalPrice(planCode: PlanCode) {
  return Math.max(getPlanBasePrice(planCode) - getPlanDiscountAmount(planCode), 0)
}

export function getPlanEndDate(startAt: Date, planCode: PlanCode) {
  const endsAt = new Date(startAt)
  endsAt.setDate(endsAt.getDate() + getPlanDurationDays(planCode))
  return endsAt
}

export function getPlanStartAndEndDate(planCode: PlanCode, startAt = new Date()) {
  return {
    startsAt: new Date(startAt),
    endsAt: getPlanEndDate(startAt, planCode),
  }
}

export function mapMidtransStatusToPaymentStatus(
  transactionStatus: string,
): PaymentStatus {
  switch (transactionStatus) {
    case "capture":
    case "settlement":
    case "authorize":
      return "paid"
    case "pending":
    case "challenge":
      return "pending"
    case "deny":
      return "failed"
    case "cancel":
      return "cancelled"
    case "expire":
      return "expired"
    case "refund":
    case "partial_refund":
    case "chargeback":
      return "refunded"
    default:
      return "pending"
  }
}

export function isMidtransSuccessStatus(transactionStatus: string) {
  return ["capture", "settlement", "authorize"].includes(transactionStatus)
}
