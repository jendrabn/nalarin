import "server-only";

import { z } from "zod";

import { env } from "@/config/env";

const googleTokenSchema = z.object({
  access_token: z.string().min(1),
  token_type: z.string().optional(),
  expires_in: z.number().optional(),
  id_token: z.string().optional(),
  scope: z.string().optional(),
});

const googleTokenErrorSchema = z.object({
  error: z.string().optional(),
  error_description: z.string().optional(),
});

const googleUserSchema = z.object({
  sub: z.string().min(1),
  email: z.email(),
  email_verified: z.boolean(),
  name: z.string().optional(),
  picture: z.url().optional(),
});

export type GoogleUser = z.infer<typeof googleUserSchema>;

function requireGoogleConfig() {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_REDIRECT_URI) {
    throw new Error("google_not_configured");
  }

  return {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    redirectUri: env.GOOGLE_REDIRECT_URI,
  };
}

export function createGoogleAuthorizationUrl(state: string) {
  const config = requireGoogleConfig();
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");

  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "select_account");

  return url;
}

export async function getGoogleUser(code: string) {
  const config = requireGoogleConfig();

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: "authorization_code",
      code,
    }),
  });

  if (!tokenResponse.ok) {
    const payload = googleTokenErrorSchema.safeParse(await tokenResponse.json());
    const error = payload.success ? payload.data.error : undefined;
    const description = payload.success ? payload.data.error_description : undefined;

    if (
      error === "redirect_uri_mismatch" ||
      description?.toLowerCase().includes("redirect_uri_mismatch")
    ) {
      throw new Error("google_redirect_uri_mismatch");
    }

    throw new Error("google_token_exchange_failed");
  }

  const token = googleTokenSchema.parse(await tokenResponse.json());

  const userResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: {
      Authorization: `Bearer ${token.access_token}`,
    },
  });

  if (!userResponse.ok) {
    throw new Error("Google profile request failed.");
  }

  return googleUserSchema.parse(await userResponse.json());
}
