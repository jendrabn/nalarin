import type { MetadataRoute } from "next";

import { getPublishedBlogSitemapEntries } from "@/features/blog/queries";
import { absoluteUrl } from "@/features/blog/utils";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const blogPosts = await getPublishedBlogSitemapEntries();
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/blog"),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: absoluteUrl("/pricing"),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  return [
    ...staticRoutes,
    ...blogPosts.map((post) => ({
      url: absoluteUrl(`/blog/${post.slug}`),
      lastModified: post.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
      images: post.thumbnailUrl ? [absoluteUrl(post.thumbnailUrl)] : undefined,
    })),
  ];
}
