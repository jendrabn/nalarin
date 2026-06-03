import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { env } from "@/config/env";
import { db, schema } from "@/db";
import { getAppleUser } from "@/features/auth/services/apple-oauth";
import {
  createAuthenticatedSession,
  getSession,
} from "@/features/auth/services/session";

function redirectWithError(error: string) {
  return NextResponse.redirect(new URL(`/login?error=${error}`, env.APP_URL));
}

function fallbackName(email: string) {
  return email.split("@")[0] ?? "Pengguna Nalarin";
}

export async function GET(request: NextRequest) {
  if (!env.APPLE_AUTH_ENABLED) {
    return redirectWithError("auth_provider_disabled");
  }

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const oauthError = request.nextUrl.searchParams.get("error");
  const session = await getSession();

  if (oauthError) {
    return redirectWithError("apple_cancelled");
  }

  if (
    !code ||
    !state ||
    !session.oauthState ||
    !session.oauthNonce ||
    state !== session.oauthState
  ) {
    return redirectWithError("invalid_oauth_state");
  }

  try {
    const appleUser = await getAppleUser(code, session.oauthNonce);
    const existingByAppleId = await db.query.users.findFirst({
      where: eq(schema.users.appleId, appleUser.sub),
    });

    if (!appleUser.email && !existingByAppleId) {
      return redirectWithError("apple_email_missing");
    }

    if (appleUser.email && !appleUser.emailVerified) {
      return redirectWithError("apple_email_unverified");
    }

    const email = appleUser.email?.toLowerCase();
    const existingByEmail = email
      ? await db.query.users.findFirst({
          where: eq(schema.users.email, email),
        })
      : null;

    let user = existingByEmail ?? existingByAppleId;

    if (existingByEmail) {
      if (!existingByEmail.appleId) {
        return redirectWithError("apple_account_not_linked");
      }

      if (existingByEmail.appleId !== appleUser.sub) {
        return redirectWithError("apple_account_mismatch");
      }
    }

    if (user && user.status !== "active") {
      return redirectWithError("account_inactive");
    }

    if (!user && email) {
      await db.insert(schema.users).values({
        name: fallbackName(email),
        email,
        emailVerifiedAt: new Date(),
        appleId: appleUser.sub,
        role: "user",
        status: "active",
      });

      user = await db.query.users.findFirst({
        where: eq(schema.users.email, email),
      });
    } else if (user) {
      await db
        .update(schema.users)
        .set({
          email: email ?? user.email,
          emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
          updatedAt: new Date(),
        })
        .where(eq(schema.users.id, user.id));
    }

    if (!user) {
      return redirectWithError("auth_failed");
    }

    await createAuthenticatedSession({
      id: user.id,
      role: user.role,
    });

    return NextResponse.redirect(new URL("/profile", env.APP_URL));
  } catch (error) {
    const message = error instanceof Error ? error.message : "auth_failed";

    if (message.startsWith("apple_")) {
      return redirectWithError(message);
    }

    console.error("Apple login failed:", error);
    return redirectWithError("auth_failed");
  }
}
