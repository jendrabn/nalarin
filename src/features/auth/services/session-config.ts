import type { SessionOptions } from "iron-session";

import { env } from "@/config/env";

export type AuthSessionData = {
  userId?: number;
  sessionId?: number;
  sessionToken?: string;
  role?: "user" | "admin";
  expiresAt?: string;
  oauthState?: string;
};

export const sessionTtlSeconds = env.SESSION_TTL_DAYS * 24 * 60 * 60;

export const sessionOptions: SessionOptions = {
  cookieName: env.SESSION_COOKIE_NAME,
  password: env.SESSION_PASSWORD,
  ttl: sessionTtlSeconds,
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
  },
};
