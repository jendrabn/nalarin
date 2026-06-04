"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { PencilLineIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/page-header"
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

import { deleteGrammarQuestionAction } from "../actions"
import {
  GrammarQuestionPreviewCard,
  type GrammarQuestionPreviewCardQuestion,
} from "./grammar-question-preview-card"

type GrammarQuestionDetailPageProps = {
  question: GrammarQuestionPreviewCardQuestion
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

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Grammar #${question.id}`}
        subtitle="Read-only preview of the selected grammar question, with the same structure used in the preview modal."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline">
              <Link href="/admin/grammar">Back</Link>
            </Button>
            <Button asChild>
              <Link href={`/admin/grammar/${question.id}/edit`}>
                <PencilLineIcon data-icon="inline-start" />
                Edit
              </Link>
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => setConfirmDelete(true)}
              disabled={question.status !== "draft"}
            >
              <Trash2Icon data-icon="inline-start" />
              Delete
            </Button>
          </div>
        }
      />

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 rounded-3xl border border-border/60 bg-gradient-to-br from-muted/25 via-background to-muted/10 p-4 shadow-sm md:p-6">
        <GrammarQuestionPreviewCard question={question} />
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
