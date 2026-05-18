import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, gt, isNull } from "drizzle-orm";
import { getIronSession } from "iron-session";

import { db, schema } from "@/db";
import {
  type AuthSessionData,
  sessionOptions,
  sessionTtlSeconds,
} from "@/features/auth/services/session-config";

export type CurrentUser = {
  id: number;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: "user" | "admin";
  emailVerifiedAt: Date | null;
};

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function getSession() {
  return getIronSession<AuthSessionData>(await cookies(), sessionOptions);
}

export async function createAuthenticatedSession(user: {
  id: number;
  role: "user" | "admin";
}) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + sessionTtlSeconds * 1000);
  const sessionToken = randomBytes(32).toString("base64url");

  const headerStore = await headers();

  await db.insert(schema.userSessions).values({
    userId: user.id,
    sessionTokenHash: hashToken(sessionToken),
    expiresAt,
    lastActiveAt: now,
    ipAddress:
      headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      headerStore.get("x-real-ip"),
    userAgent: headerStore.get("user-agent"),
  });

  const createdSession = await db.query.userSessions.findFirst({
    where: eq(schema.userSessions.sessionTokenHash, hashToken(sessionToken)),
    columns: {
      id: true,
    },
  });

  if (!createdSession) {
    throw new Error("Failed to create user session.");
  }

  const session = await getSession();
  session.userId = user.id;
  session.sessionId = createdSession.id;
  session.sessionToken = sessionToken;
  session.role = user.role;
  session.expiresAt = expiresAt.toISOString();
  session.oauthState = undefined;
  await session.save();
}

export async function revokeCurrentSession() {
  const session = await getSession();

  if (session.sessionId && session.userId) {
    await db
      .update(schema.userSessions)
      .set({
        revokedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schema.userSessions.id, session.sessionId),
          eq(schema.userSessions.userId, session.userId),
          isNull(schema.userSessions.revokedAt),
        ),
      );
  }

  session.destroy();
}

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await getSession();

  if (!session.userId || !session.sessionId || !session.sessionToken) {
    return null;
  }

  try {
    const now = new Date();
    const [record] = await db
      .select({
        sessionId: schema.userSessions.id,
        userId: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        avatarUrl: schema.users.avatarUrl,
        role: schema.users.role,
        status: schema.users.status,
        emailVerifiedAt: schema.users.emailVerifiedAt,
      })
      .from(schema.userSessions)
      .innerJoin(schema.users, eq(schema.userSessions.userId, schema.users.id))
      .where(
        and(
          eq(schema.userSessions.id, session.sessionId),
          eq(schema.userSessions.userId, session.userId),
          eq(schema.userSessions.sessionTokenHash, hashToken(session.sessionToken)),
          isNull(schema.userSessions.revokedAt),
          gt(schema.userSessions.expiresAt, now),
        ),
      )
      .limit(1);

    if (!record || record.status !== "active") {
      return null;
    }

    await db
      .update(schema.userSessions)
      .set({
        lastActiveAt: now,
        updatedAt: now,
      })
      .where(eq(schema.userSessions.id, record.sessionId));

    return {
      id: record.userId,
      name: record.name,
      email: record.email,
      avatarUrl: record.avatarUrl,
      role: record.role,
      emailVerifiedAt: record.emailVerifiedAt,
    };
  } catch {
    return null;
  }
});

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireAdmin() {
  const user = await requireUser();

  if (user.role !== "admin") {
    redirect("/profile");
  }

  return user;
}
