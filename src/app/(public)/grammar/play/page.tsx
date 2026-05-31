import type { Metadata } from "next"

import { buildSeoMetadata } from "@/lib/seo"

import { GrammarPlayPage } from "@/features/grammar-game/components/grammar-play-page"
import { getGrammarGameSession } from "@/features/grammar-game/queries"
import { parseGrammarGameConfig } from "@/features/grammar-game/utils"

type GrammarPlayPageProps = {
  searchParams?: Promise<{
    language?: string | string[]
    difficulty?: string | string[]
    category?: string | string[]
    count?: string | string[]
  }>
}

export const metadata: Metadata = buildSeoMetadata({
  title: "Main Game Grammar",
  description:
    "Game grammar fill in blank interaktif dengan drag-and-drop, feedback benar-salah, dan ringkasan hasil tanpa menyimpan sesi ke database.",
  path: "/grammar/play",
  noIndex: true,
})

export default async function Page({ searchParams }: GrammarPlayPageProps) {
  const query = await (searchParams ?? Promise.resolve({}))
  const session = await getGrammarGameSession(parseGrammarGameConfig(query))

  return <GrammarPlayPage session={session} />
}
