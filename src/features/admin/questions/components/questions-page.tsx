"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { ColumnDef, VisibilityState } from "@tanstack/react-table"
import {
  FileDownIcon,
  PencilLineIcon,
  PlusIcon,
  Trash2Icon,
  EllipsisVerticalIcon,
  EyeIcon,
} from "lucide-react"
import { toast } from "sonner"

import { AdminDataTable, SortableHeader } from "@/components/admin-data-table"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getModelEnumBadgeMeta } from "@/lib/model-enums"
import { formatAdminDateTime } from "@/lib/format"

import { deleteQuestionAction, deleteQuestionsAction } from "../actions"
import { questionColumnLabels } from "../constants"
import { getQuestionById, type QuestionDetails, type QuestionRow } from "../queries"
import { previewQuestionContent } from "../utils/question"
import { QuestionPreviewCard } from "../../components/question-preview-card"

type QuestionsPageProps = {
  questions: QuestionRow[]
}

const DEFAULT_COLUMN_VISIBILITY: VisibilityState = {
  createdAt: false,
  updatedAt: false,
}

function createColumns({
  onView,
  onEdit,
  onDelete,
}: {
  onView: (question: QuestionRow) => void
  onEdit: (question: QuestionRow) => void
  onDelete: (question: QuestionRow) => void
}): ColumnDef<QuestionRow>[] {
  return [
    {
      accessorKey: "title",
      meta: { label: questionColumnLabels.title },
      header: ({ column }) => <SortableHeader column={column}>Title</SortableHeader>,
      cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          <span className="font-medium text-foreground">
            {row.original.title || "Untitled question"}
          </span>
          <p className="line-clamp-2 max-w-[34rem] whitespace-normal text-sm text-muted-foreground">
            {previewQuestionContent(row.original.content)}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "examTypeName",
      meta: { label: questionColumnLabels.examType },
      header: ({ column }) => <SortableHeader column={column}>Exam Type</SortableHeader>,
      cell: ({ row }) => <span>{row.original.examTypeName}</span>,
    },
    {
      accessorKey: "subjectName",
      meta: { label: questionColumnLabels.subject },
      header: ({ column }) => <SortableHeader column={column}>Subject</SortableHeader>,
      cell: ({ row }) => <span>{row.original.subjectName}</span>,
    },
    {
      accessorKey: "topicName",
      meta: { label: questionColumnLabels.topic },
      header: ({ column }) => <SortableHeader column={column}>Topic</SortableHeader>,
      cell: ({ row }) => <span>{row.original.topicName ?? "-"}</span>,
    },
    {
      accessorKey: "type",
      meta: { label: questionColumnLabels.type },
      header: ({ column }) => <SortableHeader column={column}>Type</SortableHeader>,
      cell: ({ row }) => {
        const badge = getModelEnumBadgeMeta("questionType", row.original.type)

        return (
          <Badge variant="soft" className={badge.className}>
            {badge.label}
          </Badge>
        )
      },
    },
    {
      accessorKey: "difficulty",
      meta: { label: questionColumnLabels.difficulty },
      header: ({ column }) => <SortableHeader column={column}>Difficulty</SortableHeader>,
      cell: ({ row }) => {
        const badge = getModelEnumBadgeMeta("questionDifficulty", row.original.difficulty)

        return (
          <Badge variant="soft" className={badge.className}>
            {badge.label}
          </Badge>
        )
      },
    },
    {
      accessorKey: "status",
      meta: { label: questionColumnLabels.status },
      header: ({ column }) => <SortableHeader column={column}>Status</SortableHeader>,
      cell: ({ row }) => {
        const badge = getModelEnumBadgeMeta("contentStatus", row.original.status)

        return (
          <Badge variant="soft" className={badge.className}>
            {badge.label}
          </Badge>
        )
      },
    },
    {
      accessorKey: "points",
      meta: { label: questionColumnLabels.points },
      header: ({ column }) => <SortableHeader column={column}>Points</SortableHeader>,
      cell: ({ row }) => <span className="tabular-nums">{row.original.points}</span>,
    },
    {
      accessorKey: "year",
      meta: { label: questionColumnLabels.year },
      header: ({ column }) => <SortableHeader column={column}>Year</SortableHeader>,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.year ?? "-"}
        </span>
      ),
    },
    {
      accessorKey: "optionCount",
      meta: { label: questionColumnLabels.optionCount },
      header: ({ column }) => <SortableHeader column={column}>Options</SortableHeader>,
      cell: ({ row }) => <span className="tabular-nums">{row.original.optionCount}</span>,
    },
    {
      accessorKey: "createdAt",
      meta: { label: questionColumnLabels.createdAt },
      header: ({ column }) => <SortableHeader column={column}>Created At</SortableHeader>,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatAdminDateTime(row.original.createdAt)}
        </span>
      ),
    },
    {
      accessorKey: "updatedAt",
      meta: { label: questionColumnLabels.updatedAt },
      header: ({ column }) => <SortableHeader column={column}>Updated At</SortableHeader>,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatAdminDateTime(row.original.updatedAt)}
        </span>
      ),
    },
    {
      id: "actions",
      meta: { label: "Actions" },
      header: () => null,
      enableHiding: false,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="rounded-full"
                aria-label={`Open actions for ${row.original.title || "question"}`}
              >
                <EllipsisVerticalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onView(row.original)}>
                <EyeIcon />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(row.original)}>
                <PencilLineIcon />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => onDelete(row.original)}>
                <Trash2Icon />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ]
}

export function QuestionsPage({ questions }: QuestionsPageProps) {
  const router = useRouter()
  const [deleteTarget, setDeleteTarget] = useState<QuestionRow | null>(null)
  const [viewTarget, setViewTarget] = useState<QuestionDetails | null>(null)
  const [viewLoading, setViewLoading] = useState(false)

  const columns = useMemo(
    () =>
      createColumns({
        onView: async (question) => {
          setViewTarget(null)
          setViewLoading(true)
          try {
            const detail = await getQuestionById(question.id)
            setViewTarget(detail)
          } catch {
            toast.error("Failed to load question preview.")
          } finally {
            setViewLoading(false)
          }
        },
        onEdit: (question) => router.push(`/admin/questions/${question.id}/edit`),
        onDelete: setDeleteTarget,
      }),
    [router],
  )

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
        subtitle="Manage questions to keep the question bank organized and current."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline">
              <Link href="/admin/questions/import">
                <FileDownIcon data-icon="inline-start" />
                Import
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

      <AdminDataTable
        data={questions}
        columns={columns}
        searchPlaceholder="Search questions..."
        emptyMessage="No questions found."
        defaultColumnVisibility={DEFAULT_COLUMN_VISIBILITY}
        defaultPageSize="10"
        enableRowSelection
        getRowId={(question) => String(question.id)}
        onDeleteSelected={async (selectedQuestions) => {
          const result = await deleteQuestionsAction(
            selectedQuestions.map((question) => question.id),
          )

          if (result.success) {
            toast.success(`${result.data.deletedCount} questions deleted.`)
            router.refresh()
            return true
          }

          toast.error(result.message)
          return false
        }}
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

      <Dialog
        open={Boolean(viewTarget) || viewLoading}
        onOpenChange={(open) => {
          if (!open) {
            setViewTarget(null)
            setViewLoading(false)
          }
        }}
      >
        <DialogContent className="max-w-4xl sm:max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>Question Preview</DialogTitle>
            <DialogDescription>
              Read-only preview of the selected question, including options and explanation.
            </DialogDescription>
          </DialogHeader>

          <div className="-mx-4 max-h-[70vh] overflow-y-auto px-4 no-scrollbar">
            {viewLoading ? (
              <div className="rounded-lg border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
                Loading preview...
              </div>
            ) : viewTarget ? (
              <QuestionPreviewCard
                question={{
                  id: viewTarget.id,
                  orderLabel: `Question #${viewTarget.id}`,
                  title: viewTarget.title,
                  content: viewTarget.content,
                  imageUrl: viewTarget.imageUrl,
                  explanation: viewTarget.explanation,
                  type: viewTarget.type,
                  status: viewTarget.status,
                  subjectName: viewTarget.subjectName,
                  topicName: viewTarget.topicName,
                  year: viewTarget.year,
                  points: viewTarget.points,
                  correctAnswerText: viewTarget.correctAnswerText,
                  options: viewTarget.options.map((option) => ({
                    label: option.label,
                    content: option.content,
                    imageUrl: option.imageUrl,
                    isCorrect: option.isCorrect,
                  })),
                }}
              />
            ) : (
              <div className="rounded-lg border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
                No question selected.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
