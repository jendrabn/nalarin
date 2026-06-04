import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { env } from "@/config/env";
import { db, schema } from "@/db";
import { getFacebookUser } from "@/features/auth/services/facebook-oauth";
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
  if (!env.FACEBOOK_AUTH_ENABLED) {
    return redirectWithError("auth_provider_disabled");
  }

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const oauthError = request.nextUrl.searchParams.get("error");
  const session = await getSession();

  if (oauthError) {
    return redirectWithError("facebook_cancelled");
  }

  if (!code || !state || !session.oauthState || state !== session.oauthState) {
    return redirectWithError("invalid_oauth_state");
  }

  try {
    const facebookUser = await getFacebookUser(code);
    const existingByFacebookId = await db.query.users.findFirst({
      where: eq(schema.users.facebookId, facebookUser.id),
    });

    if (!facebookUser.email && !existingByFacebookId) {
      return redirectWithError("facebook_email_missing");
    }

    const email = facebookUser.email?.toLowerCase();
    const existingByEmail = email
      ? await db.query.users.findFirst({
          where: eq(schema.users.email, email),
        })
      : null;

    let user = existingByEmail ?? existingByFacebookId;

    if (existingByEmail) {
      if (!existingByEmail.facebookId) {
        return redirectWithError("facebook_account_not_linked");
      }

      if (existingByEmail.facebookId !== facebookUser.id) {
        return redirectWithError("facebook_account_mismatch");
      }
    }

    if (user && user.status !== "active") {
      return redirectWithError("account_inactive");
    }

    if (!user && email) {
      await db.insert(schema.users).values({
        name: facebookUser.name ?? fallbackName(email),
        email,
        emailVerifiedAt: new Date(),
        facebookId: facebookUser.id,
        avatarUrl: facebookUser.picture?.data?.url,
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

    if (message.startsWith("facebook_")) {
      return redirectWithError(message);
    }

    console.error("Facebook login failed:", error);
    return redirectWithError("auth_failed");
  }
}
