import { z } from "zod"

import { userRoleValues, userStatusValues } from "@/db/schema"

export const userRoleStatusFormSchema = z.object({
  role: z.enum(userRoleValues),
  status: z.enum(userStatusValues),
})

export type UserRoleStatusFormValues = z.infer<typeof userRoleStatusFormSchema>
