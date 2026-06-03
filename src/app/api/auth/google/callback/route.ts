import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { env } from "@/config/env";
import { db, schema } from "@/db";
import { getGoogleUser } from "@/features/auth/services/google-oauth";
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
  if (!env.GOOGLE_AUTH_ENABLED) {
    return redirectWithError("auth_provider_disabled");
  }

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const oauthError = request.nextUrl.searchParams.get("error");
  const session = await getSession();

  if (oauthError) {
    return redirectWithError("google_cancelled");
  }

  if (!code || !state || !session.oauthState || state !== session.oauthState) {
    return redirectWithError("invalid_oauth_state");
  }

  try {
    const googleUser = await getGoogleUser(code);

    if (!googleUser.email_verified) {
      return redirectWithError("google_email_unverified");
    }

    const email = googleUser.email.toLowerCase();
    const existingByEmail = await db.query.users.findFirst({
      where: eq(schema.users.email, email),
    });

    let user =
      existingByEmail ??
      (await db.query.users.findFirst({
        where: eq(schema.users.googleId, googleUser.sub),
      }));

    if (existingByEmail) {
      if (!existingByEmail.googleId) {
        return redirectWithError("google_account_not_linked");
      }

      if (existingByEmail.googleId !== googleUser.sub) {
        return redirectWithError("google_account_mismatch");
      }
    }

    if (user && user.status !== "active") {
      return redirectWithError("account_inactive");
    }

    if (!user) {
      await db.insert(schema.users).values({
        name: googleUser.name ?? fallbackName(email),
        email,
        emailVerifiedAt: new Date(),
        googleId: googleUser.sub,
        avatarUrl: googleUser.picture,
        role: "user",
        status: "active",
      });

      user = await db.query.users.findFirst({
        where: eq(schema.users.email, email),
      });
    } else {
      await db
        .update(schema.users)
        .set({
          email,
          emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
          avatarUrl: googleUser.picture ?? user.avatarUrl,
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

    if (message.startsWith("google_")) {
      return redirectWithError(message);
    }

    console.error("Google login failed:", error);
    return redirectWithError("auth_failed");
  }
}
