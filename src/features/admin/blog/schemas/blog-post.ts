import { z } from "zod"

import { blogPostStatusValues } from "../constants"

export const blogPostFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Post title must be at least 3 characters.")
    .max(255, "Post title must be at most 255 characters."),
  categoryId: z.string().trim().default(""),
  excerpt: z.string().trim().max(500, "Excerpt must be at most 500 characters.").default(""),
  content: z
    .string()
    .trim()
    .min(20, "Content must be at least 20 characters."),
  thumbnailUrl: z
    .string()
    .trim()
    .max(2048, "Thumbnail URL is too long.")
    .default(""),
  tagsInput: z.string().trim().max(500, "Tags input is too long.").default(""),
  status: z.enum(blogPostStatusValues),
  seoTitle: z
    .string()
    .trim()
    .max(255, "SEO title must be at most 255 characters.")
    .default(""),
  metaDescription: z
    .string()
    .trim()
    .max(160, "Meta description must be at most 160 characters.")
    .default(""),
})

export type BlogPostFormValues = z.infer<typeof blogPostFormSchema>

