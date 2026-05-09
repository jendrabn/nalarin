"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { FileDownIcon, PlusIcon, SparklesIcon } from "lucide-react"
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

import { deleteQuestionAction } from "../actions/questions"
import type { QuestionRow } from "../queries/questions"
import { QuestionsTable } from "./questions-table"

type QuestionsPageProps = {
  questions: QuestionRow[]
}

export function QuestionsPage({ questions }: QuestionsPageProps) {
  const router = useRouter()
  const [deleteTarget, setDeleteTarget] = useState<QuestionRow | null>(null)

  function handleEdit(question: QuestionRow) {
    router.push(`/admin/questions/${question.id}/edit`)
  }

  function handleGenerateExplanation(question: QuestionRow) {
    router.push(`/admin/questions/${question.id}/ai-explanation`)
  }

  async function handleDelete() {
    if (!deleteTarget) {
      return
    }

    const result = await deleteQuestionAction(deleteTarget.id)

    if (result.success) {
      toast.success("Question deleted.")
      setDeleteTarget(null)
      router.refresh()
      return
    }

    toast.error(result.message)
    setDeleteTarget(null)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Questions"
        subtitle="Manage the question bank, import from Excel, and generate draft questions with AI."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline">
              <Link href="/admin/questions/import">
                <FileDownIcon data-icon="inline-start" />
                Import
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/questions/ai-generate">
                <SparklesIcon data-icon="inline-start" />
                AI Generate
              </Link>
            </Button>
            <Button asChild>
              <Link href="/admin/questions/create">
                <PlusIcon data-icon="inline-start" />
                Add Question
              </Link>
            </Button>
          </div>
        }
      />

      <QuestionsTable
        data={questions}
        onEdit={handleEdit}
        onGenerateExplanation={handleGenerateExplanation}
        onDelete={setDeleteTarget}
      />

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete question?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The question will be removed from the
              admin list and from every package that still allows deletion.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button type="button" variant="destructive" onClick={() => void handleDelete()}>
                Delete
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
