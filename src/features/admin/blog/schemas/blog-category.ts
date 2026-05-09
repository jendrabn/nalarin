import { z } from "zod"

export const blogCategoryFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Category name must be at least 2 characters.")
    .max(150, "Category name must be at most 150 characters."),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters.")
    .max(500, "Description must be at most 500 characters."),
})

export type BlogCategoryFormValues = z.infer<typeof blogCategoryFormSchema>
