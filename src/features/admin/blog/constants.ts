export const blogPostStatusValues = [
  "draft",
  "published",
  "archived",
] as const

export type BlogPostStatus = (typeof blogPostStatusValues)[number]

export const blogPostStatusLabels: Record<BlogPostStatus, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
}

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

