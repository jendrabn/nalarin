import type { MetadataRoute } from "next";

import { env } from "@/config/env";

export default function robots(): MetadataRoute.Robots {
  const appUrl = new URL(env.APP_URL);

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/"],
    },
    sitemap: new URL("/sitemap.xml", appUrl).toString(),
    host: appUrl.toString(),
  };
}
