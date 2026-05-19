import { env } from "@/config/env"
import { SiteFooter } from "@/components/site-footer"
import { SiteNavbar, type SiteUser } from "@/components/site-navbar"
import { PageHeader } from "@/components/page-header"
import { getMidtransSnapScriptUrl } from "@/lib/midtrans"
import { getPricingPlanViews } from "@/lib/pricing-plans"
import type { CurrentUser } from "@/features/auth/services/session"

import { PremiumCheckout } from "./premium-checkout"
import { getPremiumSubscriptionState } from "../queries"
import type { ManualPaymentConfig, PremiumUser } from "../types"

type PremiumPageProps = {
  user: CurrentUser | null
}

export async function PremiumPage({ user }: PremiumPageProps) {
  const plans = getPricingPlanViews()
  const state = user
    ? await getPremiumSubscriptionState(user.id)
    : { currentSubscription: null, pendingPayment: null }
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
              title="Paket Premium"
              subtitle="Pilih paket belajar yang sesuai dengan targetmu untuk membuka latihan, tryout, pembahasan, dan fitur premium lainnya."
            />
          </div>

          <PremiumCheckout
            user={premiumUser}
            plans={plans}
            currentSubscription={state.currentSubscription}
            pendingPayment={state.pendingPayment}
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
