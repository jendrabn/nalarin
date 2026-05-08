import { getIronSession } from "iron-session";
import { NextRequest, NextResponse } from "next/server";

import {
  type AuthSessionData,
  sessionOptions,
} from "@/features/auth/services/session-config";

const authRoutes = ["/login", "/register"];
const adminPrefix = "/admin";
const protectedPrefixes = [
  "/account",
  "/checkout",
  "/dashboard",
  "/practice",
  "/practice-sessions",
  "/practices",
  "/progress",
  "/tryout",
  "/tryout-sessions",
  "/tryouts",
];

function startsWithAny(pathname: string, prefixes: string[]) {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
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

  if (authRoutes.includes(pathname) && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (pathname === adminPrefix || pathname.startsWith(`${adminPrefix}/`)) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (session.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  if (startsWithAny(pathname, protectedPrefixes) && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\..*).*)",
  ],
};
