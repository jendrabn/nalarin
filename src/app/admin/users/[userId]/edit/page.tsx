import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { UserDetailPage } from "@/features/admin/users/components/user-detail-page"
import { getAdminUserById } from "@/features/admin/users/queries"

type EditUserPageProps = {
  params: Promise<{
    userId: string
  }>
}

export async function generateMetadata({
  params,
}: EditUserPageProps): Promise<Metadata> {
  const { userId } = await params
  const id = Number(userId)

  if (!Number.isFinite(id)) {
    return {
      title: "Edit User",
      description: "Update user role and status to manage profile access.",
    }
  }

  const user = await getAdminUserById(id)

  return {
    title: user ? `Edit ${user.name}` : "Edit User",
    description: "Update user role and status to manage profile access.",
  }
}

export default async function Page({ params }: EditUserPageProps) {
  const { userId } = await params
  const id = Number(userId)

  if (!Number.isFinite(id)) {
    notFound()
  }

  const user = await getAdminUserById(id)

  if (!user) {
    notFound()
  }

  return (
    <UserDetailPage
      user={user}
      backHref="/admin/users"
      detailHref={`/admin/users/${id}`}
      openEditOnMount
    />
  )
}

