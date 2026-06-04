"use server"

import { eq, inArray, or } from "drizzle-orm"

import { db, schema } from "@/db"

type CleanupTx = Parameters<Parameters<typeof db.transaction>[0]>[0]

async function getSessionIds(tx: CleanupTx, userId: number) {
  const practiceSessions = await tx
    .select({
      id: schema.practiceSessions.id,
    })
    .from(schema.practiceSessions)
    .where(eq(schema.practiceSessions.userId, userId))

  const tryoutSessions = await tx
    .select({
      id: schema.tryoutSessions.id,
    })
    .from(schema.tryoutSessions)
    .where(eq(schema.tryoutSessions.userId, userId))

  return {
    practiceSessionIds: practiceSessions.map((row) => row.id),
    tryoutSessionIds: tryoutSessions.map((row) => row.id),
  }
}

export async function detachUserReferences(tx: CleanupTx, userId: number) {
  await Promise.all([
    tx
      .update(schema.questions)
      .set({ createdBy: null })
      .where(eq(schema.questions.createdBy, userId)),
    tx
      .update(schema.practices)
      .set({ createdBy: null })
      .where(eq(schema.practices.createdBy, userId)),
    tx
      .update(schema.tryouts)
      .set({ createdBy: null })
      .where(eq(schema.tryouts.createdBy, userId)),
    tx
      .update(schema.blogPosts)
      .set({ authorId: null })
      .where(eq(schema.blogPosts.authorId, userId)),
    tx
      .update(schema.subscriptions)
      .set({
        activatedByAdminId: null,
        cancelledByAdminId: null,
      })
      .where(
        or(
          eq(schema.subscriptions.activatedByAdminId, userId),
          eq(schema.subscriptions.cancelledByAdminId, userId),
        ),
      ),
  ])
}

export async function deleteUserData(tx: CleanupTx, userId: number) {
  const { practiceSessionIds, tryoutSessionIds } = await getSessionIds(tx, userId)

  await Promise.all([
    tx.delete(schema.userSessions).where(eq(schema.userSessions.userId, userId)),
    tx.delete(schema.monthlyUsage).where(eq(schema.monthlyUsage.userId, userId)),
    tx
      .delete(schema.userProgressSnapshots)
      .where(eq(schema.userProgressSnapshots.userId, userId)),
  ])

  await tx.delete(schema.payments).where(eq(schema.payments.userId, userId))
  await tx.delete(schema.subscriptions).where(eq(schema.subscriptions.userId, userId))

  if (practiceSessionIds.length > 0) {
    await tx
      .delete(schema.practiceAnswers)
      .where(inArray(schema.practiceAnswers.practiceSessionId, practiceSessionIds))

    await tx
      .delete(schema.practiceSessionQuestions)
      .where(inArray(schema.practiceSessionQuestions.practiceSessionId, practiceSessionIds))

    await tx
      .delete(schema.practiceSessions)
      .where(inArray(schema.practiceSessions.id, practiceSessionIds))
  }

  if (tryoutSessionIds.length > 0) {
    await tx
      .delete(schema.tryoutAnswers)
      .where(inArray(schema.tryoutAnswers.tryoutSessionId, tryoutSessionIds))

    await tx
      .delete(schema.tryoutSessionQuestions)
      .where(inArray(schema.tryoutSessionQuestions.tryoutSessionId, tryoutSessionIds))

    await tx
      .delete(schema.tryoutSectionSessions)
      .where(inArray(schema.tryoutSectionSessions.tryoutSessionId, tryoutSessionIds))

    await tx
      .delete(schema.tryoutSessions)
      .where(inArray(schema.tryoutSessions.id, tryoutSessionIds))
  }
}
