import { SiteFooter } from "@/components/site-footer"
import { SiteNavbar, type SiteUser } from "@/components/site-navbar"
import { requireUser } from "@/features/auth/services/session"

export default async function ProgressLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const user = await requireUser()

  const siteUser: NonNullable<SiteUser> = {
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    role: user.role,
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNavbar user={siteUser} />
      <main>{children}</main>
      <SiteFooter />
    </div>
  )
}
