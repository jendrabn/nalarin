import 'dotenv/config';

import { z } from 'zod';

const nonEmptyString = z.string().trim().min(1);
const urlString = z.string().trim().pipe(z.url());

const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined))
  .pipe(z.url().optional());

const booleanFromString = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true');

const GOOGLE_CALLBACK_PATH = '/api/auth/google/callback';
const FACEBOOK_CALLBACK_PATH = '/api/auth/facebook/callback';
const APPLE_CALLBACK_PATH = '/api/auth/apple/callback';

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    APP_NAME: nonEmptyString,
    APP_URL: urlString,
    NEXT_PUBLIC_APP_URL: urlString,
    NEXT_PUBLIC_APP_NAME: nonEmptyString,

    DATABASE_URL: nonEmptyString,

    SESSION_PASSWORD: z.string().min(32),
    SESSION_COOKIE_NAME: nonEmptyString,
    SESSION_TTL_DAYS: z.coerce.number().int().min(1).max(365),
    BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(31),

    GOOGLE_AUTH_ENABLED: booleanFromString,
    GOOGLE_CLIENT_ID: optionalString,
    GOOGLE_CLIENT_SECRET: optionalString,
    GOOGLE_REDIRECT_URI: optionalUrl,

    FACEBOOK_AUTH_ENABLED: booleanFromString,
    FACEBOOK_CLIENT_ID: optionalString,
    FACEBOOK_CLIENT_SECRET: optionalString,
    FACEBOOK_REDIRECT_URI: optionalUrl,

    APPLE_AUTH_ENABLED: booleanFromString,
    APPLE_CLIENT_ID: optionalString,
    APPLE_TEAM_ID: optionalString,
    APPLE_KEY_ID: optionalString,
    APPLE_PRIVATE_KEY: optionalString,
    APPLE_REDIRECT_URI: optionalUrl,

    EMAIL_PROVIDER: z.enum(['resend', 'smtp']),
    MAIL_FROM: nonEmptyString,
    RESEND_API_KEY: optionalString,

    SMTP_HOST: optionalString,
    SMTP_PORT: z.coerce.number().int().min(1).max(65535),
    SMTP_SECURE: booleanFromString,
    SMTP_USER: optionalString,
    SMTP_PASSWORD: optionalString,
    SMTP_FROM: optionalString,

    PAYMENT_GATEWAY_ENABLED: booleanFromString,
    MIDTRANS_IS_PRODUCTION: booleanFromString,
    MIDTRANS_SERVER_KEY: optionalString,
    MIDTRANS_CLIENT_KEY: optionalString,
    MIDTRANS_MERCHANT_ID: optionalString,
    MANUAL_PAYMENT_WHATSAPP_NUMBER: optionalString,
    EWALLET_SHOPEEPAY_PHONE: optionalString,
    EWALLET_GOPAY_PHONE: optionalString,
    EWALLET_OVO_PHONE: optionalString,

    AI_PROVIDER: z.enum(['openai-compatible']),
    AI_API_KEY: nonEmptyString,
    AI_BASE_URL: optionalUrl,
    AI_MODEL_QUESTION_GENERATION: nonEmptyString,
    AI_MODEL_EXPLANATION_GENERATION: nonEmptyString,
    AI_MODEL_GRADING: nonEmptyString,

    FILE_STORAGE_DRIVER: z.enum(['local']),
    FILE_STORAGE_BASE_URL: urlString,
    FILE_STORAGE_PUBLIC_DIR: nonEmptyString,

    CRON_SECRET: z.string().min(16),
    PRACTICE_ABANDONED_HOURS: z.coerce.number().int().min(1),
    TRYOUT_ABANDONED_HOURS: z.coerce.number().int().min(1),
    SUBSCRIPTION_EXPIRY_CRON_ENABLED: booleanFromString,

    LOGIN_RATE_LIMIT_MAX_ATTEMPTS: z.coerce.number().int().min(1),
    LOGIN_RATE_LIMIT_WINDOW_MINUTES: z.coerce.number().int().min(1),
    FORGOT_PASSWORD_MAX_REQUESTS_PER_HOUR: z.coerce.number().int().min(1),
    RESEND_VERIFICATION_MAX_REQUESTS_PER_HOUR: z.coerce.number().int().min(1),
    AI_GENERATE_QUESTION_MAX_PER_DAY: z.coerce.number().int().min(1),
    AI_GENERATE_EXPLANATION_MAX_PER_DAY: z.coerce.number().int().min(1),
    AI_GRADING_MAX_PER_DAY: z.coerce.number().int().min(1),
  })
  .superRefine((value, ctx) => {
    if (value.EMAIL_PROVIDER === 'resend' && !value.RESEND_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['RESEND_API_KEY'],
        message: 'RESEND_API_KEY is required when EMAIL_PROVIDER=resend.',
      });
    }

    if (value.EMAIL_PROVIDER === 'smtp') {
      if (!value.SMTP_HOST) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['SMTP_HOST'],
          message: 'SMTP_HOST is required when EMAIL_PROVIDER=smtp.',
        });
      }

      if (!value.SMTP_USER) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['SMTP_USER'],
          message: 'SMTP_USER is required when EMAIL_PROVIDER=smtp.',
        });
      }

      if (!value.SMTP_PASSWORD) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['SMTP_PASSWORD'],
          message: 'SMTP_PASSWORD is required when EMAIL_PROVIDER=smtp.',
        });
      }
    }

    if (value.PAYMENT_GATEWAY_ENABLED) {
      if (!value.MIDTRANS_SERVER_KEY) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['MIDTRANS_SERVER_KEY'],
          message: 'MIDTRANS_SERVER_KEY is required when PAYMENT_GATEWAY_ENABLED=true.',
        });
      }

      if (!value.MIDTRANS_CLIENT_KEY) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['MIDTRANS_CLIENT_KEY'],
          message: 'MIDTRANS_CLIENT_KEY is required when PAYMENT_GATEWAY_ENABLED=true.',
        });
      }

      if (!value.MIDTRANS_MERCHANT_ID) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['MIDTRANS_MERCHANT_ID'],
          message: 'MIDTRANS_MERCHANT_ID is required when PAYMENT_GATEWAY_ENABLED=true.',
        });
      }
    } else {
      if (!value.MANUAL_PAYMENT_WHATSAPP_NUMBER) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['MANUAL_PAYMENT_WHATSAPP_NUMBER'],
          message:
            'MANUAL_PAYMENT_WHATSAPP_NUMBER is required when PAYMENT_GATEWAY_ENABLED=false.',
        });
      }

      if (!value.EWALLET_SHOPEEPAY_PHONE) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['EWALLET_SHOPEEPAY_PHONE'],
          message: 'EWALLET_SHOPEEPAY_PHONE is required when PAYMENT_GATEWAY_ENABLED=false.',
        });
      }

      if (!value.EWALLET_GOPAY_PHONE) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['EWALLET_GOPAY_PHONE'],
          message: 'EWALLET_GOPAY_PHONE is required when PAYMENT_GATEWAY_ENABLED=false.',
        });
      }

      if (!value.EWALLET_OVO_PHONE) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['EWALLET_OVO_PHONE'],
          message: 'EWALLET_OVO_PHONE is required when PAYMENT_GATEWAY_ENABLED=false.',
        });
      }
    }

    if (value.GOOGLE_AUTH_ENABLED) {
      for (const key of [
        'GOOGLE_CLIENT_ID',
        'GOOGLE_CLIENT_SECRET',
        'GOOGLE_REDIRECT_URI',
      ] as const) {
        if (!value[key]) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [key],
            message: `${key} is required when GOOGLE_AUTH_ENABLED=true.`,
          });
        }
      }

      const expectedGoogleRedirectUri = new URL(
        GOOGLE_CALLBACK_PATH,
        value.APP_URL,
      ).toString();

      if (value.GOOGLE_REDIRECT_URI !== expectedGoogleRedirectUri) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['GOOGLE_REDIRECT_URI'],
          message: `GOOGLE_REDIRECT_URI must exactly match ${expectedGoogleRedirectUri}.`,
        });
      }
    }

    if (value.FACEBOOK_AUTH_ENABLED) {
      for (const key of [
        'FACEBOOK_CLIENT_ID',
        'FACEBOOK_CLIENT_SECRET',
        'FACEBOOK_REDIRECT_URI',
      ] as const) {
        if (!value[key]) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [key],
            message: `${key} is required when FACEBOOK_AUTH_ENABLED=true.`,
          });
        }
      }

      const expectedFacebookRedirectUri = new URL(
        FACEBOOK_CALLBACK_PATH,
        value.APP_URL,
      ).toString();

      if (value.FACEBOOK_REDIRECT_URI !== expectedFacebookRedirectUri) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['FACEBOOK_REDIRECT_URI'],
          message: `FACEBOOK_REDIRECT_URI must exactly match ${expectedFacebookRedirectUri}.`,
        });
      }
    }

    if (value.APPLE_AUTH_ENABLED) {
      for (const key of [
        'APPLE_CLIENT_ID',
        'APPLE_TEAM_ID',
        'APPLE_KEY_ID',
        'APPLE_PRIVATE_KEY',
        'APPLE_REDIRECT_URI',
      ] as const) {
        if (!value[key]) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [key],
            message: `${key} is required when APPLE_AUTH_ENABLED=true.`,
          });
        }
      }

      const expectedAppleRedirectUri = new URL(
        APPLE_CALLBACK_PATH,
        value.APP_URL,
      ).toString();

      if (value.APPLE_REDIRECT_URI !== expectedAppleRedirectUri) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['APPLE_REDIRECT_URI'],
          message: `APPLE_REDIRECT_URI must exactly match ${expectedAppleRedirectUri}.`,
        });
      }
    }
  });

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Invalid environment variables:\n' + z.prettifyError(parsedEnv.error));
  throw new Error('Invalid environment variables.');
}

export const env = parsedEnv.data;

export const publicEnv = {
  NEXT_PUBLIC_APP_NAME: env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_APP_URL: env.NEXT_PUBLIC_APP_URL,
};

export type Env = typeof env;
