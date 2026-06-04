import { env } from "@/config/env"
import { SiteFooter } from "@/components/site-footer"
import { SiteNavbar, type SiteUser } from "@/components/site-navbar"
import { PageHeader } from "@/components/page-header"
import { getMidtransSnapScriptUrl } from "@/lib/midtrans"
import { getPricingPlanViews } from "@/lib/pricing-plans"
import type { CurrentUser } from "@/features/auth/services/session"
import { getPublicVoucherPromos } from "@/features/vouchers/services"

import { PremiumCheckout } from "./premium-checkout"
import { PublicVoucherList } from "./public-voucher-list"
import { getPremiumSubscriptionState } from "../queries"
import type { ManualPaymentConfig, PremiumUser } from "../types"

type PremiumPageProps = {
  user: CurrentUser | null
}

export async function PremiumPage({ user }: PremiumPageProps) {
  const [plans, state, publicVouchers] = await Promise.all([
    getPricingPlanViews(),
    user
      ? getPremiumSubscriptionState(user.id)
      : Promise.resolve({
          currentSubscriptions: [],
          pendingPayment: null,
          pendingPayments: [],
        }),
    getPublicVoucherPromos(),
  ])
  const siteUser: SiteUser = user
    ? {
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        role: user.role,
      }
    : null
  const premiumUser: PremiumUser | null = user
    ? {
        id: user.id,
        name: user.name,
        email: user.email,
        isEmailVerified: Boolean(user.emailVerifiedAt),
      }
    : null
  const manualPayment: ManualPaymentConfig = {
    whatsappNumber: env.MANUAL_PAYMENT_WHATSAPP_NUMBER ?? "",
    methods: [
      {
        id: "shopeepay",
        name: "ShopeePay",
        phone: env.EWALLET_SHOPEEPAY_PHONE ?? "",
        logoSrc: "/images/payments/shopeepay.svg",
      },
      {
        id: "gopay",
        name: "GoPay",
        phone: env.EWALLET_GOPAY_PHONE ?? "",
        logoSrc: "/images/payments/gopay.svg",
      },
      {
        id: "ovo",
        name: "OVO",
        phone: env.EWALLET_OVO_PHONE ?? "",
        logoSrc: "/images/payments/ovo.svg",
      },
    ],
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNavbar user={siteUser} />
      <main>
        <section className="bg-background pb-20 pt-8 sm:pb-24 sm:pt-10">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <PageHeader
              className="mb-0"
              title="Paket Belajar Premium"
              subtitle="Pilih paket belajar sesuai jenis ujian untuk membuka latihan premium, tryout, ranking, dan pembahasan AI."
            />
          </div>

          <PublicVoucherList vouchers={publicVouchers} />

          <PremiumCheckout
            user={premiumUser}
            plans={plans}
            currentSubscriptions={state.currentSubscriptions}
            pendingPayments={state.pendingPayments}
            paymentGatewayEnabled={env.PAYMENT_GATEWAY_ENABLED}
            manualPayment={manualPayment}
            midtransClientKey={env.MIDTRANS_CLIENT_KEY ?? null}
            midtransSnapScriptUrl={
              env.PAYMENT_GATEWAY_ENABLED ? getMidtransSnapScriptUrl() : null
            }
          />
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
