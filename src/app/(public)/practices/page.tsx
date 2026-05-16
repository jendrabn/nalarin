import type { Metadata } from "next"

import { getCurrentUser } from "@/features/auth/services/session"
import { PracticeExamTypesPage } from "@/features/practices/components/practice-exam-types-page"
import { getPracticeDiscoveryData } from "@/features/practices/queries"

export const metadata: Metadata = {
  title: "Latihan Soal",
  description:
    "Temukan latihan soal berdasarkan tipe ujian, mata pelajaran, dan topik untuk persiapan SNBT, UTUL UGM, SIMAK UI, CPNS, dan ujian lainnya.",
  alternates: {
    canonical: "/practices",
  },
  keywords: [
    "latihan soal",
    "bank soal",
    "SNBT",
    "UTUL UGM",
    "SIMAK UI",
    "CPNS",
    "Nalarin",
  ],
  openGraph: {
    title: "Latihan Soal",
    description:
      "Discovery latihan soal publik berdasarkan tipe ujian dan mata pelajaran di Nalarin.",
    url: "/practices",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Latihan Soal",
    description:
      "Pilih latihan soal sesuai tipe ujian dan mata pelajaran yang sedang kamu siapkan.",
  },
}

export default async function Page() {
  const [user, data] = await Promise.all([
    getCurrentUser(),
    getPracticeDiscoveryData(),
  ])
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Latihan Soal Nalarin",
    url: "https://nalarin.id/practices",
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
