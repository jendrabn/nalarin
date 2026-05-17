import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { SiteFooter } from "@/components/site-footer"
import { SiteNavbar, type SiteUser } from "@/components/site-navbar"
import { ProfilePage } from "@/features/account/components/profile-page"
import { getAccountProfile } from "@/features/account/queries"
import { requireUser } from "@/features/auth/services/session"

export const metadata: Metadata = {
  title: "Profil",
  description:
    "Kelola profil, status plan, limit penggunaan, dan keamanan akun Nalarin.",
  openGraph: {
    title: "Profil | Nalarin",
    description:
      "Kelola profil, status plan, limit penggunaan, dan keamanan akun Nalarin.",
  },
}

export default async function Page() {
  const user = await requireUser()
  const profile = await getAccountProfile(user.id)

  if (!profile) {
    notFound()
  }

  const siteUser: NonNullable<SiteUser> = {
    name: user.name,
    email: user.email,
    avatarUrl: profile.user.avatarUrl,
    role: user.role,
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNavbar user={siteUser} />
      <ProfilePage profile={profile} />
      <SiteFooter />
    </div>
  )
}
