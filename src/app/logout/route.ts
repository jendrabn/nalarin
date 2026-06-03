import { NextResponse } from "next/server";

import { revokeCurrentSession } from "@/features/auth/services/session";

export async function GET(request: Request) {
  return NextResponse.redirect(new URL("/", request.url));
}

export async function POST(request: Request) {
  await revokeCurrentSession();

  return NextResponse.redirect(new URL("/", request.url));
}
