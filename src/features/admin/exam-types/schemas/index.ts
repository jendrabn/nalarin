import { z } from "zod"

export const examTypeFormSchema = z.object({
  name: z.string().trim().min(2, "Exam type name is required.").max(100, "Exam type name is too long."),
  description: z.string().trim().max(1000, "Description is too long."),
  logoUrl: z
    .string()
    .trim()
    .max(2048, "Logo URL is too long.")
    .refine(
      (value) =>
        value === "" ||
        value.startsWith("/uploads/") ||
        value.startsWith("https://") ||
        value.startsWith("http://"),
      "Logo must be an uploaded file or a valid URL.",
    ),
})

export type ExamTypeFormValues = z.infer<typeof examTypeFormSchema>
