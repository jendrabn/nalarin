"use client"

import type { ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card"
import { getModelEnumBadgeMeta } from "@/lib/model-enums"
import { cn } from "@/lib/utils"

import {
  grammarQuestionDifficultyLabels,
  grammarQuestionLanguageLabels,
  grammarQuestionStatusLabels,
  type GrammarQuestionDifficulty,
  type GrammarQuestionLanguage,
  type GrammarQuestionStatus,
} from "../constants"
import { previewGrammarQuestionSentence } from "../utils/grammar-question"

export type GrammarQuestionPreviewCardQuestion = {
  id: number
  sentenceTemplate: string
  language: GrammarQuestionLanguage
  difficulty: GrammarQuestionDifficulty
  category: string | null
  blankCount: number
  answers: { order: number; answer: string }[]
  distractors: string[]
  status: GrammarQuestionStatus
}

type GrammarQuestionPreviewCardProps = {
  question: GrammarQuestionPreviewCardQuestion
  className?: string
}

export function GrammarQuestionPreviewCard({
  question,
  className,
}: GrammarQuestionPreviewCardProps) {
  const languageBadge = getModelEnumBadgeMeta("vocabularyLanguage", question.language)
  const difficultyBadge = getModelEnumBadgeMeta("questionDifficulty", question.difficulty)
  const statusBadge = getModelEnumBadgeMeta("contentStatus", question.status)
  const previewSentence = previewGrammarQuestionSentence(question.sentenceTemplate)

  return (
    <Card className={cn("gap-0 overflow-hidden py-0 shadow-sm", className)}>
      <CardHeader className="px-4 py-3 sm:px-4">
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="soft" className={cn(languageBadge.className, "px-2 py-0.5 text-[11px]")}>
              {grammarQuestionLanguageLabels[question.language]}
            </Badge>
            <Badge variant="soft" className={cn(difficultyBadge.className, "px-2 py-0.5 text-[11px]")}>
              {grammarQuestionDifficultyLabels[question.difficulty]}
            </Badge>
            <Badge variant="soft" className={cn(statusBadge.className, "px-2 py-0.5 text-[11px]")}>
              {grammarQuestionStatusLabels[question.status]}
            </Badge>
            <Badge variant="outline" className="px-2 py-0.5 text-[11px]">
              {question.blankCount} blanks
            </Badge>
            <Badge variant="outline" className="px-2 py-0.5 text-[11px]">
              {question.distractors.length} distractors
            </Badge>
            {question.category ? (
              <Badge variant="outline" className="px-2 py-0.5 text-[11px]">
                {question.category}
              </Badge>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="font-medium text-foreground">Grammar #{question.id}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 px-4 pb-4 pt-0 sm:px-4">
        <section className="rounded-xl border border-border/60 bg-muted/20 px-4 py-4">
          <CardDescription>Sentence template</CardDescription>
          <p className="mt-3 whitespace-pre-wrap text-base leading-7 text-foreground">
            {previewSentence || "-"}
          </p>
        </section>

        <div className="grid gap-4 md:grid-cols-2">
          <PreviewSection title="Answers">
            {question.answers.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {question.answers.map((answer) => (
                  <li
                    key={answer.order}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border/60 px-3 py-2"
                  >
                    <span className="text-sm text-muted-foreground">Blank {answer.order}</span>
                    <span className="text-sm font-medium text-foreground">{answer.answer || "-"}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No answers provided.</p>
            )}
          </PreviewSection>

          <PreviewSection title="Distractors">
            {question.distractors.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {question.distractors.map((distractor, index) => (
                  <Badge key={`${distractor}-${index}`} variant="outline">
                    {distractor}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No distractors.</p>
            )}
          </PreviewSection>
        </div>

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
