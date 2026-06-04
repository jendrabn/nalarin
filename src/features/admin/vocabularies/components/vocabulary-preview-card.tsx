"use client"

import type { ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"
import { getModelEnumBadgeMeta } from "@/lib/model-enums"
import { cn } from "@/lib/utils"

import {
  vocabularyDifficultyLabels,
  vocabularyLanguageLabels,
  vocabularyStatusLabels,
  vocabularyTypeLabels,
  type VocabularyDifficulty,
  type VocabularyLanguage,
  type VocabularyStatus,
  type VocabularyType,
} from "../constants"
import { previewVocabularyText } from "../utils/vocabulary"

export type VocabularyPreviewCardVocabulary = {
  id: number
  word: string
  language: VocabularyLanguage
  difficulty: VocabularyDifficulty
  type: VocabularyType
  correctMeaning: string
  wrongOption: string
  exampleSentence: string | null
  status: VocabularyStatus
}

type VocabularyPreviewCardProps = {
  vocabulary: VocabularyPreviewCardVocabulary
  className?: string
}

export function VocabularyPreviewCard({
  vocabulary,
  className,
}: VocabularyPreviewCardProps) {
  const languageBadge = getModelEnumBadgeMeta("vocabularyLanguage", vocabulary.language)
  const difficultyBadge = getModelEnumBadgeMeta("questionDifficulty", vocabulary.difficulty)
  const typeBadge = getModelEnumBadgeMeta("vocabularyType", vocabulary.type)
  const statusBadge = getModelEnumBadgeMeta("contentStatus", vocabulary.status)

  return (
    <Card className={cn("gap-0 overflow-hidden py-0 shadow-sm", className)}>
      <CardHeader className="px-4 py-3 sm:px-4">
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="soft" className={cn(languageBadge.className, "px-2 py-0.5 text-[11px]")}>
              {vocabularyLanguageLabels[vocabulary.language]}
            </Badge>
            <Badge variant="soft" className={cn(difficultyBadge.className, "px-2 py-0.5 text-[11px]")}>
              {vocabularyDifficultyLabels[vocabulary.difficulty]}
            </Badge>
            <Badge variant="soft" className={cn(typeBadge.className, "px-2 py-0.5 text-[11px]")}>
              {vocabularyTypeLabels[vocabulary.type]}
            </Badge>
            <Badge variant="soft" className={cn(statusBadge.className, "px-2 py-0.5 text-[11px]")}>
              {vocabularyStatusLabels[vocabulary.status]}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="font-medium text-foreground">{vocabulary.word}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 px-4 pb-4 pt-0 sm:px-4">
        <div className="grid gap-4 md:grid-cols-2">
          <PreviewSection title="Correct Meaning">
            <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">
              {vocabulary.correctMeaning}
            </p>
          </PreviewSection>

          <PreviewSection title="Wrong Option">
            <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">
              {vocabulary.wrongOption || "-"}
            </p>
          </PreviewSection>
        </div>

        <PreviewSection title="Example Sentence">
          <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">
            {previewVocabularyText(vocabulary.exampleSentence, 500) || "-"}
          </p>
        </PreviewSection>

      </CardContent>
    </Card>
  )
}

function PreviewSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="rounded-xl border border-border/60 bg-background px-4 py-4">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  )
}
