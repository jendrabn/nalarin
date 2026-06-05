import { z } from "zod"

export const emailCampaignFormSchema = z.object({
  subject: z
    .string()
    .trim()
    .min(3, "Subject must be at least 3 characters.")
    .max(255, "Subject must be at most 255 characters."),
  contentHtml: z
    .string()
    .trim()
    .min(20, "Message content must be at least 20 characters."),
  recipientIds: z
    .array(z.number().int().positive())
    .min(1, "Select at least one recipient.")
    .max(5000, "A campaign can target at most 5000 recipients."),
})

export type EmailCampaignFormValues = z.input<typeof emailCampaignFormSchema>
export type EmailCampaignFormData = z.output<typeof emailCampaignFormSchema>
