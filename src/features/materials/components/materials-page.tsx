import { SiteFooter } from "@/components/site-footer"
import { SiteNavbar, type SiteUser } from "@/components/site-navbar"
import type { CurrentUser } from "@/features/auth/services/session"

import type { PublicMaterialDiscoveryData } from "../queries"
import { MaterialsExplorer } from "./materials-explorer"

type MaterialsPageProps = {
  user: CurrentUser | null
  premiumExamTypeIds: number[]
  data: PublicMaterialDiscoveryData
  selectedExamTypeSlug?: string
}

export function MaterialsPage({
  user,
  premiumExamTypeIds,
  data,
  selectedExamTypeSlug,
}: MaterialsPageProps) {
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
      <MaterialsExplorer
        data={data}
        premiumExamTypeIds={premiumExamTypeIds}
        selectedExamTypeSlug={selectedExamTypeSlug}
      />
      <SiteFooter />
    </div>
  )
}
