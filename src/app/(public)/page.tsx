import type { Metadata } from "next";

import { LandingPage } from "@/features/landing/components/landing-page";
import { faqs } from "@/features/landing/data";
import { getCurrentUser } from "@/features/auth/services/session";

export const metadata: Metadata = {
  title: "Persiapan UTBK, SIMAK UI, dan UTUL UGM",
  description:
    "Nalarin.id membantu persiapan PTN dan CPNS lewat bank soal, mode latihan, quiz bertimer, tryout rutin, ranking, pembahasan, dan progress belajar.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Nalarin.id - Persiapan Tes PTN",
    description:
      "Latihan soal, quiz, tryout, ranking, pembahasan, dan progress belajar untuk UTBK, UTUL UGM, SIMAK UI, dan CPNS.",
    url: "/",
    siteName: "Nalarin.id",
    type: "website",
    locale: "id_ID",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nalarin.id - Persiapan Tes PTN",
    description:
      "Platform persiapan UTBK, UTUL UGM, SIMAK UI, dan CPNS dengan latihan soal dan tryout.",
  },
  keywords: [
    "Nalarin",
    "persiapan UTBK",
    "tryout UTBK",
    "SIMAK UI",
    "CPNS",
    "UTUL UGM",
    "bank soal PTN",
  ],
};

export default async function Page() {
  const userPromise = getCurrentUser();
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Nalarin.id",
      url: "https://nalarin.id",
      brand: {
        "@type": "Brand",
        name: "Nalarin",
      },
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
