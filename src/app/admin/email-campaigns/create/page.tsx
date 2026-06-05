import type { Metadata } from "next"

import { EmailCampaignFormPage } from "@/features/admin/email-campaigns/components/email-campaign-form-page"
import { getEmailCampaignSelectableUsers } from "@/features/admin/email-campaigns/queries"
import { requireAdmin } from "@/features/auth/services/session"

export const metadata: Metadata = {
  title: "New Email Campaign",
  description: "Create a queued email campaign for selected users.",
}

export default async function Page() {
  await requireAdmin()
  const users = await getEmailCampaignSelectableUsers()

  return <EmailCampaignFormPage users={users} />
}
