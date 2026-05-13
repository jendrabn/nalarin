import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/", "/account/", "/dashboard/"],
    },
    sitemap: "https://nalarin.id/sitemap.xml",
    host: "https://nalarin.id",
  };
}
