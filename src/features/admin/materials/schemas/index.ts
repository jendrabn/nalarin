import { z } from "zod"

import { contentStatusValues } from "@/db/schema"

import { stripHtml } from "../utils/material"

export const materialFormSchema = z
  .object({
    examTypeId: z.string().trim().min(1, "Select an exam type."),
    subjectId: z.string().trim().min(1, "Select a subject."),
    topicId: z.string().trim().default(""),
    title: z
      .string()
      .trim()
      .min(1, "Material title is required.")
      .max(255, "Material title is too long."),
    excerpt: z
      .string()
      .trim()
      .max(500, "Excerpt must be at most 500 characters.")
      .default(""),
    thumbnailUrl: z
      .string()
      .trim()
      .max(2048, "Thumbnail URL is too long.")
      .default(""),
    youtubeUrl: z
      .string()
      .trim()
      .max(2048, "YouTube URL is too long.")
      .default(""),
    content: z
      .string()
      .trim()
      .max(100000, "Content is too long.")
      .default("<p></p>"),
    isFree: z.boolean().default(true),
    status: z.enum(contentStatusValues),
  })
  .superRefine((value, ctx) => {
    if (value.status === "published") {
      const hasVideo = value.youtubeUrl.trim().length > 0
      const hasText = stripHtml(value.content).length > 0

      if (!hasVideo && !hasText) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["youtubeUrl"],
          message: "Provide a YouTube URL or content before publishing.",
        })

        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["content"],
          message: "Provide a YouTube URL or content before publishing.",
        })
      }
    }
  })

export type MaterialFormValues = z.infer<typeof materialFormSchema>

