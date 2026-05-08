"use client"

import { usePathname } from "next/navigation"

import {
  AdminSidebar,
  type AdminSidebarUser,
} from "@/components/layouts/admin-sidebar"
import { getAdminBreadcrumbs } from "@/components/layouts/admin-breadcrumbs"
import { AdminTopbar } from "@/components/layouts/admin-topbar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

type AdminPanelLayoutProps = {
  children: React.ReactNode
  user: AdminSidebarUser
  defaultSidebarOpen?: boolean
}

export function AdminPanelLayout({
  children,
  user,
  defaultSidebarOpen = true,
}: AdminPanelLayoutProps) {
  const pathname = usePathname()
  const breadcrumbs = getAdminBreadcrumbs(pathname)

  return (
    <SidebarProvider defaultOpen={defaultSidebarOpen}>
      <AdminSidebar user={user} />
      <SidebarInset className="min-w-0 overflow-hidden bg-background">
        <AdminTopbar breadcrumbs={breadcrumbs} />
        <div className="relative flex flex-1 flex-col overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,var(--primary)_0,transparent_28%),linear-gradient(135deg,var(--secondary),transparent_36%)] opacity-[0.09]" />
          <div className="relative z-0 flex w-full flex-1 flex-col px-4 py-6 sm:px-5 lg:px-6">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
