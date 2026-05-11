import type { ModelEnumValue } from "@/lib/model-enums"
import { modelEnums } from "@/lib/model-enums"

export const blogPostStatusValues = modelEnums.contentStatus.values

export type BlogPostStatus = ModelEnumValue<"contentStatus">

export const blogPostStatusLabels = modelEnums.contentStatus.labels

export const blogPostColumnLabels = {
  id: "ID",
  title: "Title",
  slug: "Slug",
  category: "Category",
  status: "Status",
  excerpt: "Excerpt",
  thumbnail: "Thumbnail",
  viewCount: "View Count",
  readTimeMinutes: "Read Time",
  publishedAt: "Published At",
  createdAt: "Created At",
  updatedAt: "Updated At",
} as const
