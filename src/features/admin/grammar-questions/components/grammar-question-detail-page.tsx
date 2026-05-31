"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { PencilLineIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/page-header"
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

import { deleteGrammarQuestionAction } from "../actions"
import type { GrammarQuestionDetails } from "../queries"
import { previewGrammarQuestionSentence } from "../utils/grammar-question"

type GrammarQuestionDetailPageProps = {
  question: GrammarQuestionDetails
}

export function GrammarQuestionDetailPage({ question }: GrammarQuestionDetailPageProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function handleDelete() {
    setIsDeleting(true)

    try {
      const result = await deleteGrammarQuestionAction(question.id)

      if (!result.success) {
        toast.error(result.message)
        return
      }

      toast.success("Grammar question deleted.")
      router.replace("/admin/grammar")
      router.refresh()
    } finally {
      setIsDeleting(false)
    }
  }

  const languageBadge = getModelEnumBadgeMeta("vocabularyLanguage", question.language)
  const difficultyBadge = getModelEnumBadgeMeta("questionDifficulty", question.difficulty)
  const statusBadge = getModelEnumBadgeMeta("contentStatus", question.status)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Grammar #${question.id}`}
        subtitle="Inspect the template, answers, distractors, and audit metadata."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline">
              <Link href={`/admin/grammar/${question.id}/edit`}>
                <PencilLineIcon data-icon="inline-start" />
                Edit
              </Link>
            </Button>
            <Button type="button" variant="destructive" onClick={() => setConfirmDelete(true)} disabled={question.status !== "draft"}>
              <Trash2Icon data-icon="inline-start" />
              Delete
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <Card>
          <CardHeader>
            <CardTitle>Sentence Preview</CardTitle>
            <CardDescription>
              The sentence template rendered the way it appears in the game.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
              <p className="flex flex-wrap gap-x-2 gap-y-3 text-lg leading-8 text-foreground">
                {previewGrammarQuestionSentence(question.sentenceTemplate)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="soft" className={languageBadge.className}>
                {languageBadge.label}
              </Badge>
              <Badge variant="soft" className={difficultyBadge.className}>
                {difficultyBadge.label}
              </Badge>
              <Badge variant="soft" className={statusBadge.className}>
                {statusBadge.label}
              </Badge>
              <Badge variant="outline">{question.blankCount} blanks</Badge>
              <Badge variant="outline">{question.distractors.length} distractors</Badge>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Answers</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {question.answers.map((answer) => (
                <div
                  key={answer.order}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/60 px-3 py-2"
                >
                  <span className="text-sm text-muted-foreground">Blank {answer.order}</span>
                  <span className="text-sm font-medium text-foreground">{answer.answer || "-"}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distractors</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {question.distractors.length > 0 ? (
                question.distractors.map((distractor, index) => (
                  <Badge key={`${distractor}-${index}`} variant="outline">
                    {distractor}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">No distractors.</span>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Audit</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                Created at <span className="font-medium text-foreground">{formatAdminDateTime(question.createdAt)}</span>
              </p>
              <p>
                Updated at <span className="font-medium text-foreground">{formatAdminDateTime(question.updatedAt)}</span>
              </p>
              <p>
                Created by{" "}
                <span className="font-medium text-foreground">
                  {question.createdByName ?? "System"}
                </span>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete grammar question?</AlertDialogTitle>
            <AlertDialogDescription>
              Only draft grammar questions can be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleDelete()} disabled={isDeleting}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
