import "server-only";

import { z } from "zod";

import { env } from "@/config/env";

const facebookTokenSchema = z.object({
  access_token: z.string().min(1),
  token_type: z.string().optional(),
  expires_in: z.number().optional(),
});

const facebookErrorSchema = z.object({
  error: z
    .object({
      message: z.string().optional(),
      type: z.string().optional(),
      code: z.number().optional(),
      error_subcode: z.number().optional(),
    })
    .optional(),
});

const facebookUserSchema = z.object({
  id: z.string().min(1),
  name: z.string().optional(),
  email: z.email().optional(),
  picture: z
    .object({
      data: z
        .object({
          url: z.url().optional(),
        })
        .optional(),
    })
    .optional(),
});

export type FacebookUser = z.infer<typeof facebookUserSchema>;

function requireFacebookConfig() {
  if (
    !env.FACEBOOK_CLIENT_ID ||
    !env.FACEBOOK_CLIENT_SECRET ||
    !env.FACEBOOK_REDIRECT_URI
  ) {
    throw new Error("facebook_not_configured");
  }

  return {
    clientId: env.FACEBOOK_CLIENT_ID,
    clientSecret: env.FACEBOOK_CLIENT_SECRET,
    redirectUri: env.FACEBOOK_REDIRECT_URI,
  };
}

export function createFacebookAuthorizationUrl(state: string) {
  const config = requireFacebookConfig();
  const url = new URL("https://www.facebook.com/dialog/oauth");

  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "email,public_profile");
  url.searchParams.set("state", state);

  return url;
}

export async function getFacebookUser(code: string) {
  const config = requireFacebookConfig();
  const tokenUrl = new URL("https://graph.facebook.com/oauth/access_token");
  tokenUrl.searchParams.set("client_id", config.clientId);
  tokenUrl.searchParams.set("client_secret", config.clientSecret);
  tokenUrl.searchParams.set("redirect_uri", config.redirectUri);
  tokenUrl.searchParams.set("code", code);

  const tokenResponse = await fetch(tokenUrl);

  if (!tokenResponse.ok) {
    const payload = facebookErrorSchema.safeParse(await tokenResponse.json());
    const description = payload.success ? payload.data.error?.message : undefined;

    if (description?.toLowerCase().includes("redirect_uri")) {
      throw new Error("facebook_redirect_uri_mismatch");
    }

    throw new Error("facebook_token_exchange_failed");
  }

  const token = facebookTokenSchema.parse(await tokenResponse.json());
  const userUrl = new URL("https://graph.facebook.com/me");
  userUrl.searchParams.set("fields", "id,name,email,picture.width(256).height(256)");
  userUrl.searchParams.set("access_token", token.access_token);

  const userResponse = await fetch(userUrl);

  if (!userResponse.ok) {
    throw new Error("facebook_profile_request_failed");
  }

  return facebookUserSchema.parse(await userResponse.json());
}
