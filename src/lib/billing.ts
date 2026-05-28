import { paymentStatusValues } from "@/db/schema"

export type PaymentStatus = (typeof paymentStatusValues)[number]

export type PackageBenefitSnapshot = {
  examTypeId: number
  examTypeName: string
  examTypeSlug: string
  packageId: number
  packagePriceId: number
  durationMonths: number
  practiceQuotaPerMonth: number
  quizQuotaPerMonth: number
  tryoutQuotaPerMonth: number
  aiExplanationQuotaPerMonth: number
  premiumPracticesEnabled: boolean
  premiumTryoutsEnabled: boolean
  rankingEnabled: boolean
}

export type PackagePricingSnapshot = {
  price: number
  discountPercent: number
  packageDiscountAmount: number
  packageFinalPrice: number
}

export function getPackageDiscountAmount(price: number, discountPercent: number) {
  if (discountPercent <= 0) {
    return 0
  }

  return Math.min(Math.round((price * discountPercent) / 100), price)
}

export function getPackageFinalPrice(price: number, discountPercent: number) {
  return Math.max(price - getPackageDiscountAmount(price, discountPercent), 0)
}

export function getPackageEndDate(startAt: Date, durationMonths: number) {
  const endsAt = new Date(startAt)
  endsAt.setMonth(endsAt.getMonth() + Math.max(durationMonths, 1))
  return endsAt
}

export function getRenewalStartDate(activeEndsAt: Date | null, now = new Date()) {
  return activeEndsAt && activeEndsAt > now ? activeEndsAt : now
}

export function isUnlimitedQuota(value: number | null | undefined) {
  return value === null || value === undefined || value < 0
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
