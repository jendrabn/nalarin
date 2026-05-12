import { env } from "@/config/env"
import { SiteFooter } from "@/components/site-footer"
import { SiteNavbar, type SiteUser } from "@/components/site-navbar"
import { getMidtransSnapScriptUrl } from "@/lib/midtrans"
import { getPricingPlanViews } from "@/lib/pricing-plans"
import type { CurrentUser } from "@/features/auth/services/session"

import { PremiumCheckout } from "./premium-checkout"
import { getPremiumSubscriptionState } from "../queries"
import type { PremiumUser } from "../types"

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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNavbar user={siteUser} />
      <main>
        <section className="bg-background pb-20 pt-8 sm:pb-24 sm:pt-10">
          <PremiumCheckout
            user={premiumUser}
            plans={plans}
            currentSubscription={state.currentSubscription}
            pendingPayment={state.pendingPayment}
            midtransClientKey={env.MIDTRANS_CLIENT_KEY}
            midtransSnapScriptUrl={getMidtransSnapScriptUrl()}
          />
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
