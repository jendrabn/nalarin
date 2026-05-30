import type { Metadata } from "next"

import { getCurrentUser } from "@/features/auth/services/session"
import { buildSeoMetadata } from "@/lib/seo"

import { VocabularyPlayPage } from "@/features/vocabulary-game/components/vocabulary-play-page"
import { getVocabularyGameSession } from "@/features/vocabulary-game/queries"
import { parseVocabularyGameConfig } from "@/features/vocabulary-game/utils"

type VocabularyPlayPageProps = {
  searchParams?: Promise<{
    language?: string | string[]
    difficulty?: string | string[]
    type?: string | string[]
    count?: string | string[]
  }>
}

export const metadata: Metadata = buildSeoMetadata({
  title: "Main Game Kosakata",
  description:
    "Sesi game kosakata interaktif dengan swipe card, feedback benar-salah, dan ringkasan hasil tanpa menyimpan data sesi ke database.",
  path: "/vocabulary/play",
  noIndex: true,
})

export default async function Page({ searchParams }: VocabularyPlayPageProps) {
  const [user, query] = await Promise.all([
    getCurrentUser(),
    searchParams ?? Promise.resolve({}),
  ])

  const session = await getVocabularyGameSession(parseVocabularyGameConfig(query))

  return <VocabularyPlayPage user={user} session={session} />
}
