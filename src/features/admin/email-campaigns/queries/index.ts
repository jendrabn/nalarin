"use server"

import "server-only"

import { asc, desc, eq, sql } from "drizzle-orm"

import { db, schema } from "@/db"

import type {
  EmailCampaignRecipientStatus,
  EmailCampaignStatus,
} from "../constants"

export type AdminEmailCampaignRow = {
  id: number
  subject: string
  status: EmailCampaignStatus
  totalRecipients: number
  sentCount: number
  failedCount: number
  cancelledCount: number
  createdAt: Date
  updatedAt: Date
  startedAt: Date | null
  completedAt: Date | null
  cancelledAt: Date | null
}

export type AdminEmailCampaignRecipientRow = {
  id: number
  userId: number | null
  name: string
  email: string
  status: EmailCampaignRecipientStatus
  bullJobId: string | null
  attempts: number
  lastError: string | null
  sentAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export type AdminEmailCampaignDetails = AdminEmailCampaignRow & {
  contentHtml: string
  contentText: string
  recipients: AdminEmailCampaignRecipientRow[]
}

export type EmailCampaignSelectableUser = {
  id: number
  name: string
  email: string
  role: "user" | "admin"
  status: "active" | "inactive" | "suspended"
  gender: "male" | "female" | null
  phoneNumber: string | null
  activePackageName: string | null
  createdAt: Date
}

function mapCampaignRow(row: {
  id: number
  subject: string
  status: EmailCampaignStatus
  totalRecipients: number
  sentCount: number
  failedCount: number
  cancelledCount: number
  createdAt: Date
  updatedAt: Date
  startedAt: Date | null
  completedAt: Date | null
  cancelledAt: Date | null
}): AdminEmailCampaignRow {
  return {
    ...row,
    startedAt: row.startedAt ?? null,
    completedAt: row.completedAt ?? null,
    cancelledAt: row.cancelledAt ?? null,
  }
}

export async function getAdminEmailCampaigns() {
  const rows = await db
    .select({
      id: schema.emailCampaigns.id,
      subject: schema.emailCampaigns.subject,
      status: schema.emailCampaigns.status,
      totalRecipients: schema.emailCampaigns.totalRecipients,
      sentCount: schema.emailCampaigns.sentCount,
      failedCount: schema.emailCampaigns.failedCount,
      cancelledCount: schema.emailCampaigns.cancelledCount,
      createdAt: schema.emailCampaigns.createdAt,
      updatedAt: schema.emailCampaigns.updatedAt,
      startedAt: schema.emailCampaigns.startedAt,
      completedAt: schema.emailCampaigns.completedAt,
      cancelledAt: schema.emailCampaigns.cancelledAt,
    })
    .from(schema.emailCampaigns)
    .orderBy(desc(schema.emailCampaigns.createdAt))

  return rows.map(mapCampaignRow)
}

export async function getAdminEmailCampaignById(id: number) {
  const [campaign] = await db
    .select({
      id: schema.emailCampaigns.id,
      subject: schema.emailCampaigns.subject,
      contentHtml: schema.emailCampaigns.contentHtml,
      contentText: schema.emailCampaigns.contentText,
      status: schema.emailCampaigns.status,
      totalRecipients: schema.emailCampaigns.totalRecipients,
      sentCount: schema.emailCampaigns.sentCount,
      failedCount: schema.emailCampaigns.failedCount,
      cancelledCount: schema.emailCampaigns.cancelledCount,
      createdAt: schema.emailCampaigns.createdAt,
      updatedAt: schema.emailCampaigns.updatedAt,
      startedAt: schema.emailCampaigns.startedAt,
      completedAt: schema.emailCampaigns.completedAt,
      cancelledAt: schema.emailCampaigns.cancelledAt,
    })
    .from(schema.emailCampaigns)
    .where(eq(schema.emailCampaigns.id, id))
    .limit(1)

  if (!campaign) {
    return null
  }

  const recipients = await db
    .select({
      id: schema.emailCampaignRecipients.id,
      userId: schema.emailCampaignRecipients.userId,
      name: schema.emailCampaignRecipients.name,
      email: schema.emailCampaignRecipients.email,
      status: schema.emailCampaignRecipients.status,
      bullJobId: schema.emailCampaignRecipients.bullJobId,
      attempts: schema.emailCampaignRecipients.attempts,
      lastError: schema.emailCampaignRecipients.lastError,
      sentAt: schema.emailCampaignRecipients.sentAt,
      createdAt: schema.emailCampaignRecipients.createdAt,
      updatedAt: schema.emailCampaignRecipients.updatedAt,
    })
    .from(schema.emailCampaignRecipients)
    .where(eq(schema.emailCampaignRecipients.campaignId, id))
    .orderBy(asc(schema.emailCampaignRecipients.createdAt))

  return {
    ...mapCampaignRow(campaign),
    contentHtml: campaign.contentHtml,
    contentText: campaign.contentText,
    recipients: recipients.map((recipient) => ({
      ...recipient,
      userId: recipient.userId ?? null,
      bullJobId: recipient.bullJobId ?? null,
      lastError: recipient.lastError ?? null,
      sentAt: recipient.sentAt ?? null,
    })),
  } satisfies AdminEmailCampaignDetails
}

export async function getEmailCampaignSelectableUsers() {
  const [users, activeSubscriptions] = await Promise.all([
    db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        role: schema.users.role,
        status: schema.users.status,
        gender: schema.users.gender,
        phoneNumber: schema.users.phoneNumber,
        createdAt: schema.users.createdAt,
      })
      .from(schema.users)
      .orderBy(desc(schema.users.createdAt)),
    db
      .select({
        userId: schema.subscriptions.userId,
        examTypeName: schema.examTypes.name,
        packageName: sql<string | null>`null`,
      })
      .from(schema.subscriptions)
      .leftJoin(schema.examTypes, eq(schema.subscriptions.examTypeId, schema.examTypes.id))
      .leftJoin(
        schema.examTypePackages,
        eq(schema.subscriptions.packageId, schema.examTypePackages.id),
      )
      .where(eq(schema.subscriptions.status, "active"))
      .orderBy(desc(schema.subscriptions.endsAt)),
  ])

  const activePackageMap = new Map<number, string>()

  for (const subscription of activeSubscriptions) {
    if (!activePackageMap.has(subscription.userId)) {
      const packageLabel = subscription.examTypeName ?? subscription.packageName

      if (packageLabel) {
        activePackageMap.set(subscription.userId, packageLabel)
      }
    }
  }

  return users.map<EmailCampaignSelectableUser>((user) => ({
    ...user,
    gender: user.gender ?? null,
    phoneNumber: user.phoneNumber ?? null,
    activePackageName: activePackageMap.get(user.id) ?? null,
  }))
}
