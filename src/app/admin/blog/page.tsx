import type { Metadata } from "next"

import { BlogPostsPage } from "@/features/admin/blog/components/blog-posts-page"
import { getBlogPosts } from "@/features/admin/blog/queries/blog-posts"

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Manage blog posts, SEO metadata, thumbnails, and article publishing from the admin panel.",
}

export default async function Page() {
  const posts = await getBlogPosts()

  return <BlogPostsPage posts={posts} />
}

