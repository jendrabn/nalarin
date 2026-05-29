import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { UserDetailPage } from "@/features/admin/users/components/user-detail-page"
import { getAdminUserById } from "@/features/admin/users/queries"

type UserDetailPageProps = {
  params: Promise<{
    userId: string
  }>
}

export async function generateMetadata({
  params,
}: UserDetailPageProps): Promise<Metadata> {
  const { userId } = await params
  const id = Number(userId)

  if (!Number.isFinite(id)) {
    return {
      title: "User Details",
      description: "Review this user account to manage profile data and access.",
    }
  }

  const user = await getAdminUserById(id)

  return {
    title: user ? `${user.name} - User Details` : "User Details",
    description: "Review this user account to manage profile data and access.",
  }
}

export default async function Page({ params }: UserDetailPageProps) {
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
    />
  )
}

