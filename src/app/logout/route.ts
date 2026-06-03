import { NextResponse } from "next/server";

import { env } from "@/config/env";
import { revokeCurrentSession } from "@/features/auth/services/session";

export async function GET() {
  return NextResponse.redirect(new URL("/", env.APP_URL));
}

export async function POST() {
  await revokeCurrentSession();

  return NextResponse.redirect(new URL("/", env.APP_URL));
}
