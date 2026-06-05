import { z } from "zod"

import { PROFILE_BIO_MAX_LENGTH } from "../utils/profile"

export const PROFILE_WHATSAPP_MAX_DIGITS = 15

const whatsappNumberPattern = /^(?:08|62|\+62)\d+$/

function getWhatsappDigitLength(value: string) {
  return value.startsWith("+") ? value.length - 1 : value.length
}

function normalizeWhatsappNumber(value: string) {
  if (value.startsWith("+62")) {
    return value.slice(1)
  }

  if (value.startsWith("08")) {
    return `62${value.slice(1)}`
  }

  return value
}

export const profileFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama minimal 2 karakter.")
    .max(255, "Nama terlalu panjang."),
  phoneNumber: z
    .string()
    .trim()
    .nullish()
    .transform((value) => value ?? "")
    .refine(
      (value) => value === "" || whatsappNumberPattern.test(value),
      "Nomor WhatsApp harus diawali 08, 62, atau +62 dan hanya berisi digit.",
    )
    .refine(
      (value) =>
        value === "" ||
        getWhatsappDigitLength(value) <= PROFILE_WHATSAPP_MAX_DIGITS,
      `Nomor WhatsApp maksimal ${PROFILE_WHATSAPP_MAX_DIGITS} digit.`,
    )
    .transform((value) => (value ? normalizeWhatsappNumber(value) : null)),
  birthDate: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : null))
    .pipe(
      z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal lahir tidak valid.")
        .nullable(),
    ),
  gender: z
    .enum(["male", "female"])
    .nullable()
    .optional()
    .transform((value) => value ?? null),
  bio: z
    .string()
    .trim()
    .max(PROFILE_BIO_MAX_LENGTH, `Bio maksimal ${PROFILE_BIO_MAX_LENGTH} karakter.`)
    .optional()
    .transform((value) => (value ? value : null)),
  avatarUrl: z
    .string()
    .trim()
    .max(2048, "URL avatar terlalu panjang.")
    .optional()
    .transform((value) => (value ? value : null)),
})

export const deleteAccountSchema = z.object({
  email: z.string().email("Email tidak valid."),
})

export type ProfileFormInput = z.input<typeof profileFormSchema>
export type ProfileFormValues = z.output<typeof profileFormSchema>
