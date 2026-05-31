import type { Metadata } from "next"

import { SiteFooter } from "@/components/site-footer"
import { SiteNavbar, type SiteUser } from "@/components/site-navbar"
import { absoluteUrl } from "@/features/blog/utils"
import { getCurrentUser } from "@/features/auth/services/session"
import { buildSeoMetadata } from "@/lib/seo"

import { VocabularyConfigPage } from "@/features/vocabulary-game/components/vocabulary-config-page"
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
  const query = (await (searchParams ?? Promise.resolve({}))) ?? {}
  const user = await getCurrentUser()
  const siteUser = user
    ? ({
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        role: user.role,
      } satisfies NonNullable<SiteUser>)
    : null

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
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <SiteNavbar user={siteUser} />
        <main className="flex-1">
          <VocabularyConfigPage initialConfig={initialConfig} />
        </main>
        <SiteFooter />
      </div>
    </>
  )
}
