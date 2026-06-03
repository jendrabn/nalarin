import { getIronSession } from "iron-session";
import { NextRequest, NextResponse } from "next/server";

import { env } from "@/config/env";
import {
  type AuthSessionData,
  sessionOptions,
} from "@/features/auth/services/session-config";

const adminPrefix = "/admin";
const protectedPrefixes = [
  "/practice",
  "/practice-sessions",
  "/progress",
  "/tryout",
  "/tryout-sessions",
];
const publicPracticePrefixes = ["/practices/exam"];

function startsWithAny(pathname: string, prefixes: string[]) {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function redirectTo(pathname: string) {
  return NextResponse.redirect(new URL(pathname, env.APP_URL));
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const response = NextResponse.next();
  const session = await getIronSession<AuthSessionData>(
    request,
    response,
    sessionOptions,
  );
  const isAuthenticated = Boolean(session.userId && session.sessionToken);

  if (pathname === adminPrefix || pathname.startsWith(`${adminPrefix}/`)) {
    if (!isAuthenticated) {
      return redirectTo("/login");
    }

    if (session.role !== "admin") {
      return redirectTo("/profile");
    }
  }

  if (
    (startsWithAny(pathname, protectedPrefixes) ||
      (pathname.startsWith("/practices/") &&
        !startsWithAny(pathname, publicPracticePrefixes))) &&
    !isAuthenticated
  ) {
    return redirectTo("/login");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\..*).*)",
  ],
};
