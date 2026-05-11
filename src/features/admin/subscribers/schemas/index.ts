import { z } from "zod"

export const subscriberGrantPlanValues = ["pro", "max"] as const

export const subscriberGrantFormSchema = z.object({
  userId: z.string().trim().min(1, "Select a user."),
  planCode: z.enum(subscriberGrantPlanValues),
  startsAt: z.string().trim().min(1, "Start date is required."),
  endsAt: z.string().trim().min(1, "End date is required."),
})

export type SubscriberGrantFormValues = z.infer<typeof subscriberGrantFormSchema>

