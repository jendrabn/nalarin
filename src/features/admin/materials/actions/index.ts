"use server"

import { and, eq, inArray, ne } from "drizzle-orm"
import { revalidatePath } from "next/cache"

import { db, schema } from "@/db"
import { getExamTypeById } from "@/features/admin/exam-types/queries"
import { requireAdmin } from "@/features/auth/services/session"
import {
  ActionResult,
  flattenZodError,
  isDuplicateEntryError,
} from "@/lib/actions"
import { normalizeNullableText, slugify } from "@/lib/utils"

import { getMaterialById } from "../queries"
import { materialFormSchema, type MaterialFormValues } from "../schemas"
import { normalizeMaterialContent, stripHtml } from "../utils/material"

type MaterialActionError = {
  success: false
  message: string
  fieldErrors?: Partial<Record<keyof MaterialFormValues, string[]>>
}

type MaterialActionSuccess<T = unknown> = {
  success: true
  data: T
}

export type MaterialActionResult<T = unknown> = MaterialActionError | MaterialActionSuccess<T>

function parseNullableInteger(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return null
  }

  const parsed = Number(trimmed)

  return Number.isInteger(parsed) && parsed > 0 ? parsed : NaN
}

function parseMaterialValues(values: MaterialFormValues) {
  const validated = materialFormSchema.safeParse(values)

  if (!validated.success) {
    return {
      success: false as const,
      message: "Please fix the highlighted fields.",
      fieldErrors: flattenZodError(validated.error),
    }
  }

  const examTypeId = Number(validated.data.examTypeId)
  const subjectId = Number(validated.data.subjectId)
  const topicId = parseNullableInteger(validated.data.topicId)

  if (!Number.isInteger(examTypeId) || examTypeId <= 0) {
    return {
      success: false as const,
      message: "Please fix the highlighted fields.",
      fieldErrors: {
        examTypeId: ["Select a valid exam type."],
      },
    }
  }

  if (!Number.isInteger(subjectId) || subjectId <= 0) {
    return {
      success: false as const,
      message: "Please fix the highlighted fields.",
      fieldErrors: {
        subjectId: ["Select a valid subject."],
      },
    }
  }

  if (validated.data.topicId.trim() && !Number.isInteger(topicId)) {
    return {
      success: false as const,
      message: "Please fix the highlighted fields.",
      fieldErrors: {
        topicId: ["Select a valid topic."],
      },
    }
  }

  return {
    success: true as const,
    data: {
      examTypeId,
      subjectId,
      topicId: Number.isInteger(topicId) ? topicId : null,
      title: validated.data.title.trim(),
      excerpt: normalizeNullableText(validated.data.excerpt),
      thumbnailUrl: normalizeNullableText(validated.data.thumbnailUrl),
      youtubeUrl: normalizeNullableText(validated.data.youtubeUrl),
      content: normalizeMaterialContent(validated.data.content),
      isFree: validated.data.isFree,
      status: validated.data.status,
    },
  }
}

async function validateMaterialRelations(examTypeId: number, subjectId: number, topicId: number | null) {
  const subject = await db.query.subjects.findFirst({
    where: eq(schema.subjects.id, subjectId),
    columns: {
      id: true,
      examTypeId: true,
    },
  })

  if (!subject || subject.examTypeId !== examTypeId) {
    return {
      success: false as const,
      message: "Subject must belong to the selected exam type.",
      fieldErrors: {
        subjectId: ["The selected subject is invalid."],
      },
    }
  }

  if (topicId !== null) {
    const topic = await db.query.topics.findFirst({
      where: eq(schema.topics.id, topicId),
      columns: {
        id: true,
        subjectId: true,
      },
    })

    if (!topic || topic.subjectId !== subjectId) {
      return {
        success: false as const,
        message: "Topic must belong to the selected subject.",
        fieldErrors: {
          topicId: ["The selected topic is invalid."],
        },
      }
    }
  }

  return { success: true as const }
}

async function findUniqueMaterialSlug(
  examTypeId: number,
  title: string,
  excludedMaterialId?: number,
) {
  const baseSlug = slugify(title)
  let candidate = baseSlug
  let suffix = 2

  while (true) {
    const conflict = await db.query.materials.findFirst({
      where:
        excludedMaterialId !== undefined
          ? and(
              eq(schema.materials.examTypeId, examTypeId),
              eq(schema.materials.slug, candidate),
              ne(schema.materials.id, excludedMaterialId),
            )
          : and(eq(schema.materials.examTypeId, examTypeId), eq(schema.materials.slug, candidate)),
      columns: {
        id: true,
      },
    })

    if (!conflict) {
      return candidate
    }

    candidate = `${baseSlug}-${suffix}`
    suffix += 1
  }
}

function hasMaterialContent(youtubeUrl: string | null, content: string | null) {
  return Boolean(youtubeUrl?.trim()) || stripHtml(content ?? "").length > 0
}

function revalidateMaterialRoutes(payload: {
  examTypeSlug: string
  previousExamTypeSlug?: string | null
  slug?: string
  previousSlug?: string | null
}) {
  revalidatePath("/admin/materials")
  revalidatePath("/admin/materials/create")
  revalidatePath("/materials")
  revalidatePath(`/materials/exam/${payload.examTypeSlug}`)

  if (payload.previousExamTypeSlug && payload.previousExamTypeSlug !== payload.examTypeSlug) {
    revalidatePath(`/materials/exam/${payload.previousExamTypeSlug}`)
  }

  if (payload.slug) {
    revalidatePath(`/materials/exam/${payload.examTypeSlug}/${payload.slug}`)
    revalidatePath(`/materials/${payload.slug}`)
  }

  if (payload.previousSlug && payload.previousSlug !== payload.slug) {
    revalidatePath(`/materials/${payload.previousSlug}`)

    if (payload.previousExamTypeSlug) {
      revalidatePath(
        `/materials/exam/${payload.previousExamTypeSlug}/${payload.previousSlug}`,
      )
    }
  }
}

async function ensureMaterialExamTypeSlug(examTypeId: number) {
  const examType = await getExamTypeById(examTypeId)

  if (!examType) {
    return null
  }

  return examType.slug
}

export async function createMaterialAction(
  values: MaterialFormValues,
): Promise<MaterialActionResult<{ id: number; slug: string }>> {
  const user = await requireAdmin()
  const parsed = parseMaterialValues(values)

  if (!parsed.success) {
    return parsed
  }

  const relationCheck = await validateMaterialRelations(
    parsed.data.examTypeId,
    parsed.data.subjectId,
    parsed.data.topicId,
  )

  if (!relationCheck.success) {
    return relationCheck
  }

  if (parsed.data.status === "published" && !hasMaterialContent(parsed.data.youtubeUrl, parsed.data.content)) {
    return {
      success: false,
      message: "Provide a YouTube URL or content before publishing.",
      fieldErrors: {
        youtubeUrl: ["Provide a YouTube URL or content before publishing."],
        content: ["Provide a YouTube URL or content before publishing."],
      },
    }
  }

  const examTypeSlug = await ensureMaterialExamTypeSlug(parsed.data.examTypeId)

  if (!examTypeSlug) {
    return {
      success: false,
      message: "Selected exam type not found.",
      fieldErrors: {
        examTypeId: ["The selected exam type does not exist."],
      },
    }
  }

  const slug = await findUniqueMaterialSlug(parsed.data.examTypeId, parsed.data.title)

  const publishedAt = parsed.data.status === "published" ? new Date() : null

  try {
    const [created] = await db
      .insert(schema.materials)
      .values({
        examTypeId: parsed.data.examTypeId,
        subjectId: parsed.data.subjectId,
        topicId: parsed.data.topicId,
        title: parsed.data.title,
        slug,
        excerpt: parsed.data.excerpt,
        thumbnailUrl: parsed.data.thumbnailUrl,
        youtubeUrl: parsed.data.youtubeUrl,
        content: parsed.data.content,
        isFree: parsed.data.isFree,
        status: parsed.data.status,
        publishedAt,
        createdBy: user.id,
      })
      .$returningId()

    revalidateMaterialRoutes({
      examTypeSlug,
      slug,
    })

    return {
      success: true,
      data: { id: created.id, slug },
    }
  } catch (error) {
    return {
      success: false,
      message:
        isDuplicateEntryError(error)
          ? "Another material already uses the same slug in this exam type."
          : "Failed to create the material.",
    }
  }
}

export async function updateMaterialAction(
  materialId: number,
  values: MaterialFormValues,
): Promise<MaterialActionResult<{ id: number; slug: string }>> {
  await requireAdmin()

  const existingMaterial = await getMaterialById(materialId)

  if (!existingMaterial) {
    return {
      success: false,
      message: "Material not found.",
    }
  }

  const parsed = parseMaterialValues(values)

  if (!parsed.success) {
    return parsed
  }

  const relationCheck = await validateMaterialRelations(
    parsed.data.examTypeId,
    parsed.data.subjectId,
    parsed.data.topicId,
  )

  if (!relationCheck.success) {
    return relationCheck
  }

  if (parsed.data.status === "published" && !hasMaterialContent(parsed.data.youtubeUrl, parsed.data.content)) {
    return {
      success: false,
      message: "Provide a YouTube URL or content before publishing.",
      fieldErrors: {
        youtubeUrl: ["Provide a YouTube URL or content before publishing."],
        content: ["Provide a YouTube URL or content before publishing."],
      },
    }
  }

  const examTypeSlug = await ensureMaterialExamTypeSlug(parsed.data.examTypeId)

  if (!examTypeSlug) {
    return {
      success: false,
      message: "Selected exam type not found.",
      fieldErrors: {
        examTypeId: ["The selected exam type does not exist."],
      },
    }
  }

  const previousExamTypeSlug = existingMaterial.examTypeSlug
  const slug = await findUniqueMaterialSlug(
    parsed.data.examTypeId,
    parsed.data.title,
    materialId,
  )
  const publishedAt =
    existingMaterial.publishedAt ?? (parsed.data.status === "published" ? new Date() : null)

  try {
    await db
      .update(schema.materials)
      .set({
        examTypeId: parsed.data.examTypeId,
        subjectId: parsed.data.subjectId,
        topicId: parsed.data.topicId,
        title: parsed.data.title,
        slug,
        excerpt: parsed.data.excerpt,
        thumbnailUrl: parsed.data.thumbnailUrl,
        youtubeUrl: parsed.data.youtubeUrl,
        content: parsed.data.content,
        isFree: parsed.data.isFree,
        status: parsed.data.status,
        publishedAt,
      })
      .where(eq(schema.materials.id, materialId))

    revalidateMaterialRoutes({
      examTypeSlug,
      previousExamTypeSlug,
      slug,
      previousSlug: existingMaterial.slug,
    })

    return {
      success: true,
      data: { id: materialId, slug },
    }
  } catch (error) {
    return {
      success: false,
      message:
        isDuplicateEntryError(error)
          ? "Another material already uses the same slug in this exam type."
          : "Failed to update the material.",
    }
  }
}

export async function publishMaterialAction(
  materialId: number,
): Promise<MaterialActionResult<{ id: number }>> {
  await requireAdmin()

  const existingMaterial = await getMaterialById(materialId)

  if (!existingMaterial) {
    return {
      success: false,
      message: "Material not found.",
    }
  }

  if (!hasMaterialContent(existingMaterial.youtubeUrl, existingMaterial.content)) {
    return {
      success: false,
      message: "Provide a YouTube URL or content before publishing.",
      fieldErrors: {
        youtubeUrl: ["Provide a YouTube URL or content before publishing."],
        content: ["Provide a YouTube URL or content before publishing."],
      },
    }
  }

  const publishedAt = existingMaterial.publishedAt ?? new Date()

  await db
    .update(schema.materials)
    .set({
      status: "published",
      publishedAt,
    })
    .where(eq(schema.materials.id, materialId))

  revalidateMaterialRoutes({
    examTypeSlug: existingMaterial.examTypeSlug,
    slug: existingMaterial.slug,
  })

  return {
    success: true,
    data: { id: materialId },
  }
}

export async function archiveMaterialAction(
  materialId: number,
): Promise<MaterialActionResult<{ id: number }>> {
  await requireAdmin()

  const existingMaterial = await getMaterialById(materialId)

  if (!existingMaterial) {
    return {
      success: false,
      message: "Material not found.",
    }
  }

  await db
    .update(schema.materials)
    .set({
      status: "archived",
      publishedAt: existingMaterial.publishedAt ?? null,
    })
    .where(eq(schema.materials.id, materialId))

  revalidateMaterialRoutes({
    examTypeSlug: existingMaterial.examTypeSlug,
    slug: existingMaterial.slug,
  })

  return {
    success: true,
    data: { id: materialId },
  }
}

export async function deleteMaterialAction(
  materialId: number,
): Promise<MaterialActionResult<{ id: number }>> {
  await requireAdmin()

  const existingMaterial = await getMaterialById(materialId)

  if (!existingMaterial) {
    return {
      success: false,
      message: "Material not found.",
    }
  }

  if (existingMaterial.status !== "draft" || existingMaterial.publishedAt !== null) {
    return {
      success: false,
      message: "Only draft materials that have never been published can be deleted.",
    }
  }

  await db.delete(schema.materials).where(eq(schema.materials.id, materialId))

  revalidatePath("/admin/materials")
  revalidatePath("/admin/materials/create")

  return {
    success: true,
    data: { id: materialId },
  }
}

export async function deleteMaterialsAction(
  materialIds: number[],
): Promise<ActionResult<unknown, { deletedCount: number }>> {
  await requireAdmin()

  const uniqueMaterialIds = [...new Set(materialIds)].filter(
    (id) => Number.isInteger(id) && id > 0,
  )

  if (uniqueMaterialIds.length === 0) {
    return {
      success: false,
      message: "No materials were selected.",
    }
  }

  const existingMaterials = await db
    .select({
      id: schema.materials.id,
      status: schema.materials.status,
      publishedAt: schema.materials.publishedAt,
    })
    .from(schema.materials)
    .where(inArray(schema.materials.id, uniqueMaterialIds))

  if (existingMaterials.length !== uniqueMaterialIds.length) {
    return {
      success: false,
      message: "Some selected materials were not found.",
    }
  }

  const nonDeletable = existingMaterials.find(
    (material) => material.status !== "draft" || material.publishedAt !== null,
  )

  if (nonDeletable) {
    return {
      success: false,
      message: "Only draft materials that have never been published can be deleted.",
    }
  }

  await db.delete(schema.materials).where(inArray(schema.materials.id, uniqueMaterialIds))

  revalidatePath("/admin/materials")
  revalidatePath("/admin/materials/create")

  return {
    success: true,
    data: {
      deletedCount: uniqueMaterialIds.length,
    },
  }
}
