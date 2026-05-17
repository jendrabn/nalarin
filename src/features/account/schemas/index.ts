import { z } from "zod"

import { PROFILE_BIO_MAX_LENGTH } from "../utils/profile"

export const profileFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama minimal 2 karakter.")
    .max(255, "Nama terlalu panjang."),
  phoneNumber: z
    .string()
    .trim()
    .max(32, "Nomor terlalu panjang.")
    .optional()
    .transform((value) => (value ? value : null)),
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
