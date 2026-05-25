import "server-only";

import {
  createPrivateKey,
  createPublicKey,
  sign as signPayload,
  verify as verifySignature,
} from "node:crypto";
import { z } from "zod";

import { env } from "@/config/env";

const APPLE_ISSUER = "https://appleid.apple.com";
const APPLE_KEYS_URL = "https://appleid.apple.com/auth/keys";

const appleTokenSchema = z.object({
  access_token: z.string().optional(),
  expires_in: z.number().optional(),
  id_token: z.string().min(1),
  refresh_token: z.string().optional(),
  token_type: z.string().optional(),
});

const appleTokenErrorSchema = z.object({
  error: z.string().optional(),
  error_description: z.string().optional(),
});

const appleJwkSchema = z.object({
  kty: z.literal("RSA"),
  kid: z.string().min(1),
  use: z.string().optional(),
  alg: z.string().optional(),
  n: z.string().min(1),
  e: z.string().min(1),
});

const appleJwksSchema = z.object({
  keys: z.array(appleJwkSchema),
});

const appleJwtHeaderSchema = z.object({
  alg: z.literal("RS256"),
  kid: z.string().min(1),
});

const emailVerifiedSchema = z
  .union([z.boolean(), z.string()])
  .optional()
  .transform((value) => value === true || value === "true");

const appleIdTokenPayloadSchema = z.object({
  iss: z.literal(APPLE_ISSUER),
  aud: z.string().min(1),
  exp: z.number().int(),
  sub: z.string().min(1),
  email: z.email().optional(),
  email_verified: emailVerifiedSchema,
  nonce: z.string().optional(),
});

export type AppleUser = {
  sub: string;
  email?: string;
  emailVerified: boolean;
};

let appleJwksPromise: Promise<z.infer<typeof appleJwksSchema>> | null = null;

function requireAppleConfig() {
  if (
    !env.APPLE_CLIENT_ID ||
    !env.APPLE_TEAM_ID ||
    !env.APPLE_KEY_ID ||
    !env.APPLE_PRIVATE_KEY ||
    !env.APPLE_REDIRECT_URI
  ) {
    throw new Error("apple_not_configured");
  }

  return {
    clientId: env.APPLE_CLIENT_ID,
    teamId: env.APPLE_TEAM_ID,
    keyId: env.APPLE_KEY_ID,
    privateKey: env.APPLE_PRIVATE_KEY,
    redirectUri: env.APPLE_REDIRECT_URI,
  };
}

function base64UrlEncode(input: Buffer | string) {
  return Buffer.from(input).toString("base64url");
}

function decodeBase64UrlJson<T>(value: string, schema: z.ZodType<T>) {
  return schema.parse(JSON.parse(Buffer.from(value, "base64url").toString("utf8")));
}

function normalizeApplePrivateKey(privateKey: string) {
  return privateKey.replace(/\\n/g, "\n");
}

function createAppleClientSecret() {
  const config = requireAppleConfig();
  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: "ES256",
    kid: config.keyId,
  };
  const payload = {
    iss: config.teamId,
    iat: now,
    exp: now + 5 * 60,
    aud: APPLE_ISSUER,
    sub: config.clientId,
  };
  const unsignedToken = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(
    JSON.stringify(payload),
  )}`;
  const privateKey = createPrivateKey(normalizeApplePrivateKey(config.privateKey));
  const signature = signPayload("sha256", Buffer.from(unsignedToken), {
    key: privateKey,
    dsaEncoding: "ieee-p1363",
  });

  return `${unsignedToken}.${signature.toString("base64url")}`;
}

function getAppleJwks() {
  appleJwksPromise ??= fetch(APPLE_KEYS_URL)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error("apple_jwks_request_failed");
      }

      return appleJwksSchema.parse(await response.json());
    })
    .catch((error) => {
      appleJwksPromise = null;
      throw error;
    });

  return appleJwksPromise;
}

async function verifyAppleIdToken(idToken: string, expectedNonce: string) {
  const config = requireAppleConfig();
  const parts = idToken.split(".");

  if (parts.length !== 3) {
    throw new Error("apple_invalid_id_token");
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const header = decodeBase64UrlJson(encodedHeader, appleJwtHeaderSchema);
  const jwks = await getAppleJwks();
  const jwk = jwks.keys.find((key) => key.kid === header.kid);

  if (!jwk) {
    throw new Error("apple_signing_key_not_found");
  }

  const publicKey = createPublicKey({
    key: jwk,
    format: "jwk",
  });
  const isValid = verifySignature(
    "RSA-SHA256",
    Buffer.from(`${encodedHeader}.${encodedPayload}`),
    publicKey,
    Buffer.from(encodedSignature, "base64url"),
  );

  if (!isValid) {
    throw new Error("apple_invalid_id_token_signature");
  }

  const payload = decodeBase64UrlJson(encodedPayload, appleIdTokenPayloadSchema);
  const now = Math.floor(Date.now() / 1000);

  if (payload.aud !== config.clientId) {
    throw new Error("apple_invalid_audience");
  }

  if (payload.exp <= now) {
    throw new Error("apple_id_token_expired");
  }

  if (payload.nonce !== expectedNonce) {
    throw new Error("apple_invalid_nonce");
  }

  return payload;
}

export function createAppleAuthorizationUrl(state: string, nonce: string) {
  const config = requireAppleConfig();
  const url = new URL(`${APPLE_ISSUER}/auth/authorize`);

  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("response_mode", "query");
  url.searchParams.set("scope", "name email");
  url.searchParams.set("state", state);
  url.searchParams.set("nonce", nonce);

  return url;
}

export async function getAppleUser(code: string, expectedNonce: string): Promise<AppleUser> {
  const config = requireAppleConfig();

  const tokenResponse = await fetch(`${APPLE_ISSUER}/auth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: createAppleClientSecret(),
      redirect_uri: config.redirectUri,
      grant_type: "authorization_code",
      code,
    }),
  });

  if (!tokenResponse.ok) {
    const payload = appleTokenErrorSchema.safeParse(await tokenResponse.json());
    const error = payload.success ? payload.data.error : undefined;
    const description = payload.success ? payload.data.error_description : undefined;

    if (error === "invalid_grant" || description?.toLowerCase().includes("redirect")) {
      throw new Error("apple_redirect_uri_mismatch");
    }

    throw new Error("apple_token_exchange_failed");
  }

  const token = appleTokenSchema.parse(await tokenResponse.json());
  const appleUser = await verifyAppleIdToken(token.id_token, expectedNonce);

  return {
    sub: appleUser.sub,
    email: appleUser.email,
    emailVerified: appleUser.email_verified,
  };
}
