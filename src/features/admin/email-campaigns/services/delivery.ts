import nodemailer from "nodemailer"

import { env } from "@/config/env"

type SendCampaignEmailInput = {
  to: string
  subject: string
  html: string
  text: string
}

function getMailFrom() {
  return env.EMAIL_PROVIDER === "smtp" ? env.SMTP_FROM ?? env.MAIL_FROM : env.MAIL_FROM
}

async function sendWithResend(input: SendCampaignEmailInput) {
  if (!env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured.")
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getMailFrom(),
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Resend rejected the email: ${body}`)
  }
}

async function sendWithSmtp(input: SendCampaignEmailInput) {
  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASSWORD,
    },
  })

  await transporter.sendMail({
    from: getMailFrom(),
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  })
}

export async function sendCampaignEmail(input: SendCampaignEmailInput) {
  if (env.EMAIL_PROVIDER === "resend") {
    await sendWithResend(input)
    return
  }

  await sendWithSmtp(input)
}
