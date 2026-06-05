import type { Job } from "bullmq"
import { eq, sql } from "drizzle-orm"

import { db, schema } from "@/db"
import { env } from "@/config/env"

import { sendCampaignEmail } from "./delivery"
import type { EmailCampaignJobData } from "./queue"

function normalizeError(error: unknown) {
  if (error instanceof Error) {
    return error.message.slice(0, 1000)
  }

  return "Unknown email delivery error."
}

export async function syncEmailCampaignStats(campaignId: number) {
  const [stats] = await db
    .select({
      totalRecipients: sql<number>`count(*)`,
      sentCount: sql<number>`sum(case when ${schema.emailCampaignRecipients.status} = 'sent' then 1 else 0 end)`,
      failedCount: sql<number>`sum(case when ${schema.emailCampaignRecipients.status} = 'failed' then 1 else 0 end)`,
      cancelledCount: sql<number>`sum(case when ${schema.emailCampaignRecipients.status} = 'cancelled' then 1 else 0 end)`,
    })
    .from(schema.emailCampaignRecipients)
    .where(eq(schema.emailCampaignRecipients.campaignId, campaignId))

  const [campaign] = await db
    .select({
      status: schema.emailCampaigns.status,
    })
    .from(schema.emailCampaigns)
    .where(eq(schema.emailCampaigns.id, campaignId))
    .limit(1)

  if (!stats || !campaign) {
    return
  }

  const totalRecipients = Number(stats.totalRecipients ?? 0)
  const sentCount = Number(stats.sentCount ?? 0)
  const failedCount = Number(stats.failedCount ?? 0)
  const cancelledCount = Number(stats.cancelledCount ?? 0)
  const terminalCount = sentCount + failedCount + cancelledCount
  const isTerminal = totalRecipients > 0 && terminalCount >= totalRecipients
  const now = new Date()

  const nextStatus =
    campaign.status === "cancelled"
      ? "cancelled"
      : isTerminal
        ? failedCount > 0
          ? "failed"
          : "completed"
        : terminalCount > 0
          ? "sending"
          : campaign.status

  await db
    .update(schema.emailCampaigns)
    .set({
      status: nextStatus,
      totalRecipients,
      sentCount,
      failedCount,
      cancelledCount,
      completedAt: isTerminal ? now : null,
    })
    .where(eq(schema.emailCampaigns.id, campaignId))
}

export async function processEmailCampaignJob(job: Job<EmailCampaignJobData>) {
  const [record] = await db
    .select({
      campaignId: schema.emailCampaigns.id,
      campaignStatus: schema.emailCampaigns.status,
      subject: schema.emailCampaigns.subject,
      contentHtml: schema.emailCampaigns.contentHtml,
      contentText: schema.emailCampaigns.contentText,
      recipientId: schema.emailCampaignRecipients.id,
      recipientStatus: schema.emailCampaignRecipients.status,
      recipientEmail: schema.emailCampaignRecipients.email,
      recipientName: schema.emailCampaignRecipients.name,
    })
    .from(schema.emailCampaignRecipients)
    .innerJoin(
      schema.emailCampaigns,
      eq(schema.emailCampaignRecipients.campaignId, schema.emailCampaigns.id),
    )
    .where(eq(schema.emailCampaignRecipients.id, job.data.recipientId))
    .limit(1)

  if (!record || record.campaignId !== job.data.campaignId) {
    throw new Error("Email campaign recipient job target was not found.")
  }

  if (record.recipientStatus === "sent" || record.recipientStatus === "cancelled") {
    return { skipped: true }
  }

  if (record.campaignStatus === "cancelled") {
    await db
      .update(schema.emailCampaignRecipients)
      .set({
        status: "cancelled",
        lastError: null,
      })
      .where(eq(schema.emailCampaignRecipients.id, record.recipientId))

    await syncEmailCampaignStats(record.campaignId)
    return { cancelled: true }
  }

  const attemptNumber = job.attemptsMade + 1
  const isFinalAttempt = attemptNumber >= env.EMAIL_QUEUE_ATTEMPTS
  const now = new Date()

  await Promise.all([
    db
      .update(schema.emailCampaigns)
      .set({
        status: "sending",
        startedAt: now,
      })
      .where(eq(schema.emailCampaigns.id, record.campaignId)),
    db
      .update(schema.emailCampaignRecipients)
      .set({
        status: "sending",
        attempts: attemptNumber,
        lastError: null,
      })
      .where(eq(schema.emailCampaignRecipients.id, record.recipientId)),
  ])

  try {
    await sendCampaignEmail({
      to: record.recipientEmail,
      subject: record.subject,
      html: record.contentHtml,
      text: record.contentText,
    })

    await db
      .update(schema.emailCampaignRecipients)
      .set({
        status: "sent",
        attempts: attemptNumber,
        lastError: null,
        sentAt: new Date(),
      })
      .where(eq(schema.emailCampaignRecipients.id, record.recipientId))

    await syncEmailCampaignStats(record.campaignId)

    return { sent: true }
  } catch (error) {
    await db
      .update(schema.emailCampaignRecipients)
      .set({
        status: isFinalAttempt ? "failed" : "queued",
        attempts: attemptNumber,
        lastError: normalizeError(error),
      })
      .where(eq(schema.emailCampaignRecipients.id, record.recipientId))

    await syncEmailCampaignStats(record.campaignId)
    throw error
  }
}
