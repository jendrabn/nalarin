import { z } from "zod"

export const examTypeFormSchema = z.object({
  name: z.string().trim().min(2, "Exam type name is required.").max(100, "Exam type name is too long."),
  description: z.string().trim().max(1000, "Description is too long.").default(""),
})

export type ExamTypeFormValues = z.infer<typeof examTypeFormSchema>
