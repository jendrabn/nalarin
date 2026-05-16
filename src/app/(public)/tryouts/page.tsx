import type { Metadata } from "next"

import { getCurrentUser } from "@/features/auth/services/session"
import { TryoutExamTypesPage } from "@/features/tryouts/components/tryout-exam-types-page"
import { getPublicTryoutDiscoveryData } from "@/features/tryouts/queries"

export const metadata: Metadata = {
  title: "Tryout",
  description:
    "Ikuti tryout rutin multi-section untuk persiapan SNBT, UTUL UGM, SIMAK UI, CPNS, dan ujian masuk lainnya di Nalarin.",
  alternates: {
    canonical: "/tryouts",
  },
  keywords: [
    "tryout",
    "tryout SNBT",
    "tryout UTUL UGM",
    "tryout SIMAK UI",
    "tryout CPNS",
    "Nalarin",
  ],
  openGraph: {
    title: "Tryout Nalarin",
    description:
      "Daftar tryout rutin dengan section, timer, ranking, hasil, dan pembahasan sesuai akses plan.",
    url: "/tryouts",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tryout Nalarin",
    description:
      "Pilih jadwal tryout SNBT, UTUL UGM, SIMAK UI, dan CPNS yang sedang tersedia.",
  },
}

export default async function Page() {
  const user = await getCurrentUser()
  const data = await getPublicTryoutDiscoveryData(user?.id)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Tryout Nalarin",
    url: "https://nalarin.id/tryouts",
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
      <TryoutExamTypesPage
        user={
          user
            ? {
                id: user.id,
                name: user.name,
                email: user.email,
                avatarUrl: user.avatarUrl,
                role: user.role,
                isEmailVerified: Boolean(user.emailVerifiedAt),
              }
            : null
        }
        data={data}
      />
    </>
  )
}
