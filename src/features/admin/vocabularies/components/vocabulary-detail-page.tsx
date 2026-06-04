"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
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

import { deleteVocabularyAction } from "../actions"
import {
  VocabularyPreviewCard,
  type VocabularyPreviewCardVocabulary,
} from "./vocabulary-preview-card"

type VocabularyDetailPageProps = {
  vocabulary: VocabularyPreviewCardVocabulary
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
      <PageHeader
        title={vocabulary.word}
        subtitle="Read-only preview of the selected vocabulary item, with the same structure used in the preview modal."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline">
              <Link href="/admin/vocabularies">Back</Link>
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
        }
      />

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 rounded-3xl border border-border/60 bg-gradient-to-br from-muted/25 via-background to-muted/10 p-4 shadow-sm md:p-6">
        <VocabularyPreviewCard vocabulary={vocabulary} />
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
