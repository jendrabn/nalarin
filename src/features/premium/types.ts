export type PremiumUser = {
  id: number
  name: string
  email: string
  isEmailVerified: boolean
}

export type PremiumSubscriptionSummary = {
  id: number
  examTypeId: number
  examTypeSlug: string
  examTypeName: string
  packageId: number
  packagePriceId: number
  packageName: string
  startsAt: string
  endsAt: string
}

export type PremiumSubscriptionState = {
  currentSubscriptions: PremiumSubscriptionSummary[]
  pendingPayment: PremiumPendingPayment
  pendingPayments: Array<NonNullable<PremiumPendingPayment>>
}

export type PremiumPendingPayment = {
  id: number
  examTypeId: number
  examTypeSlug: string
  examTypeName: string
  packageId: number
  packagePriceId: number
  packageName: string
  amount: number
  originalAmount: number
  discountAmount: number
  voucher: {
    id: number
    code: string
    name: string
    discountPercent: number
  } | null
  status: "pending"
  gateway: "midtrans" | "manual"
  gatewayOrderId: string | null
  paymentUrl: string | null
  snapToken: string | null
  expiredAt: string | null
  createdAt: string
} | null

export type ManualPaymentMethod = {
  id: "shopeepay" | "gopay" | "ovo"
  name: string
  phone: string
  logoSrc: string
}

export type ManualPaymentConfig = {
  whatsappNumber: string
  methods: ManualPaymentMethod[]
}

export type PremiumVoucherPreview = {
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

export type PublicVoucherPromo = {
  id: number
  code: string
  name: string
  discountPercent: number
  promoLabel: string | null
  promoDescription: string | null
  endsAt: string
}

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
        | "invalid_package"
        | "active_package"
        | "pending_exists"
        | "not_found"
        | "expired"
        | "gateway_error"
        | "voucher_invalid"
      message: string
      data?: T
    }

export type PremiumPaymentPayload = {
  payment: NonNullable<PremiumPendingPayment>
  snapToken: string | null
  paymentUrl: string | null
}
