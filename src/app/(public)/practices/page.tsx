import type { Metadata } from "next"

import { getCurrentUser } from "@/features/auth/services/session"
import { PracticeExamTypesPage } from "@/features/practices/components/practice-exam-types-page"
import { getPracticeDiscoveryData } from "@/features/practices/queries"
import { buildSeoMetadata } from "@/lib/seo"
import { absoluteUrl } from "@/features/blog/utils"

export const metadata: Metadata = buildSeoMetadata({
  title: "Latihan Soal UTBK, UTUL UGM, SIMAK UI, dan CPNS",
  description:
    "Pilih tipe ujian, mata pelajaran, dan topik untuk latihan yang lebih fokus dengan Mode Latihan dan Mode Quiz di Nalarin.id.",
  path: "/practices",
  keywords: [
    "latihan soal UTBK",
    "bank soal",
    "UTUL UGM",
    "SIMAK UI",
    "CPNS",
    "Mode Latihan",
    "Mode Quiz",
    "Nalarin.id",
  ],
});

export default async function Page() {
  const [user, data] = await Promise.all([
    getCurrentUser(),
    getPracticeDiscoveryData(),
  ])
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Latihan Soal Nalarin",
    url: absoluteUrl("/practices"),
    description: metadata.description,
    numberOfItems: data.examTypes.length,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <PracticeExamTypesPage user={user} data={data} />
    </>
  )
}
