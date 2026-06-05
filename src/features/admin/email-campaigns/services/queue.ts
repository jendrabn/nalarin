import { Queue, type ConnectionOptions, type JobsOptions } from "bullmq"

import { env } from "@/config/env"

export const EMAIL_CAMPAIGN_QUEUE_NAME = "email-campaigns"
export const EMAIL_CAMPAIGN_SEND_JOB_NAME = "send-campaign-email"

export type EmailCampaignJobData = {
  campaignId: number
  recipientId: number
}

type EmailCampaignQueue = Queue<
  EmailCampaignJobData,
  unknown,
  typeof EMAIL_CAMPAIGN_SEND_JOB_NAME,
  EmailCampaignJobData,
  unknown,
  typeof EMAIL_CAMPAIGN_SEND_JOB_NAME
>

let queue: EmailCampaignQueue | null = null

function assertRedisUrl() {
  if (!env.REDIS_URL) {
    throw new Error("REDIS_URL is not configured for email campaign queue.")
  }

  return env.REDIS_URL
}

export function createEmailQueueConnection(): ConnectionOptions {
  const redisUrl = new URL(assertRedisUrl())
  const database = redisUrl.pathname.replace("/", "")

  return {
    host: redisUrl.hostname,
    port: redisUrl.port ? Number(redisUrl.port) : 6379,
    username: redisUrl.username ? decodeURIComponent(redisUrl.username) : undefined,
    password: redisUrl.password ? decodeURIComponent(redisUrl.password) : undefined,
    db: database ? Number(database) : undefined,
    tls: redisUrl.protocol === "rediss:" ? {} : undefined,
    maxRetriesPerRequest: null,
  }
}

export function getEmailCampaignQueue(): EmailCampaignQueue {
  if (queue) {
    return queue
  }

  queue = new Queue<
    EmailCampaignJobData,
    unknown,
    typeof EMAIL_CAMPAIGN_SEND_JOB_NAME,
    EmailCampaignJobData,
    unknown,
    typeof EMAIL_CAMPAIGN_SEND_JOB_NAME
  >(
    EMAIL_CAMPAIGN_QUEUE_NAME,
    {
      connection: createEmailQueueConnection(),
      defaultJobOptions: {
        attempts: env.EMAIL_QUEUE_ATTEMPTS,
        backoff: {
          type: "exponential",
          delay: 30_000,
        },
        removeOnComplete: {
          age: 60 * 60 * 24 * 7,
          count: 10_000,
        },
        removeOnFail: {
          age: 60 * 60 * 24 * 30,
          count: 50_000,
        },
      },
    },
  )

  return queue
}

function buildEmailCampaignJobId(
  campaignId: number,
  recipientId: number,
  retryKey?: string,
) {
  return [
    "email-campaign",
    String(campaignId),
    String(recipientId),
    retryKey,
  ]
    .filter(Boolean)
    .join(":")
}

export async function enqueueEmailCampaignRecipients({
  campaignId,
  recipientIds,
  retryKey,
}: {
  campaignId: number
  recipientIds: number[]
  retryKey?: string
}) {
  if (recipientIds.length === 0) {
    return []
  }

  const emailQueue = getEmailCampaignQueue()
  await emailQueue.waitUntilReady()

  const jobOptions: JobsOptions = {
    attempts: env.EMAIL_QUEUE_ATTEMPTS,
    backoff: {
      type: "exponential",
      delay: 30_000,
    },
  }

  const jobs = await emailQueue.addBulk(
    recipientIds.map((recipientId) => ({
      name: EMAIL_CAMPAIGN_SEND_JOB_NAME,
      data: {
        campaignId,
        recipientId,
      },
      opts: {
        ...jobOptions,
        jobId: buildEmailCampaignJobId(campaignId, recipientId, retryKey),
      },
    })),
  )

  return jobs.map((job) => ({
    recipientId: job.data.recipientId,
    jobId: String(job.id),
  }))
}
