import "dotenv/config"

import { Worker } from "bullmq"

import { env } from "@/config/env"
import {
  EMAIL_CAMPAIGN_QUEUE_NAME,
  createEmailQueueConnection,
  type EmailCampaignJobData,
} from "@/features/admin/email-campaigns/services/queue"
import { processEmailCampaignJob } from "@/features/admin/email-campaigns/services/processor"

const connection = createEmailQueueConnection()

const worker = new Worker<EmailCampaignJobData>(
  EMAIL_CAMPAIGN_QUEUE_NAME,
  processEmailCampaignJob,
  {
    connection,
    concurrency: env.EMAIL_QUEUE_CONCURRENCY,
    limiter: {
      max: env.EMAIL_QUEUE_RATE_LIMIT_PER_MINUTE,
      duration: 60_000,
    },
  },
)

worker.on("ready", () => {
  console.log(
    `Email campaign worker ready. queue=${EMAIL_CAMPAIGN_QUEUE_NAME} concurrency=${env.EMAIL_QUEUE_CONCURRENCY}`,
  )
})

worker.on("completed", (job) => {
  console.log(`Email campaign job completed. jobId=${job.id}`)
})

worker.on("failed", (job, error) => {
  console.error(
    `Email campaign job failed. jobId=${job?.id ?? "unknown"} message=${error.message}`,
  )
})

async function shutdown(signal: string) {
  console.log(`Email campaign worker received ${signal}. Closing...`)
  await worker.close()
  process.exit(0)
}

process.on("SIGINT", () => {
  void shutdown("SIGINT")
})

process.on("SIGTERM", () => {
  void shutdown("SIGTERM")
})
