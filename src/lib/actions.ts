import { z } from "zod"

export type ActionError<FormValues> = {
  success: false
  message: string
  fieldErrors?: Partial<Record<keyof FormValues, string[]>>
}

export type ActionSuccess<T = unknown> = {
  success: true
  data: T
}

export type ActionResult<FormValues, T = unknown> =
  | ActionError<FormValues>
  | ActionSuccess<T>

export function flattenZodError<FormValues>(error: z.ZodError<FormValues>) {
  return error.flatten().fieldErrors as Partial<Record<keyof FormValues, string[]>>
}

export function isDuplicateEntryError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "ER_DUP_ENTRY"
  )
}

export async function buildUniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>,
) {
  let slug = base
  let suffix = 2

  while (await exists(slug)) {
    slug = `${base}-${suffix}`
    suffix += 1
  }

  return slug
}
