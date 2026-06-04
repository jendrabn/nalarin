import { NextRequest, NextResponse } from "next/server";

import { revokeCurrentSession } from "@/features/auth/services/session";
import { getForwardedOrigin } from "@/lib/request-origin";

function redirectHome(request: NextRequest) {
  return NextResponse.redirect(
    new URL("/", getForwardedOrigin(request.headers, request.nextUrl.origin)),
  );
}

export async function GET(request: NextRequest) {
  return redirectHome(request);
}

export async function POST(request: NextRequest) {
  await revokeCurrentSession();

  return redirectHome(request);
}
