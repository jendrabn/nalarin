import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { EmailCampaignDetailPage } from "@/features/admin/email-campaigns/components/email-campaign-detail-page"
import { getAdminEmailCampaignById } from "@/features/admin/email-campaigns/queries"
import { requireAdmin } from "@/features/auth/services/session"

type PageProps = {
  params: Promise<{
    campaignId: string
  }>
}

export const metadata: Metadata = {
  title: "Email Campaign",
  description: "Review email campaign queue and delivery status.",
}

export default async function Page({ params }: PageProps) {
  await requireAdmin()
  const { campaignId } = await params
  const id = Number(campaignId)

  if (!Number.isInteger(id) || id <= 0) {
    notFound()
  }

  const campaign = await getAdminEmailCampaignById(id)

  if (!campaign) {
    notFound()
  }

  return <EmailCampaignDetailPage campaign={campaign} backHref="/admin/email-campaigns" />
}
