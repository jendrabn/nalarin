import type { Metadata } from "next";

import { LandingPage } from "@/features/landing/components/landing-page";
import { faqs } from "@/features/landing/data";
import { getCurrentUser } from "@/features/auth/services/session";
import { buildSeoMetadata } from "@/lib/seo";
import { absoluteUrl } from "@/features/blog/utils";

export const metadata: Metadata = buildSeoMetadata({
  title: "Latihan UTBK, UTUL UGM, SIMAK UI, dan CPNS",
  description:
    "Latihan soal, Mode Latihan, Mode Quiz, tryout rutin, pembahasan, ranking, dan progress tracking untuk persiapan seleksi PTN dan CPNS di Nalarin.id.",
  path: "/",
  openGraphTitle: "Nalarin.id - Latihan UTBK, UTUL UGM, SIMAK UI, dan CPNS",
  keywords: [
    "Nalarin.id",
    "latihan UTBK",
    "tryout UTBK",
    "UTUL UGM",
    "SIMAK UI",
    "CPNS",
    "bank soal",
    "Mode Latihan",
    "Mode Quiz",
    "progress tracking",
  ],
});

export default async function Page() {
  const userPromise = getCurrentUser();
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Nalarin.id",
      url: absoluteUrl("/"),
      brand: {
        "@type": "Brand",
        name: "Nalarin.id",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Nalarin.id",
      url: absoluteUrl("/"),
      inLanguage: "id-ID",
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <LandingPage user={await userPromise} />
    </>
  );
}
