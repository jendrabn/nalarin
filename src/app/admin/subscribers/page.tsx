import type { Metadata } from "next"

import { SubscribersPage } from "@/features/admin/subscribers/components/subscribers-page"
import { getAdminSubscriptions } from "@/features/admin/subscribers/queries"

export const metadata: Metadata = {
  title: "Subscribers",
  description: "Manage subscription records, manual grants, and downgrades.",
}

export default async function Page() {
  const subscriptions = await getAdminSubscriptions()

  return <SubscribersPage subscriptions={subscriptions} />
}
