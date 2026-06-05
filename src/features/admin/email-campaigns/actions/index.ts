"use server"

import { revalidatePath } from "next/cache"
import { and, eq, inArray } from "drizzle-orm"
import { z } from "zod"

import { db, schema } from "@/db"
import { requireAdmin } from "@/features/auth/services/session"

import {
  emailCampaignFormSchema,
  type EmailCampaignFormValues,
} from "../schemas"
import {
  emailHtmlToPlainText,
  sanitizeEmailCampaignHtml,
} from "../services/content"
import { syncEmailCampaignStats } from "../services/processor"
import {
  enqueueEmailCampaignRecipients,
  getEmailCampaignQueue,
} from "../services/queue"

type ActionError = {
  success: false
  message: string
  fieldErrors?: Partial<Record<keyof EmailCampaignFormValues, string[]>>
}

type ActionSuccess<T = unknown> = {
  success: true
  data: T
}

export type EmailCampaignActionResult<T = unknown> = ActionError | ActionSuccess<T>

function flattenZodError(error: z.ZodError<EmailCampaignFormValues>) {
  return error.flatten().fieldErrors as Partial<
    Record<keyof EmailCampaignFormValues, string[]>
  >
}

function parseEmailCampaignValues(values: EmailCampaignFormValues) {
  const validated = emailCampaignFormSchema.safeParse(values)

  if (!validated.success) {
    return {
      success: false as const,
      message: "Please fix the highlighted fields.",
      fieldErrors: flattenZodError(validated.error),
    }
  }

  const sanitizedHtml = sanitizeEmailCampaignHtml(validated.data.contentHtml)
  const plainText = emailHtmlToPlainText(sanitizedHtml)

  if (plainText.length < 10) {
    return {
      success: false as const,
      message: "Message content is too short after sanitization.",
      fieldErrors: {
        contentHtml: ["Message content is too short."],
      },
    }
  }

  return {
    success: true as const,
    data: {
      subject: validated.data.subject.trim(),
      contentHtml: sanitizedHtml,
      contentText: plainText,
      recipientIds: [...new Set(validated.data.recipientIds)],
    },
  }
}

function revalidateEmailCampaignRoutes(campaignId?: number) {
  revalidatePath("/admin/email-campaigns")
  revalidatePath("/admin/email-campaigns/create")

  if (campaignId) {
    revalidatePath(`/admin/email-campaigns/${campaignId}`)
  }
}

async function validateEmailQueueReady() {
  const emailQueue = getEmailCampaignQueue()
  await emailQueue.waitUntilReady()
}

async function markEnqueueFailure(campaignId: number, recipientIds: number[], error: unknown) {
  const message = error instanceof Error ? error.message : "Failed to enqueue email jobs."

  await db.transaction(async (tx) => {
    await tx
      .update(schema.emailCampaigns)
      .set({
        status: "failed",
        failedCount: recipientIds.length,
        completedAt: new Date(),
      })
      .where(eq(schema.emailCampaigns.id, campaignId))

    if (recipientIds.length > 0) {
      await tx
        .update(schema.emailCampaignRecipients)
        .set({
          status: "failed",
          lastError: message.slice(0, 1000),
        })
        .where(inArray(schema.emailCampaignRecipients.id, recipientIds))
    }
  })
}

export async function createEmailCampaignAction(
  values: EmailCampaignFormValues,
): Promise<EmailCampaignActionResult<{ id: number }>> {
  const admin = await requireAdmin()
  const parsed = parseEmailCampaignValues(values)

  if (!parsed.success) {
    return parsed
  }

  try {
    await validateEmailQueueReady()
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Email campaign queue is not available.",
    }
  }

  const users = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
    })
    .from(schema.users)
    .where(
      and(
        inArray(schema.users.id, parsed.data.recipientIds),
        eq(schema.users.status, "active"),
      ),
    )

  if (users.length !== parsed.data.recipientIds.length) {
    return {
      success: false,
      message: "Some selected users are inactive or were not found.",
      fieldErrors: {
        recipientIds: ["Select only active users."],
      },
    }
  }

  const created = await db.transaction(async (tx) => {
    const [campaign] = await tx
      .insert(schema.emailCampaigns)
      .values({
        subject: parsed.data.subject,
        contentHtml: parsed.data.contentHtml,
        contentText: parsed.data.contentText,
        totalRecipients: users.length,
        createdByAdminId: admin.id,
      })
      .$returningId()

    const recipients = await tx
      .insert(schema.emailCampaignRecipients)
      .values(
        users.map((user) => ({
          campaignId: campaign.id,
          userId: user.id,
          name: user.name,
          email: user.email,
        })),
      )
      .$returningId()

    return {
      campaignId: campaign.id,
      recipientIds: recipients.map((recipient) => recipient.id),
    }
  })

  try {
    const jobs = await enqueueEmailCampaignRecipients({
      campaignId: created.campaignId,
      recipientIds: created.recipientIds,
    })

    await Promise.all(
      jobs.map((job) =>
        db
          .update(schema.emailCampaignRecipients)
          .set({ bullJobId: job.jobId })
          .where(eq(schema.emailCampaignRecipients.id, job.recipientId)),
      ),
    )
  } catch (error) {
    await markEnqueueFailure(created.campaignId, created.recipientIds, error)

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to enqueue email campaign jobs.",
    }
  }

  revalidateEmailCampaignRoutes(created.campaignId)

  return {
    success: true,
    data: {
      id: created.campaignId,
    },
  }
}

export async function cancelEmailCampaignAction(
  campaignId: number,
): Promise<EmailCampaignActionResult<{ id: number; cancelledCount: number }>> {
  await requireAdmin()

  const [campaign] = await db
    .select({
      id: schema.emailCampaigns.id,
      status: schema.emailCampaigns.status,
    })
    .from(schema.emailCampaigns)
    .where(eq(schema.emailCampaigns.id, campaignId))
    .limit(1)

  if (!campaign) {
    return {
      success: false,
      message: "Email campaign not found.",
    }
  }

  if (campaign.status === "completed" || campaign.status === "cancelled") {
    return {
      success: false,
      message: "This campaign can no longer be cancelled.",
    }
  }

  const queuedRecipients = await db
    .select({
      id: schema.emailCampaignRecipients.id,
      bullJobId: schema.emailCampaignRecipients.bullJobId,
    })
    .from(schema.emailCampaignRecipients)
    .where(
      and(
        eq(schema.emailCampaignRecipients.campaignId, campaignId),
        eq(schema.emailCampaignRecipients.status, "queued"),
      ),
    )

  await db.transaction(async (tx) => {
    await tx
      .update(schema.emailCampaigns)
      .set({
        status: "cancelled",
        cancelledAt: new Date(),
      })
      .where(eq(schema.emailCampaigns.id, campaignId))

    if (queuedRecipients.length > 0) {
      await tx
        .update(schema.emailCampaignRecipients)
        .set({
          status: "cancelled",
          lastError: null,
        })
        .where(
          inArray(
            schema.emailCampaignRecipients.id,
            queuedRecipients.map((recipient) => recipient.id),
          ),
        )
    }
  })

  try {
    const emailQueue = getEmailCampaignQueue()
    await Promise.all(
      queuedRecipients
        .map((recipient) => recipient.bullJobId)
        .filter((jobId): jobId is string => Boolean(jobId))
        .map(async (jobId) => {
          const job = await emailQueue.getJob(jobId)
          await job?.remove()
        }),
    )
  } catch {
    // The database state is authoritative. If Redis is unavailable, active jobs
    // will skip sending because the campaign is marked as cancelled.
  }

  await syncEmailCampaignStats(campaignId)
  revalidateEmailCampaignRoutes(campaignId)

  return {
    success: true,
    data: {
      id: campaignId,
      cancelledCount: queuedRecipients.length,
    },
  }
}

export async function retryFailedEmailCampaignRecipientsAction(
  campaignId: number,
): Promise<EmailCampaignActionResult<{ id: number; queuedCount: number }>> {
  await requireAdmin()

  try {
    await validateEmailQueueReady()
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Email campaign queue is not available.",
    }
  }

  const failedRecipients = await db
    .select({
      id: schema.emailCampaignRecipients.id,
    })
    .from(schema.emailCampaignRecipients)
    .innerJoin(
      schema.emailCampaigns,
      eq(schema.emailCampaignRecipients.campaignId, schema.emailCampaigns.id),
    )
    .where(
      and(
        eq(schema.emailCampaignRecipients.campaignId, campaignId),
        eq(schema.emailCampaignRecipients.status, "failed"),
      ),
    )

  if (failedRecipients.length === 0) {
    return {
      success: false,
      message: "There are no failed recipients to retry.",
    }
  }

  const recipientIds = failedRecipients.map((recipient) => recipient.id)

  await db
    .update(schema.emailCampaignRecipients)
    .set({
      status: "queued",
      attempts: 0,
      lastError: null,
      bullJobId: null,
      sentAt: null,
    })
    .where(inArray(schema.emailCampaignRecipients.id, recipientIds))

  await syncEmailCampaignStats(campaignId)

  try {
    const jobs = await enqueueEmailCampaignRecipients({
      campaignId,
      recipientIds,
      retryKey: `retry-${Date.now()}`,
    })

    await Promise.all(
      jobs.map((job) =>
        db
          .update(schema.emailCampaignRecipients)
          .set({ bullJobId: job.jobId })
          .where(eq(schema.emailCampaignRecipients.id, job.recipientId)),
      ),
    )
  } catch (error) {
    await markEnqueueFailure(campaignId, recipientIds, error)

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to enqueue retry jobs.",
    }
  }

  revalidateEmailCampaignRoutes(campaignId)

  return {
    success: true,
    data: {
      id: campaignId,
      queuedCount: recipientIds.length,
    },
  }
}
