import type { Metadata } from "next"

import { getCurrentUser } from "@/features/auth/services/session"
import { absoluteUrl } from "@/features/blog/utils"
import { buildSeoMetadata } from "@/lib/seo"

import {
  VocabularyConfigPage,
} from "@/features/vocabulary-game/components/vocabulary-config-page"
import { getPublishedVocabularyCount } from "@/features/vocabulary-game/queries"
import {
  getVocabularyGameLandingConfig,
  parseVocabularyGameConfig,
} from "@/features/vocabulary-game/utils"

type VocabularyPageProps = {
  searchParams?: Promise<{
    language?: string | string[]
    difficulty?: string | string[]
    type?: string | string[]
    count?: string | string[]
  }>
}

export const metadata: Metadata = buildSeoMetadata({
  title: "Game Kosakata",
  description:
    "Mainkan game kosakata gratis dengan konfigurasi bahasa, kesulitan, tipe, dan jumlah soal sebelum memulai sesi swipe card.",
  path: "/vocabulary",
  keywords: [
    "game kosakata",
    "kosakata gratis",
    "swipe card kosakata",
    "latihan vocabulary",
    "Nalarin.id",
  ],
})

export default async function Page({ searchParams }: VocabularyPageProps) {
  const [user, publishedCount, query] = await Promise.all([
    getCurrentUser(),
    getPublishedVocabularyCount(),
    searchParams ?? Promise.resolve({}),
  ])

  const initialConfig = getVocabularyGameLandingConfig(parseVocabularyGameConfig(query))

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Game Kosakata Nalarin",
            url: absoluteUrl("/vocabulary"),
            description: metadata.description,
            inLanguage: "id-ID",
          }).replace(/</g, "\\u003c"),
        }}
      />
      <VocabularyConfigPage
        user={user}
        publishedCount={publishedCount}
        initialConfig={initialConfig}
      />
    </>
  )
}
