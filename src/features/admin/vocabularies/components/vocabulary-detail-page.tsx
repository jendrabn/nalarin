"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { PencilLineIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getModelEnumBadgeMeta } from "@/lib/model-enums"
import { formatAdminDateTime } from "@/lib/format"

import { deleteVocabularyAction } from "../actions"
import {
  vocabularyDifficultyLabels,
  vocabularyLanguageLabels,
  vocabularyStatusLabels,
  vocabularyTypeLabels,
} from "../constants"
import type { VocabularyDetails } from "../queries"
import { previewVocabularyText } from "../utils/vocabulary"

type VocabularyDetailPageProps = {
  vocabulary: VocabularyDetails
}

export function VocabularyDetailPage({ vocabulary }: VocabularyDetailPageProps) {
  const router = useRouter()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    setIsDeleting(true)

    try {
      const result = await deleteVocabularyAction(vocabulary.id)

      if (!result.success) {
        toast.error(result.message)
        return
      }

      toast.success("Vocabulary deleted.")
      router.replace("/admin/vocabularies")
      router.refresh()
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-gradient-to-br from-muted/30 via-background to-muted/10 p-6 shadow-sm md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="soft" className={getModelEnumBadgeMeta("vocabularyLanguage", vocabulary.language).className}>
                {vocabularyLanguageLabels[vocabulary.language]}
              </Badge>
              <Badge variant="soft" className={getModelEnumBadgeMeta("questionDifficulty", vocabulary.difficulty).className}>
                {vocabularyDifficultyLabels[vocabulary.difficulty]}
              </Badge>
              <Badge variant="soft" className={getModelEnumBadgeMeta("vocabularyType", vocabulary.type).className}>
                {vocabularyTypeLabels[vocabulary.type]}
              </Badge>
              <Badge variant="soft" className={getModelEnumBadgeMeta("contentStatus", vocabulary.status).className}>
                {vocabularyStatusLabels[vocabulary.status]}
              </Badge>
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
                Vocabulary
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                {vocabulary.word}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
                Free content for the vocabulary game. Review the correct option, wrong option, and
                example sentence before publishing.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/admin/vocabularies">
                Back
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/admin/vocabularies/${vocabulary.id}/edit`}>
                <PencilLineIcon data-icon="inline-start" />
                Edit
              </Link>
            </Button>
            {vocabulary.status === "draft" ? (
              <Button
                type="button"
                variant="destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2Icon data-icon="inline-start" />
                Delete
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
            <CardDescription>Core vocabulary data and editorial status.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <InfoRow label="Word" value={vocabulary.word} />
            <InfoRow label="Language" value={vocabularyLanguageLabels[vocabulary.language]} />
            <InfoRow label="Difficulty" value={vocabularyDifficultyLabels[vocabulary.difficulty]} />
            <InfoRow label="Type" value={vocabularyTypeLabels[vocabulary.type]} />
            <InfoRow label="Status" value={vocabularyStatusLabels[vocabulary.status]} />
            <InfoRow label="Created By" value={vocabulary.createdByName ?? "System"} />
            <InfoRow label="Created At" value={formatAdminDateTime(vocabulary.createdAt)} />
            <InfoRow label="Updated At" value={formatAdminDateTime(vocabulary.updatedAt)} />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Meaning</CardTitle>
              <CardDescription>The correct answer shown in the game.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">
                {vocabulary.correctMeaning}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Wrong Option</CardTitle>
              <CardDescription>The single wrong answer used in the game.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">
                {vocabulary.wrongOption}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Example Sentence</CardTitle>
              <CardDescription>Optional usage example.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">
                {previewVocabularyText(vocabulary.exampleSentence, 500) || "-"}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete vocabulary?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Only draft vocabularies can be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleDelete()} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  )
}
