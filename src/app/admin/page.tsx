import type { Metadata } from "next"

import { AdminDashboardPage } from "@/features/admin/dashboard/components/admin-dashboard-page"
import { getAdminDashboardData } from "@/features/admin/dashboard/queries"

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Operational dashboard for learning activity, subscriptions, payments, content management, and admin workflows.",
}

export default async function AdminPage() {
  const data = await getAdminDashboardData()

  return <AdminDashboardPage data={data} />
}
