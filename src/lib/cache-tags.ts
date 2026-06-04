export const CACHE_TAGS = {
  blog: "blog",
  examTypes: "exam-types",
  materials: "materials",
  practiceDiscovery: "practice-discovery",
  pricing: "pricing",
  sitemap: "sitemap",
  tryouts: "tryouts",
  voucherPromos: "voucher-promos",
} as const

export const cacheTagFor = {
  blogPost: (slug: string) => `blog-post:${slug}`,
  material: (slug: string) => `material:${slug}`,
  tryout: (slug: string) => `tryout:${slug}`,
} as const
