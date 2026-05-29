import type { Metadata } from "next"

import { BlogPostsPage } from "@/features/admin/blog/components/blog-posts-page"
import { getBlogPosts } from "@/features/admin/blog/queries"

export const metadata: Metadata = {
  title: "Blog Posts",
  description: "Manage blog posts to keep the content pipeline organized.",
}

export default async function Page() {
  const posts = await getBlogPosts()

  return <BlogPostsPage posts={posts} />
}

