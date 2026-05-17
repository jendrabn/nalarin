import "server-only"

import { eq, sql } from "drizzle-orm"

import { db, schema } from "@/db"

type DeleteAccountTransaction = Parameters<
  Parameters<typeof db.transaction>[0]
>[0]

function createDeleteStatements(userId: number) {
  return [
    sql`
      UPDATE subscriptions
      SET activated_by_admin_id = NULL
      WHERE activated_by_admin_id = ${userId}
    `,
    sql`
      UPDATE subscriptions
      SET cancelled_by_admin_id = NULL
      WHERE cancelled_by_admin_id = ${userId}
    `,
    sql`
      DELETE FROM practice_answers
      WHERE practice_session_id IN (
        SELECT id FROM practice_sessions WHERE user_id = ${userId}
      )
    `,
    sql`
      DELETE FROM practice_session_questions
      WHERE practice_session_id IN (
        SELECT id FROM practice_sessions WHERE user_id = ${userId}
      )
    `,
    sql`
      DELETE FROM practice_sessions
      WHERE user_id = ${userId}
    `,
    sql`
      DELETE FROM tryout_answers
      WHERE tryout_session_id IN (
        SELECT id FROM tryout_sessions WHERE user_id = ${userId}
      )
    `,
    sql`
      DELETE FROM tryout_session_questions
      WHERE tryout_session_id IN (
        SELECT id FROM tryout_sessions WHERE user_id = ${userId}
      )
    `,
    sql`
      DELETE FROM tryout_section_sessions
      WHERE tryout_session_id IN (
        SELECT id FROM tryout_sessions WHERE user_id = ${userId}
      )
    `,
    sql`
      DELETE FROM tryout_sessions
      WHERE user_id = ${userId}
    `,
    sql`
      DELETE FROM payments
      WHERE user_id = ${userId}
        OR subscription_id IN (
          SELECT id FROM subscriptions WHERE user_id = ${userId}
        )
    `,
    sql`
      DELETE FROM subscriptions
      WHERE user_id = ${userId}
    `,
    sql`
      DELETE FROM monthly_usage
      WHERE user_id = ${userId}
    `,
    sql`
      DELETE FROM user_progress_snapshots
      WHERE user_id = ${userId}
    `,
    sql`
      DELETE FROM email_change_tokens
      WHERE user_id = ${userId}
    `,
    sql`
      DELETE FROM password_reset_tokens
      WHERE user_id = ${userId}
    `,
    sql`
      DELETE FROM email_verification_tokens
      WHERE user_id = ${userId}
    `,
    sql`
      DELETE FROM user_sessions
      WHERE user_id = ${userId}
    `,
  ]
}

export async function purgeAccountData(
  tx: DeleteAccountTransaction,
  userId: number,
) {
  await tx
    .update(schema.questions)
    .set({ createdBy: null, updatedAt: new Date() })
    .where(eq(schema.questions.createdBy, userId))

  await tx
    .update(schema.practices)
    .set({ createdBy: null, updatedAt: new Date() })
    .where(eq(schema.practices.createdBy, userId))

  await tx
    .update(schema.tryouts)
    .set({ createdBy: null, updatedAt: new Date() })
    .where(eq(schema.tryouts.createdBy, userId))

  await tx
    .update(schema.blogPosts)
    .set({ authorId: null, updatedAt: new Date() })
    .where(eq(schema.blogPosts.authorId, userId))

  for (const statement of createDeleteStatements(userId)) {
    await tx.execute(statement)
  }

  await tx.delete(schema.users).where(eq(schema.users.id, userId))
}
