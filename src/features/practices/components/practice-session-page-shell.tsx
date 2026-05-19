import type { ReactNode } from "react"

import { SiteFooter } from "@/components/site-footer"
import { SiteNavbar, type SiteUser } from "@/components/site-navbar"

export function PracticeSessionPageShell({
  user,
  children,
}: {
  user: NonNullable<SiteUser>
  children: ReactNode
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNavbar user={user} />
      {children}
      <SiteFooter />
    </div>
  )
}
