"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { FileDownIcon, FileQuestionIcon, PlusIcon, SparklesIcon } from "lucide-react"
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

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm md:col-span-2">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2 text-primary">
              <FileQuestionIcon />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Question bank</p>
              <p className="text-sm text-muted-foreground">
                Search, sort, and manage questions from one place.
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
          <p className="text-sm font-medium text-foreground">Content rules</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>Multiple answer requires a scoring rule.</li>
            <li>True/False uses lowercase correct answer values.</li>
            <li>Used questions are protected from destructive changes.</li>
          </ul>
        </div>
      </div>

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
