"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { CirclePlayIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

import {
  grammarGameCountValues,
  grammarGameDifficultyLabels,
  grammarGameDifficultyValues,
  grammarGameLanguageLabels,
  grammarGameLanguageValues,
} from "../constants"
import type { GrammarGameConfig } from "../types"
import { buildGrammarGameSearchParams } from "../utils"

type GrammarConfigPageProps = {
  initialConfig: GrammarGameConfig
  availableCategories: string[]
}

const configSections = [
  { key: "language", title: "Bahasa", tone: "sky" },
  { key: "difficulty", title: "Level", tone: "amber" },
  { key: "category", title: "Kategori", tone: "violet" },
  { key: "count", title: "Jumlah", tone: "emerald" },
] as const

type ConfigKey = (typeof configSections)[number]["key"]
type SectionTone = (typeof configSections)[number]["tone"]

export function GrammarConfigPage({
  initialConfig,
  availableCategories,
}: GrammarConfigPageProps) {
  const router = useRouter()
  const [config, setConfig] = useState(initialConfig)

  const sortedCategories = useMemo(
    () => Array.from(new Set(availableCategories)).sort((left, right) => left.localeCompare(right)),
    [availableCategories],
  )

  const startGame = () => {
    const searchParams = buildGrammarGameSearchParams(config)
    router.push(`/grammar/play?${searchParams}`)
  }

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Siap Isi Celah?
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          Pilih pengaturan yang paling sesuai sebelum memulai permainan.
        </p>
      </div>

      <div className="space-y-7 rounded-3xl border border-border/60 bg-card/80 px-5 py-5 shadow-sm dark:bg-card/70 sm:px-6 sm:py-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {configSections.map((section) => {
            const key = section.key as ConfigKey

            if (key === "category") {
              return (
                <CategoryPicker
                  key={section.key}
                  title={section.title}
                  tone={section.tone}
                  value={config.category}
                  categories={sortedCategories}
                  onChange={(value) =>
                    setConfig((current) => ({
                      ...current,
                      category: value,
                    }))
                  }
                />
              )
            }

            return (
              <ConfigPickerGroup
                key={section.key}
                title={section.title}
                tone={section.tone}
                value={config[key]}
                onChange={(nextValue) =>
                  setConfig((current) => ({
                    ...current,
                    [key]: nextValue as GrammarGameConfig[typeof key],
                  }))
                }
              />
            )
          })}
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            size="lg"
            onClick={startGame}
            className="group relative h-12 w-full overflow-hidden rounded-full border-0 bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 px-6 text-base font-semibold text-white shadow-[0_18px_32px_-18px_rgba(79,70,229,0.55)] transition-all hover:-translate-y-0.5 hover:shadow-[0_22px_36px_-16px_rgba(79,70,229,0.55)] dark:from-sky-400 dark:via-indigo-400 dark:to-violet-400 dark:text-slate-950 dark:shadow-[0_18px_32px_-18px_rgba(96,165,250,0.4)] dark:hover:shadow-[0_22px_36px_-16px_rgba(96,165,250,0.45)] sm:w-fit sm:min-w-56"
          >
            <span className="absolute inset-0 bg-white/0 transition-colors duration-200 group-hover:bg-white/6" />
            <span className="relative inline-flex items-center gap-2">
              <CirclePlayIcon className="size-4" />
              Mulai Game
            </span>
          </Button>
        </div>
      </div>
    </section>
  )
}

function ConfigPickerGroup({
  title,
  tone,
  value,
  onChange,
}: {
  title: string
  tone: SectionTone
  value: string | number
  onChange: (value: string | number) => void
}) {
  const values =
    title === "Bahasa"
      ? grammarGameLanguageValues
      : title === "Level"
        ? grammarGameDifficultyValues
        : grammarGameCountValues

  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold tracking-tight text-foreground">{title}</div>
      <div className="flex flex-wrap gap-2.5">
        {values.map((option) => {
          const active = option === value

          return (
            <Button
              key={String(option)}
              type="button"
              size="sm"
              variant="outline"
              aria-pressed={active}
              onClick={() => onChange(option)}
              className={cn(
                "h-10 rounded-full px-4 text-sm font-medium transition-all",
                active
                  ? getToneButtonClasses(tone)
                  : "border-border bg-background text-muted-foreground shadow-none hover:-translate-y-px hover:text-foreground dark:border-input/80 dark:bg-input/10 dark:text-muted-foreground dark:hover:bg-input/20 dark:hover:text-foreground",
              )}
            >
              {title === "Bahasa"
                ? grammarGameLanguageLabels[option as keyof typeof grammarGameLanguageLabels]
                : title === "Level"
                  ? grammarGameDifficultyLabels[option as keyof typeof grammarGameDifficultyLabels]
                  : option}
            </Button>
          )
        })}
      </div>
    </div>
  )
}

function CategoryPicker({
  title,
  tone,
  value,
  categories,
  onChange,
}: {
  title: string
  tone: SectionTone
  value: string
  categories: string[]
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold tracking-tight text-foreground">{title}</div>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-10 rounded-full border-border/60 bg-background text-sm font-medium shadow-none">
          <SelectValue placeholder="Semua kategori" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua kategori</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category} value={category}>
              {category}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex flex-wrap gap-2">
        {categories.slice(0, 4).map((category) => {
          const active = value.trim().toLowerCase() === category.trim().toLowerCase()

          return (
            <Button
              key={category}
              type="button"
              size="sm"
              variant="outline"
              aria-pressed={active}
              onClick={() => onChange(category)}
              className={cn(
                "h-9 rounded-full px-3 text-xs font-medium transition-all",
                active
                  ? getToneButtonClasses(tone)
                  : "border-border bg-background text-muted-foreground shadow-none hover:text-foreground dark:border-input/80 dark:bg-input/10 dark:hover:bg-input/20 dark:hover:text-foreground",
              )}
            >
              {category}
            </Button>
          )
        })}
      </div>
    </div>
  )
}

function getToneButtonClasses(tone: SectionTone) {
  if (tone === "sky") {
    return "border-sky-500 bg-sky-500 text-white shadow-[0_10px_24px_-14px_rgba(14,165,233,0.6)] hover:bg-sky-500 hover:text-white dark:border-sky-300/35 dark:bg-sky-500/20 dark:text-sky-50 dark:hover:bg-sky-500/30 dark:hover:text-sky-50"
  }

  if (tone === "amber") {
    return "border-amber-500 bg-amber-500 text-white shadow-[0_10px_24px_-14px_rgba(245,158,11,0.55)] hover:bg-amber-500 hover:text-white dark:border-amber-300/35 dark:bg-amber-500/20 dark:text-amber-50 dark:hover:bg-amber-500/30 dark:hover:text-amber-50"
  }

  if (tone === "violet") {
    return "border-violet-500 bg-violet-500 text-white shadow-[0_10px_24px_-14px_rgba(139,92,246,0.58)] hover:bg-violet-500 hover:text-white dark:border-violet-300/35 dark:bg-violet-500/20 dark:text-violet-50 dark:hover:bg-violet-500/30 dark:hover:text-violet-50"
  }

  return "border-emerald-500 bg-emerald-500 text-white shadow-[0_10px_24px_-14px_rgba(16,185,129,0.58)] hover:bg-emerald-500 hover:text-white dark:border-emerald-300/35 dark:bg-emerald-500/20 dark:text-emerald-50 dark:hover:bg-emerald-500/30 dark:hover:text-emerald-50"
}
