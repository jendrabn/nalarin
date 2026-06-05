import type {
  emailCampaignRecipientStatusValues,
  emailCampaignStatusValues,
} from "@/db/schema"

export type EmailCampaignStatus = (typeof emailCampaignStatusValues)[number]
export type EmailCampaignRecipientStatus =
  (typeof emailCampaignRecipientStatusValues)[number]

export const emailCampaignStatusLabels: Record<EmailCampaignStatus, string> = {
  queued: "Queued",
  sending: "Sending",
  completed: "Completed",
  failed: "Failed",
  cancelled: "Cancelled",
}

export const emailCampaignRecipientStatusLabels: Record<
  EmailCampaignRecipientStatus,
  string
> = {
  queued: "Queued",
  sending: "Sending",
  sent: "Sent",
  failed: "Failed",
  cancelled: "Cancelled",
}

export const emailCampaignColumnLabels = {
  subject: "Subject",
  status: "Status",
  totalRecipients: "Recipients",
  sentCount: "Sent",
  failedCount: "Failed",
  cancelledCount: "Cancelled",
  createdByAdminName: "Created By",
  createdAt: "Created At",
  updatedAt: "Updated At",
} as const

export const emailCampaignRecipientColumnLabels = {
  name: "Name",
  email: "Email",
  status: "Status",
  attempts: "Attempts",
  sentAt: "Sent At",
  updatedAt: "Updated At",
} as const
