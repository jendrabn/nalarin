import type { PlanCode } from "@/config/plans"
import { SiteFooter } from "@/components/site-footer"
import { SiteNavbar, type SiteUser } from "@/components/site-navbar"
import type { CurrentUser } from "@/features/auth/services/session"

import type { PracticeDiscoveryData } from "../queries"
import { PracticesExplorer } from "./practices-explorer"

type PracticesPageProps = {
  user: CurrentUser | null
  currentPlanCode: PlanCode
  data: PracticeDiscoveryData
}

export function PracticesPage({ user, currentPlanCode, data }: PracticesPageProps) {
  const siteUser = user
    ? ({
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        role: user.role,
      } satisfies NonNullable<SiteUser>)
    : null

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNavbar user={siteUser} />
      <PracticesExplorer
        data={data}
        user={
          user
            ? {
                id: user.id,
                name: user.name,
                email: user.email,
                isEmailVerified: Boolean(user.emailVerifiedAt),
              }
            : null
        }
        currentPlanCode={currentPlanCode}
      />
      <SiteFooter />
    </div>
  )
}
