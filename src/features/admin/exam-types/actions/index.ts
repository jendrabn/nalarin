"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

import { db, schema } from "@/db"
import { requireAdmin } from "@/features/auth/services/session"
import {
  ActionResult,
  buildUniqueSlug,
  flattenZodError,
  isDuplicateEntryError,
} from "@/lib/actions"
import { normalizeNullableText, slugify } from "@/lib/utils"

import { getExamTypeById } from "../queries"
import { examTypeFormSchema, type ExamTypeFormValues } from "../schemas"

function parseExamTypeValues(values: ExamTypeFormValues) {
  const validated = examTypeFormSchema.safeParse(values)

  if (!validated.success) {
    return {
      success: false as const,
      message: "Please fix the highlighted fields.",
      fieldErrors: flattenZodError(validated.error),
    }
  }

  return {
    success: true as const,
    data: {
      name: validated.data.name.trim(),
      description: normalizeNullableText(validated.data.description),
      logoUrl: normalizeNullableText(validated.data.logoUrl),
      coverUrl: normalizeNullableText(validated.data.coverUrl),
      packageIsActive: validated.data.packageIsActive,
      packagePrice: validated.data.packagePrice,
      packageDiscountPercent: validated.data.packageDiscountPercent,
      packageDurationMonths: validated.data.packageDurationMonths,
      practiceQuotaPerMonth: validated.data.practiceQuotaPerMonth,
      quizQuotaPerMonth: validated.data.quizQuotaPerMonth,
      tryoutQuotaPerMonth: validated.data.tryoutQuotaPerMonth,
      aiExplanationQuotaPerMonth: validated.data.aiExplanationQuotaPerMonth,
      premiumPracticesEnabled: validated.data.premiumPracticesEnabled,
      premiumTryoutsEnabled: validated.data.premiumTryoutsEnabled,
      rankingEnabled: validated.data.rankingEnabled,
      countdownTitle: normalizeNullableText(validated.data.countdownTitle),
      countdownTargetAt: parseNullableDateTime(validated.data.countdownTargetAt),
      registrationStartAt: parseNullableDateTime(validated.data.registrationStartAt),
      registrationEndAt: parseNullableDateTime(validated.data.registrationEndAt),
      examStartAt: parseNullableDateTime(validated.data.examStartAt),
      examEndAt: parseNullableDateTime(validated.data.examEndAt),
      announcementAt: parseNullableDateTime(validated.data.announcementAt),
      informationContent: normalizeNullableText(validated.data.informationContent),
    },
  }
}

function parseNullableDateTime(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return null
  }

  const parsed = new Date(trimmed)

  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function revalidateExamTypeRoutes() {
  revalidatePath("/admin/exam-types")
  revalidatePath("/admin/subjects")
  revalidatePath("/admin/subjects/create")
  revalidatePath("/admin/topics")
  revalidatePath("/admin/topics/create")
  revalidatePath("/admin/questions")
  revalidatePath("/admin/questions/create")
}

async function examTypeSlugExists(slug: string, excludedId?: number) {
  const row = await db.query.examTypes.findFirst({
    where: eq(schema.examTypes.slug, slug),
    columns: { id: true },
  })

  return Boolean(row && (excludedId === undefined || row.id !== excludedId))
}

export type ExamTypeActionResult<FormValues, T = unknown> = ActionResult<FormValues, T>

export async function updateExamTypeAction(
  examTypeId: number,
  values: ExamTypeFormValues,
): Promise<ExamTypeActionResult<ExamTypeFormValues, { id: number }>> {
  await requireAdmin()

  const parsed = parseExamTypeValues(values)

  if (!parsed.success) {
    return parsed
  }

  const existingExamType = await getExamTypeById(examTypeId)

  if (!existingExamType) {
    return {
      success: false,
      message: "Exam type not found.",
    }
  }

  const slug = await buildUniqueSlug(slugify(parsed.data.name), async (candidate) =>
    examTypeSlugExists(candidate, examTypeId),
  )

  try {
    await db
      .update(schema.examTypes)
      .set({
        name: parsed.data.name,
        slug,
        description: parsed.data.description,
        logoUrl: parsed.data.logoUrl,
        coverUrl: parsed.data.coverUrl,
        countdownTitle: parsed.data.countdownTitle,
        countdownTargetAt: parsed.data.countdownTargetAt,
        registrationStartAt: parsed.data.registrationStartAt,
        registrationEndAt: parsed.data.registrationEndAt,
        examStartAt: parsed.data.examStartAt,
        examEndAt: parsed.data.examEndAt,
        announcementAt: parsed.data.announcementAt,
        informationContent: parsed.data.informationContent,
      })
      .where(eq(schema.examTypes.id, examTypeId))

    await upsertExamTypePackage(examTypeId, parsed.data)

    revalidateExamTypeRoutes()
    revalidatePath(`/admin/exam-types/${examTypeId}/edit`)

    return {
      success: true,
      data: { id: examTypeId },
    }
  } catch (error) {
    return {
      success: false,
      message:
        isDuplicateEntryError(error)
          ? "Another exam type already uses the same slug."
          : "Failed to update the exam type.",
    }
  }
}

async function upsertExamTypePackage(
  examTypeId: number,
  values: {
    packageIsActive: boolean
    packagePrice: number
    packageDiscountPercent: number
    packageDurationMonths: number
    practiceQuotaPerMonth: number
    quizQuotaPerMonth: number
    tryoutQuotaPerMonth: number
    aiExplanationQuotaPerMonth: number
    premiumPracticesEnabled: boolean
    premiumTryoutsEnabled: boolean
    rankingEnabled: boolean
  },
) {
  const [existingPackage] = await db
    .select({ id: schema.examTypePackages.id })
    .from(schema.examTypePackages)
    .where(eq(schema.examTypePackages.examTypeId, examTypeId))
    .limit(1)

  const now = new Date()
  const packagePayload = {
    isActive: values.packageIsActive,
    practiceQuotaPerMonth: values.practiceQuotaPerMonth,
    quizQuotaPerMonth: values.quizQuotaPerMonth,
    tryoutQuotaPerMonth: values.tryoutQuotaPerMonth,
    aiExplanationQuotaPerMonth: values.aiExplanationQuotaPerMonth,
    premiumPracticesEnabled: values.premiumPracticesEnabled,
    premiumTryoutsEnabled: values.premiumTryoutsEnabled,
    rankingEnabled: values.rankingEnabled,
    updatedAt: now,
  }

  const packageId =
    existingPackage?.id ??
    (
      await db
        .insert(schema.examTypePackages)
        .values({
          examTypeId,
          ...packagePayload,
          createdAt: now,
        })
        .$returningId()
    )[0].id

  if (existingPackage) {
    await db
      .update(schema.examTypePackages)
      .set(packagePayload)
      .where(eq(schema.examTypePackages.id, packageId))
  }

  const [existingPrice] = await db
    .select({ id: schema.examTypePackagePrices.id })
    .from(schema.examTypePackagePrices)
    .where(eq(schema.examTypePackagePrices.packageId, packageId))
    .limit(1)

  const pricePayload = {
    durationMonths: values.packageDurationMonths,
    price: values.packagePrice,
    discountPercent: values.packageDiscountPercent,
    isActive: values.packageIsActive,
    updatedAt: now,
  }

  if (existingPrice) {
    await db
      .update(schema.examTypePackagePrices)
      .set(pricePayload)
      .where(eq(schema.examTypePackagePrices.id, existingPrice.id))
    return
  }

  await db.insert(schema.examTypePackagePrices).values({
    packageId,
    ...pricePayload,
    createdAt: now,
  })
}
