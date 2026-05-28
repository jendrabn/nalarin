import { z } from "zod"

const uploadableUrlSchema = (label: string) =>
  z
    .string()
    .trim()
    .max(2048, `${label} URL is too long.`)
    .refine(
      (value) =>
        value === "" ||
        value.startsWith("/images/") ||
        value.startsWith("/uploads/") ||
        value.startsWith("https://") ||
        value.startsWith("http://"),
      `${label} must be an uploaded file or a valid URL.`,
    )

export const examTypeFormSchema = z.object({
  name: z.string().trim().min(2, "Exam type name is required.").max(100, "Exam type name is too long."),
  description: z.string().trim().max(1000, "Description is too long."),
  logoUrl: uploadableUrlSchema("Logo"),
  coverUrl: uploadableUrlSchema("Cover"),
  packageIsActive: z.boolean(),
  packagePrice: z.number().int().min(0, "Price must be zero or more."),
  packageDiscountPercent: z
    .number()
    .int()
    .min(0, "Discount cannot be below 0%.")
    .max(100, "Discount cannot exceed 100%."),
  packageDurationMonths: z
    .number()
    .int()
    .min(1, "Duration must be at least 1 month.")
    .max(120, "Duration is too long."),
  practiceQuotaPerMonth: z.number().int().min(-1, "Use -1 for unlimited or zero and above."),
  quizQuotaPerMonth: z.number().int().min(-1, "Use -1 for unlimited or zero and above."),
  tryoutQuotaPerMonth: z.number().int().min(-1, "Use -1 for unlimited or zero and above."),
  aiExplanationQuotaPerMonth: z.number().int().min(-1, "Use -1 for unlimited or zero and above."),
  premiumPracticesEnabled: z.boolean(),
  premiumTryoutsEnabled: z.boolean(),
  rankingEnabled: z.boolean(),
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
