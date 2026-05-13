import type { Metadata } from "next"

import type { PlanCode } from "@/config/plans"
import { getCurrentUser } from "@/features/auth/services/session"
import { getCurrentActiveSubscription } from "@/features/premium/queries"
import { PracticesPage } from "@/features/practices/components/practices-page"
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
  const userPromise = getCurrentUser()
  const dataPromise = getPracticeDiscoveryData()

  const user = await userPromise
  const subscriptionPromise = user
    ? getCurrentActiveSubscription(user.id)
    : Promise.resolve(null)
  const [data, currentSubscription] = await Promise.all([
    dataPromise,
    subscriptionPromise,
  ])
  const currentPlanCode: PlanCode = currentSubscription?.planCode ?? "free"
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Latihan Soal Nalarin",
    url: "https://nalarin.id/practices",
    description: metadata.description,
    numberOfItems: data.practices.length,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <PracticesPage
        user={user}
        currentPlanCode={currentPlanCode}
        data={data}
      />
    </>
  )
}
