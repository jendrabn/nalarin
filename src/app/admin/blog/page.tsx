import type { Metadata } from "next"

import { BlogPostsPage } from "@/features/admin/blog/components/blog-posts-page"
import { getBlogPosts } from "@/features/admin/blog/queries"

export const metadata: Metadata = {
  title: "Blog Posts",
  description: "Manage blog posts from the admin panel.",
}

export default async function Page() {
  const posts = await getBlogPosts()

  return <BlogPostsPage posts={posts} />
}
