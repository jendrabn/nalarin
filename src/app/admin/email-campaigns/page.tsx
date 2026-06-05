import type { Metadata } from "next"

import { EmailCampaignsPage } from "@/features/admin/email-campaigns/components/email-campaigns-page"
import { getAdminEmailCampaigns } from "@/features/admin/email-campaigns/queries"
import { requireAdmin } from "@/features/auth/services/session"

export const metadata: Metadata = {
  title: "Email Campaigns",
  description: "Create and monitor queued email campaigns.",
}

export default async function Page() {
  await requireAdmin()
  const campaigns = await getAdminEmailCampaigns()

  return <EmailCampaignsPage campaigns={campaigns} />
}
