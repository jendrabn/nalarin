import type { Metadata } from "next"

import { getCurrentUser } from "@/features/auth/services/session"
import { TryoutExamTypesPage } from "@/features/tryouts/components/tryout-exam-types-page"
import { getPublicTryoutDiscoveryData } from "@/features/tryouts/queries"
import { buildSeoMetadata } from "@/lib/seo"
import { absoluteUrl } from "@/features/blog/utils"

export const metadata: Metadata = buildSeoMetadata({
  title: "Tryout UTBK, UTUL UGM, SIMAK UI, dan CPNS",
  description:
    "Ikuti tryout rutin multi-section untuk melatih ritme, durasi, ranking, hasil, dan pembahasan sebelum ujian di Nalarin.id.",
  path: "/tryouts",
  keywords: [
    "tryout UTBK",
    "tryout UTUL UGM",
    "tryout SIMAK UI",
    "tryout CPNS",
    "ranking tryout",
    "pembahasan tryout",
    "Nalarin.id",
  ],
});

export default async function Page() {
  const user = await getCurrentUser()
  const data = await getPublicTryoutDiscoveryData(user?.id)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Tryout Nalarin",
    url: absoluteUrl("/tryouts"),
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
