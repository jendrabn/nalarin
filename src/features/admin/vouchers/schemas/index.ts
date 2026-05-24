import { z } from "zod"

const nullableText = z.string().trim()

export const voucherFormSchema = z
  .object({
    name: z.string().trim().min(1, "Voucher name is required."),
    code: z
      .string()
      .trim()
      .min(3, "Voucher code must be at least 3 characters.")
      .max(64, "Voucher code must be at most 64 characters.")
      .regex(/^[A-Z0-9-]+$/i, "Code can only contain letters, numbers, and hyphens."),
    startsAt: z.string().trim().min(1, "Start time is required."),
    endsAt: z.string().trim().min(1, "End time is required."),
    discountPercent: z
      .number()
      .int()
      .min(1, "Discount must be at least 1%.")
      .max(99, "Discount must be at most 99% so payment is still required."),
    isPublic: z.boolean(),
    promoLabel: nullableText,
    promoDescription: nullableText,
    isActive: z.boolean(),
    internalNotes: nullableText,
  })
  .superRefine((values, context) => {
    const startsAt = new Date(values.startsAt)
    const endsAt = new Date(values.endsAt)

    if (Number.isNaN(startsAt.getTime())) {
      context.addIssue({
        code: "custom",
        path: ["startsAt"],
        message: "Start time is invalid.",
      })
    }

    if (Number.isNaN(endsAt.getTime())) {
      context.addIssue({
        code: "custom",
        path: ["endsAt"],
        message: "End time is invalid.",
      })
    }

    if (!Number.isNaN(startsAt.getTime()) && !Number.isNaN(endsAt.getTime()) && endsAt <= startsAt) {
      context.addIssue({
        code: "custom",
        path: ["endsAt"],
        message: "End time must be after the start time.",
      })
    }
  })

export type VoucherFormValues = z.infer<typeof voucherFormSchema>
