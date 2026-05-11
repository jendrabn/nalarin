import { z } from "zod"

export const manualSubscriptionPlanValues = ["pro", "max"] as const

export const manualSubscriptionFormSchema = z.object({
  userId: z.string().trim().min(1, "Select a user."),
  planCode: z.enum(manualSubscriptionPlanValues),
})

export type ManualSubscriptionFormValues = z.infer<
  typeof manualSubscriptionFormSchema
>
