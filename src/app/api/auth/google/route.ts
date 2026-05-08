import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";

import { createGoogleAuthorizationUrl } from "@/features/auth/services/google-oauth";
import { getSession } from "@/features/auth/services/session";

export async function GET() {
  const state = randomBytes(24).toString("base64url");
  const session = await getSession();

  session.oauthState = state;
  await session.save();

  return NextResponse.redirect(createGoogleAuthorizationUrl(state));
}
