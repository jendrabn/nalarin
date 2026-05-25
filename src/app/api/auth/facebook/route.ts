import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";

import { env } from "@/config/env";
import { createFacebookAuthorizationUrl } from "@/features/auth/services/facebook-oauth";
import { getSession } from "@/features/auth/services/session";

export async function GET() {
  if (!env.FACEBOOK_AUTH_ENABLED) {
    return NextResponse.redirect(new URL("/login?error=auth_provider_disabled", env.APP_URL));
  }

  const state = randomBytes(24).toString("base64url");
  const session = await getSession();

  session.oauthState = state;
  await session.save();

  return NextResponse.redirect(createFacebookAuthorizationUrl(state));
}
