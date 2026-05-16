import { z } from "zod"

export const subjectFormSchema = z.object({
  examTypeId: z.string().trim().min(1, "Select an exam type."),
  name: z.string().trim().min(2, "Subject name is required.").max(150, "Subject name is too long."),
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

export type SubjectFormValues = z.infer<typeof subjectFormSchema>
