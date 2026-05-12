"use server"

import { and, eq, inArray } from "drizzle-orm"
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

import { getSubjectById } from "../../subjects/queries"
import { getTopicById } from "../queries"
import { topicFormSchema, type TopicFormValues } from "../schemas"

function parseTopicValues(values: TopicFormValues) {
  const validated = topicFormSchema.safeParse(values)

  if (!validated.success) {
    return {
      success: false as const,
      message: "Please fix the highlighted fields.",
      fieldErrors: flattenZodError(validated.error),
    }
  }

  const subjectId = Number(validated.data.subjectId)

  if (!Number.isInteger(subjectId) || subjectId <= 0) {
    return {
      success: false as const,
      message: "Please fix the highlighted fields.",
      fieldErrors: {
        subjectId: ["Select a valid subject."],
      },
    }
  }

  return {
    success: true as const,
    data: {
      subjectId,
      name: validated.data.name.trim(),
      description: normalizeNullableText(validated.data.description),
    },
  }
}

function revalidateTopicRoutes() {
  revalidatePath("/admin/exam-types")
  revalidatePath("/admin/subjects")
  revalidatePath("/admin/subjects/create")
  revalidatePath("/admin/topics")
  revalidatePath("/admin/topics/create")
  revalidatePath("/admin/questions")
  revalidatePath("/admin/questions/create")
}

async function topicSlugExists(subjectId: number, slug: string, excludedId?: number) {
  const row = await db.query.topics.findFirst({
    where: and(eq(schema.topics.subjectId, subjectId), eq(schema.topics.slug, slug)),
    columns: { id: true, subjectId: true },
  })

  return Boolean(row && (excludedId === undefined || row.id !== excludedId))
}

export type TopicActionResult<FormValues, T = unknown> = ActionResult<FormValues, T>

export async function createTopicAction(
  values: TopicFormValues,
): Promise<TopicActionResult<TopicFormValues, { id: number }>> {
  await requireAdmin()

  const parsed = parseTopicValues(values)

  if (!parsed.success) {
    return parsed
  }

  const subject = await getSubjectById(parsed.data.subjectId)

  if (!subject) {
    return {
      success: false,
      message: "Selected subject not found.",
      fieldErrors: {
        subjectId: ["The selected subject does not exist."],
      },
    }
  }

  const slug = await buildUniqueSlug(slugify(parsed.data.name), async (candidate) =>
    topicSlugExists(parsed.data.subjectId, candidate),
  )

  try {
    const [created] = await db
      .insert(schema.topics)
      .values({
        subjectId: parsed.data.subjectId,
        name: parsed.data.name,
        slug,
        description: parsed.data.description,
      })
      .$returningId()

    revalidateTopicRoutes()

    return {
      success: true,
      data: { id: created.id },
    }
  } catch (error) {
    return {
      success: false,
      message:
        isDuplicateEntryError(error)
          ? "Another topic already uses the same slug in this subject."
          : "Failed to create the topic.",
    }
  }
}

export async function updateTopicAction(
  topicId: number,
  values: TopicFormValues,
): Promise<TopicActionResult<TopicFormValues, { id: number }>> {
  await requireAdmin()

  const parsed = parseTopicValues(values)

  if (!parsed.success) {
    return parsed
  }

  const existingTopic = await getTopicById(topicId)

  if (!existingTopic) {
    return {
      success: false,
      message: "Topic not found.",
    }
  }

  const subject = await getSubjectById(parsed.data.subjectId)

  if (!subject) {
    return {
      success: false,
      message: "Selected subject not found.",
      fieldErrors: {
        subjectId: ["The selected subject does not exist."],
      },
    }
  }

  const slug = await buildUniqueSlug(slugify(parsed.data.name), async (candidate) =>
    topicSlugExists(parsed.data.subjectId, candidate, topicId),
  )

  try {
    await db
      .update(schema.topics)
      .set({
        subjectId: parsed.data.subjectId,
        name: parsed.data.name,
        slug,
        description: parsed.data.description,
      })
      .where(eq(schema.topics.id, topicId))

    revalidateTopicRoutes()
    revalidatePath(`/admin/topics/${topicId}/edit`)

    return {
      success: true,
      data: { id: topicId },
    }
  } catch (error) {
    return {
      success: false,
      message:
        isDuplicateEntryError(error)
          ? "Another topic already uses the same slug in this subject."
          : "Failed to update the topic.",
    }
  }
}

export async function deleteTopicAction(
  topicId: number,
): Promise<TopicActionResult<TopicFormValues, { id: number }>> {
  await requireAdmin()

  const existingTopic = await getTopicById(topicId)

  if (!existingTopic) {
    return {
      success: false,
      message: "Topic not found.",
    }
  }

  const [questionUsage, practiceUsage] = await Promise.all([
    db.query.questions.findFirst({
      where: eq(schema.questions.topicId, topicId),
      columns: { id: true },
    }),
    db.query.practices.findFirst({
      where: eq(schema.practices.topicId, topicId),
      columns: { id: true },
    }),
  ])

  if (questionUsage || practiceUsage) {
    return {
      success: false,
      message: "This topic cannot be deleted because it is still used by questions or practices.",
    }
  }

  await db.delete(schema.topics).where(eq(schema.topics.id, topicId))

  revalidateTopicRoutes()
  revalidatePath(`/admin/topics/${topicId}/edit`)

  return {
    success: true,
    data: { id: topicId },
  }
}

export async function deleteTopicsAction(
  topicIds: number[],
): Promise<ActionResult<unknown, { deletedCount: number }>> {
  await requireAdmin()

  const uniqueTopicIds = [...new Set(topicIds)].filter((id) => Number.isInteger(id) && id > 0)

  if (uniqueTopicIds.length === 0) {
    return {
      success: false,
      message: "No topics were selected.",
    }
  }

  const [existingTopics, questionUsageRows, practiceUsageRows] = await Promise.all([
    db
      .select({
        id: schema.topics.id,
      })
      .from(schema.topics)
      .where(inArray(schema.topics.id, uniqueTopicIds)),
    db
      .select({
        topicId: schema.questions.topicId,
      })
      .from(schema.questions)
      .where(inArray(schema.questions.topicId, uniqueTopicIds))
      .groupBy(schema.questions.topicId),
    db
      .select({
        topicId: schema.practices.topicId,
      })
      .from(schema.practices)
      .where(inArray(schema.practices.topicId, uniqueTopicIds))
      .groupBy(schema.practices.topicId),
  ])

  if (existingTopics.length !== uniqueTopicIds.length) {
    return {
      success: false,
      message: "Some selected topics were not found.",
    }
  }

  if (questionUsageRows.length > 0 || practiceUsageRows.length > 0) {
    return {
      success: false,
      message:
        "One or more selected topics cannot be deleted because they are still used by questions or practices.",
    }
  }

  await db.delete(schema.topics).where(inArray(schema.topics.id, uniqueTopicIds))

  revalidateTopicRoutes()
  uniqueTopicIds.forEach((topicId) => {
    revalidatePath(`/admin/topics/${topicId}/edit`)
  })

  return {
    success: true,
    data: { deletedCount: uniqueTopicIds.length },
  }
}
