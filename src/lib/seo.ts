import type { Metadata } from "next";

import { env } from "@/config/env";
import { absoluteUrl } from "@/features/blog/utils";

export const SITE_NAME = "Nalarin";
export const SITE_URL = env.APP_URL;
export const SITE_LOGO_URL = "/images/brand/logo-nalarin.svg";
export const SITE_ICON_URL = "/favicon.ico";
export const SITE_ICON_SVG_URL = "/images/brand/logo-initial-nalarin.svg";
export const SITE_DESCRIPTION =
  "Nalarin membantu persiapan UTBK, UTUL UGM, SIMAK UI, dan CPNS dengan bank soal, Mode Latihan, Mode Quiz, tryout rutin, pembahasan, ranking, dan progress tracking.";

type BuildSeoMetadataOptions = {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
  noIndex?: boolean;
  openGraphTitle?: string;
  openGraphType?: "website" | "article";
};

export function buildSeoMetadata({
  title,
  description,
  path,
  keywords,
  noIndex = false,
  openGraphTitle,
  openGraphType = "website",
}: BuildSeoMetadataOptions): Metadata {
  return {
    title,
    description,
    keywords,
    alternates: path ? { canonical: path } : undefined,
    openGraph: {
      title: openGraphTitle ?? title,
      description,
      url: path ? absoluteUrl(path) : undefined,
      siteName: SITE_NAME,
      type: openGraphType,
      locale: "id_ID",
    },
    twitter: {
      card: "summary_large_image",
      title: openGraphTitle ?? title,
      description,
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
  };
}
