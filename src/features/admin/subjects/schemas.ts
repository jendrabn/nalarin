import { z } from "zod"

export const subjectFormSchema = z.object({
  examTypeId: z.string().trim().min(1, "Select an exam type."),
  name: z.string().trim().min(2, "Subject name is required.").max(150, "Subject name is too long."),
  description: z.string().trim().max(1000, "Description is too long.").default(""),
})

export type SubjectFormValues = z.infer<typeof subjectFormSchema>
