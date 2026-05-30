"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRightIcon, BookOpenIcon, ShuffleIcon, SparklesIcon } from "lucide-react"
import { useState } from "react"

import { SiteFooter } from "@/components/site-footer"
import { SiteNavbar, type SiteUser } from "@/components/site-navbar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

import type { CurrentUser } from "@/features/auth/services/session"

import { buildVocabularyGameSearchParams } from "../utils"
import {
  vocabularyGameCountValues,
  vocabularyGameDifficultyLabels,
  vocabularyGameDifficultyValues,
  vocabularyGameLanguageLabels,
  vocabularyGameLanguageValues,
  vocabularyGameTypeLabels,
  vocabularyGameTypeValues,
} from "../constants"
import type { VocabularyGameConfig } from "../types"

type VocabularyConfigPageProps = {
  user: CurrentUser | null
  publishedCount: number
  initialConfig: VocabularyGameConfig
}

const configSections = [
  {
    key: "language",
    title: "Bahasa",
    description: "Pilih apakah kartu berisi kosakata Indonesia, Inggris, atau campuran.",
  },
  {
    key: "difficulty",
    title: "Tingkat Kesulitan",
    description: "Atur level kata yang mau dilatih sesuai target belajar.",
  },
  {
    key: "type",
    title: "Tipe Soal",
    description: "Filter kata berdasarkan sinonim, antonim, definisi, atau campuran.",
  },
  {
    key: "count",
    title: "Jumlah Soal",
    description: "Sesuaikan panjang sesi. Jika stok tidak cukup, game tetap berjalan.",
  },
] as const

type ConfigKey = (typeof configSections)[number]["key"]

export function VocabularyConfigPage({
  user,
  publishedCount,
  initialConfig,
}: VocabularyConfigPageProps) {
  const router = useRouter()
  const [config, setConfig] = useState(initialConfig)
  const siteUser = user
    ? ({
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        role: user.role,
      } satisfies NonNullable<SiteUser>)
    : null

  const startGame = () => {
    const searchParams = buildVocabularyGameSearchParams(config, String(Date.now()))
    router.push(`/vocabulary/play?${searchParams}`)
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNavbar user={siteUser} />
      <section className="relative overflow-hidden border-b border-border/60 bg-[radial-gradient(circle_at_top_left,_rgba(244,114,182,0.14),transparent_32%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.14),transparent_28%),linear-gradient(to_bottom,rgba(255,255,255,0.9),rgba(248,250,252,0.92))]">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.025)_1px,transparent_1px)] bg-[size:36px_36px] opacity-70" />
        <div className="absolute -top-24 right-10 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-28 left-6 h-72 w-72 rounded-full bg-chart-2/10 blur-3xl" />

        <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="rounded-full border-primary/20 bg-primary/5 text-primary">
              <SparklesIcon data-icon="inline-start" />
              100% Gratis
            </Badge>
            <Badge variant="outline" className="rounded-full">
              <ShuffleIcon data-icon="inline-start" />
              Swipe Card Interaktif
            </Badge>
            <Badge variant="outline" className="rounded-full">
              <BookOpenIcon data-icon="inline-start" />
              {publishedCount.toLocaleString("id-ID")} Kosakata Publik
            </Badge>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <div className="max-w-3xl">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                Game Kosakata untuk latihan cepat, fokus, dan gratis.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                Pilih konfigurasi, lalu mulai sesi swipe card. Setiap kartu menampilkan satu kata dan dua
                pilihan makna. Data sesi tidak disimpan di database, jadi refresh akan memulai ulang sesi.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  ["Filter", "Bahasa, kesulitan, dan tipe soal"],
                  ["Acak Server", "Urutan soal di-shuffle sebelum dikirim"],
                  ["Tanpa Biaya", "Bisa dipakai semua user tanpa plan"],
                ].map(([title, description]) => (
                  <Card key={title} className="border-border/70 bg-card/90 shadow-sm backdrop-blur">
                    <CardContent className="p-4">
                      <div className="text-sm font-semibold text-foreground">{title}</div>
                      <div className="mt-1 text-sm leading-6 text-muted-foreground">{description}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Card className="relative overflow-hidden border-border/80 bg-card/95 shadow-xl shadow-primary/5 backdrop-blur">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-chart-2 to-chart-1" />
              <CardHeader className="pb-3">
                <CardTitle className="text-xl">Atur sesi game</CardTitle>
                <CardDescription>
                  Konfigurasi ini akan dipakai untuk mengambil kosakata dari database.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {configSections.map((section) => {
                  const key = section.key as ConfigKey
                  return (
                    <ConfigPickerGroup
                      key={section.key}
                      title={section.title}
                      description={section.description}
                      value={config[key]}
                      onChange={(nextValue) =>
                        setConfig((current) => ({
                          ...current,
                          [key]: nextValue as VocabularyGameConfig[typeof key],
                        }))
                      }
                    />
                  )
                })}

                <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-secondary/30 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-medium text-foreground">Siap dimainkan</div>
                      <div className="text-sm leading-6 text-muted-foreground">
                        Data sesi dibuat di browser saat kamu mulai, lalu hilang saat refresh.
                      </div>
                    </div>
                    <Badge variant="soft" className="rounded-full px-3 py-1 text-[0.75rem]">
                      {config.count} soal
                    </Badge>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button type="button" size="lg" className="w-full sm:flex-1" onClick={startGame}>
                      Mulai Game
                      <ArrowRightIcon data-icon="inline-end" />
                    </Button>
                    <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                      <Link href="/">
                        Kembali ke Beranda
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="text-xs leading-6 text-muted-foreground">
                  Tips: kalau filter terlalu sempit dan kosakata tidak cukup, ubah ke opsi{" "}
                  <span className="font-medium text-foreground">Campuran</span> atau turunkan jumlah soal.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  )
}

function ConfigPickerGroup({
  title,
  description,
  value,
  onChange,
}: {
  title: string
  description: string
  value: string | number
  onChange: (value: string | number) => void
}) {
  const isCountGroup = typeof value === "number"

  return (
    <div className="space-y-3">
      <div>
        <div className="text-sm font-semibold text-foreground">{title}</div>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(isCountGroup ? vocabularyGameCountValues : getConfigValues(title)).map((option) => {
          const active = option === value

          return (
            <Button
              key={String(option)}
              type="button"
              variant={active ? "default" : "outline"}
              size="sm"
              aria-pressed={active}
              onClick={() => onChange(option)}
              className={cn(
                "rounded-full",
                !active && "text-muted-foreground hover:border-primary/30 hover:text-foreground",
              )}
            >
              {isCountGroup ? option : getConfigLabel(title, option as string)}
            </Button>
          )
        })}
      </div>
    </div>
  )
}

function getConfigValues(title: string) {
  if (title === "Bahasa") {
    return vocabularyGameLanguageValues
  }

  if (title === "Tingkat Kesulitan") {
    return vocabularyGameDifficultyValues
  }

  return vocabularyGameTypeValues
}

function getConfigLabel(title: string, value: string) {
  if (title === "Bahasa") {
    return vocabularyGameLanguageLabels[value as keyof typeof vocabularyGameLanguageLabels]
  }

  if (title === "Tingkat Kesulitan") {
    return vocabularyGameDifficultyLabels[value as keyof typeof vocabularyGameDifficultyLabels]
  }

  return vocabularyGameTypeLabels[value as keyof typeof vocabularyGameTypeLabels]
}
