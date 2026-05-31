import type { Metadata } from "next"

import { SiteFooter } from "@/components/site-footer"
import { SiteNavbar, type SiteUser } from "@/components/site-navbar"
import { absoluteUrl } from "@/features/blog/utils"
import { getCurrentUser } from "@/features/auth/services/session"
import { buildSeoMetadata } from "@/lib/seo"

import { GrammarConfigPage } from "@/features/grammar-game/components/grammar-config-page"
import {
  getGrammarGameDiscoveryData,
} from "@/features/grammar-game/queries"
import { parseGrammarGameConfig } from "@/features/grammar-game/utils"

type GrammarPageProps = {
  searchParams?: Promise<{
    language?: string | string[]
    difficulty?: string | string[]
    category?: string | string[]
    count?: string | string[]
  }>
}

export const metadata: Metadata = buildSeoMetadata({
  title: "Game Grammar",
  description:
    "Mainkan grammar fill in blank gratis dengan konfigurasi bahasa, tingkat kesulitan, kategori, dan jumlah soal sebelum mulai bermain.",
  path: "/grammar",
  keywords: [
    "Game Grammar",
    "fill in blank",
    "grammar gratis",
    "latihan grammar",
    "Nalarin.id",
  ],
})

export default async function Page({ searchParams }: GrammarPageProps) {
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

  const discoveryData = await getGrammarGameDiscoveryData()
  const initialConfig = parseGrammarGameConfig(query)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Game Grammar Nalarin",
            url: absoluteUrl("/grammar"),
            description: metadata.description,
            inLanguage: "id-ID",
          }).replace(/</g, "\\u003c"),
        }}
      />
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <SiteNavbar user={siteUser} />
        <main className="flex-1">
          <GrammarConfigPage
            initialConfig={initialConfig}
            availableCategories={discoveryData.categories}
          />
        </main>
        <SiteFooter />
      </div>
    </>
  )
}
