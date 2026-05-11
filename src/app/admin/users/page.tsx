import type { Metadata } from "next"

import { UsersPage } from "@/features/admin/users/components/users-page"
import { getAdminUsers } from "@/features/admin/users/queries"
import { requireAdmin } from "@/features/auth/services/session"

export const metadata: Metadata = {
  title: "Users",
  description: "Manage user accounts, roles, statuses, and access.",
}

export default async function Page() {
  const [currentUser, users] = await Promise.all([requireAdmin(), getAdminUsers()])

  return <UsersPage users={users} currentUserId={currentUser.id} />
}
