import type { MetadataRoute } from "next";

import { getPracticeDiscoveryData } from "@/features/practices/queries";
import { getPublishedMaterialSitemapEntries } from "@/features/materials/queries";
import { getPublicTryoutDiscoveryData } from "@/features/tryouts/queries";
import { getPublishedBlogSitemapEntries } from "@/features/blog/queries";
import { absoluteUrl } from "@/features/blog/utils";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [blogPosts, practiceData, materialEntries, tryoutData] = await Promise.all([
    getPublishedBlogSitemapEntries(),
    getPracticeDiscoveryData(),
    getPublishedMaterialSitemapEntries(),
    getPublicTryoutDiscoveryData(),
  ]);
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/practices"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: absoluteUrl("/tryouts"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: absoluteUrl("/materials"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.84,
    },
    {
      url: absoluteUrl("/blog"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: absoluteUrl("/pricing"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: absoluteUrl("/privacy"),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: absoluteUrl("/terms"),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  return [
    ...staticRoutes,
    ...practiceData.examTypes.map((examType) => ({
      url: absoluteUrl(`/practices/exam/${examType.slug}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...tryoutData.examTypes.map((examType) => ({
      url: absoluteUrl(`/tryouts/exam/${examType.slug}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...practiceData.examTypes.map((examType) => ({
      url: absoluteUrl(`/materials/exam/${examType.slug}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...materialEntries.map((material) => ({
      url: absoluteUrl(`/materials/exam/${material.examTypeSlug}/${material.slug}`),
      lastModified: material.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.65,
      images: material.thumbnailUrl ? [absoluteUrl(material.thumbnailUrl)] : undefined,
    })),
    ...tryoutData.tryouts.map((tryout) => ({
      url: absoluteUrl(`/tryouts/${tryout.slug}`),
      lastModified: tryout.publishedAt
        ? new Date(tryout.publishedAt)
        : now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...blogPosts.map((post) => ({
      url: absoluteUrl(`/blog/${post.slug}`),
      lastModified: post.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
      images: post.thumbnailUrl ? [absoluteUrl(post.thumbnailUrl)] : undefined,
    })),
  ];
}
