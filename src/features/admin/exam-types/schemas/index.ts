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
        value.startsWith("/images/") ||
        value.startsWith("/uploads/") ||
        value.startsWith("https://") ||
        value.startsWith("http://"),
      "Logo must be an uploaded file or a valid URL.",
    ),
  countdownTitle: z.string().trim().max(255, "Countdown title is too long."),
  countdownTargetAt: z.string().trim().max(32, "Countdown target is invalid."),
  registrationStartAt: z.string().trim().max(32, "Registration start is invalid."),
  registrationEndAt: z.string().trim().max(32, "Registration end is invalid."),
  examStartAt: z.string().trim().max(32, "Exam start is invalid."),
  examEndAt: z.string().trim().max(32, "Exam end is invalid."),
  announcementAt: z.string().trim().max(32, "Announcement time is invalid."),
  informationContent: z.string().trim().max(10000, "Information content is too long."),
})

export type ExamTypeFormValues = z.infer<typeof examTypeFormSchema>
