"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { ColumnDef, VisibilityState } from "@tanstack/react-table"
import {
  EllipsisVerticalIcon,
  EyeIcon,
  FileDownIcon,
  FilterIcon,
  PencilLineIcon,
  PlusIcon,
  Trash2Icon,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Field, FieldContent, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { getModelEnumBadgeMeta } from "@/lib/model-enums"
import { formatAdminDateTime } from "@/lib/format"

import {
  deleteGrammarQuestionAction,
  deleteGrammarQuestionsAction,
} from "../actions"
import { grammarQuestionColumnLabels } from "../constants"
import {
  getGrammarQuestionById,
  type GrammarQuestionDetails,
  type GrammarQuestionRow,
} from "../queries"
import { GrammarQuestionPreviewCard } from "./grammar-question-preview-card"
import { previewGrammarQuestionSentence } from "../utils/grammar-question"

type GrammarQuestionsPageProps = {
  questions: GrammarQuestionRow[]
}

type FilterValue = "all" | string

const DEFAULT_COLUMN_VISIBILITY: VisibilityState = {
  answers: false,
  distractors: false,
  createdAt: false,
  updatedAt: false,
}

function createColumns({
  onView,
  onEdit,
  onDelete,
}: {
  onView: (question: GrammarQuestionRow) => void
  onEdit: (question: GrammarQuestionRow) => void
  onDelete: (question: GrammarQuestionRow) => void
}): ColumnDef<GrammarQuestionRow>[] {
  return [
    {
      accessorKey: "sentenceTemplate",
      meta: { label: grammarQuestionColumnLabels.sentenceTemplate },
      header: ({ column }) => <SortableHeader column={column}>Sentence Template</SortableHeader>,
      cell: ({ row }) => (
        <GrammarSentenceCell sentenceTemplate={row.original.sentenceTemplate} />
      ),
    },
    {
      accessorKey: "language",
      meta: { label: grammarQuestionColumnLabels.language },
      header: ({ column }) => <SortableHeader column={column}>Language</SortableHeader>,
      cell: ({ row }) => {
        const badge = getModelEnumBadgeMeta("vocabularyLanguage", row.original.language)

        return (
          <Badge variant="soft" className={badge.className}>
            {badge.label}
          </Badge>
        )
      },
    },
    {
      accessorKey: "difficulty",
      meta: { label: grammarQuestionColumnLabels.difficulty },
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
      accessorKey: "category",
      meta: { label: grammarQuestionColumnLabels.category },
      header: ({ column }) => <SortableHeader column={column}>Category</SortableHeader>,
      cell: ({ row }) => (
        <span className="max-w-[16rem] truncate text-sm text-muted-foreground">
          {row.original.category ?? "-"}
        </span>
      ),
    },
    {
      accessorKey: "blankCount",
      meta: { label: grammarQuestionColumnLabels.blankCount },
      header: ({ column }) => <SortableHeader column={column}>Blanks</SortableHeader>,
      cell: ({ row }) => <span className="tabular-nums">{row.original.blankCount}</span>,
    },
    {
      accessorKey: "distractors",
      meta: { label: grammarQuestionColumnLabels.distractorCount },
      header: ({ column }) => <SortableHeader column={column}>Distractors</SortableHeader>,
      cell: ({ row }) => <span className="tabular-nums">{row.original.distractors.length}</span>,
    },
    {
      accessorKey: "status",
      meta: { label: grammarQuestionColumnLabels.status },
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
      accessorKey: "createdAt",
      meta: { label: grammarQuestionColumnLabels.createdAt },
      header: ({ column }) => <SortableHeader column={column}>Created At</SortableHeader>,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatAdminDateTime(row.original.createdAt)}
        </span>
      ),
    },
    {
      accessorKey: "updatedAt",
      meta: { label: grammarQuestionColumnLabels.updatedAt },
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
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="rounded-full"
                aria-label={`Open actions for question ${row.original.id}`}
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
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDelete(row.original)}
              >
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

function GrammarSentenceCell({ sentenceTemplate }: { sentenceTemplate: string }) {
  const preview = previewGrammarQuestionSentence(sentenceTemplate).trim()

  if (!preview) {
    return <span className="block w-full truncate text-sm text-muted-foreground">-</span>
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          aria-label={sentenceTemplate}
          className="block w-full max-w-[24rem] line-clamp-2 whitespace-normal font-medium leading-6 text-foreground outline-none"
        >
          {preview}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" align="start" className="max-w-sm">
        <p className="whitespace-pre-wrap text-left">{sentenceTemplate}</p>
      </TooltipContent>
    </Tooltip>
  )
}

export function GrammarQuestionsPage({ questions }: GrammarQuestionsPageProps) {
  const router = useRouter()
  const [languageFilter, setLanguageFilter] = useState<FilterValue>("all")
  const [difficultyFilter, setDifficultyFilter] = useState<FilterValue>("all")
  const [categoryFilter, setCategoryFilter] = useState<FilterValue>("all")
  const [statusFilter, setStatusFilter] = useState<FilterValue>("all")
  const [deleteTarget, setDeleteTarget] = useState<GrammarQuestionRow | null>(null)
  const [viewTarget, setViewTarget] = useState<GrammarQuestionDetails | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [viewLoading, setViewLoading] = useState(false)

  const filteredQuestions = useMemo(() => {
    return questions.filter((item) => {
      if (languageFilter !== "all" && item.language !== languageFilter) {
        return false
      }

      if (difficultyFilter !== "all" && item.difficulty !== difficultyFilter) {
        return false
      }

      if (
        categoryFilter !== "all" &&
        (item.category ?? "").trim().toLowerCase() !== categoryFilter.trim().toLowerCase()
      ) {
        return false
      }

      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false
      }

      return true
    })
  }, [categoryFilter, difficultyFilter, languageFilter, questions, statusFilter])

  const columns = useMemo(
    () =>
      createColumns({
        onView: async (question) => {
          setViewTarget(null)
          setViewLoading(true)

          try {
            const detail = await getGrammarQuestionById(question.id)

            if (!detail) {
              toast.error("Grammar question not found.")
              return
            }

            setViewTarget(detail)
          } catch {
            toast.error("Failed to load grammar preview.")
          } finally {
            setViewLoading(false)
          }
        },
        onEdit: (question) => router.push(`/admin/grammar/${question.id}/edit`),
        onDelete: setDeleteTarget,
      }),
    [router],
  )

  async function handleDelete() {
    if (!deleteTarget) {
      return
    }

    setIsDeleting(true)

    try {
      const result = await deleteGrammarQuestionAction(deleteTarget.id)

      if (!result.success) {
        toast.error(result.message)
        return
      }

      toast.success("Grammar question deleted.")
      router.refresh()
      setDeleteTarget(null)
    } finally {
      setIsDeleting(false)
    }
  }

  async function handleDeleteSelected(selectedQuestions: GrammarQuestionRow[]) {
    const ids = selectedQuestions.map((question) => question.id)
    const result = await deleteGrammarQuestionsAction(ids)

    if (!result.success) {
      toast.error(result.message)
      return false
    }

    toast.success(`${result.data.deletedCount} grammar questions deleted.`)
    router.refresh()
    return true
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Grammar"
        subtitle="Manage grammar questions, answers, distractors, and publication status for the game."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline">
              <Link href="/admin/grammar/import">
                <FileDownIcon data-icon="inline-start" />
                Import
              </Link>
            </Button>
            <Button asChild>
              <Link href="/admin/grammar/create">
                <PlusIcon data-icon="inline-start" />
                New Question
              </Link>
            </Button>
          </div>
        }
      />

      <AdminDataTable
        data={filteredQuestions}
        columns={columns}
        searchPlaceholder="Search grammar questions..."
        emptyMessage="No grammar questions found."
        defaultColumnVisibility={DEFAULT_COLUMN_VISIBILITY}
        enableRowSelection
        getRowId={(row) => String(row.id)}
        toolbarActions={
          <Button type="button" variant="outline" onClick={() => setIsFilterOpen(true)}>
            <FilterIcon data-icon="inline-start" />
            Filter
          </Button>
        }
        onDeleteSelected={handleDeleteSelected}
      />

      <GrammarFilterDialog
        open={isFilterOpen}
        onOpenChange={setIsFilterOpen}
        languageFilter={languageFilter}
        setLanguageFilter={setLanguageFilter}
        difficultyFilter={difficultyFilter}
        setDifficultyFilter={setDifficultyFilter}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        questions={questions}
      />

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete grammar question?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The grammar question will be permanently removed.
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
            <DialogTitle>Grammar Preview</DialogTitle>
            <DialogDescription>
              Read-only preview of the selected grammar question, including answers and distractors.
            </DialogDescription>
          </DialogHeader>

          <div className="-mx-4 max-h-[70vh] overflow-y-auto px-4 no-scrollbar">
            {viewLoading ? (
              <div className="rounded-lg border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
                Loading preview...
              </div>
            ) : viewTarget ? (
              <GrammarQuestionPreviewCard question={viewTarget} />
            ) : (
              <div className="rounded-lg border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
                No grammar question selected.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function GrammarFilterDialog({
  open,
  onOpenChange,
  languageFilter,
  setLanguageFilter,
  difficultyFilter,
  setDifficultyFilter,
  categoryFilter,
  setCategoryFilter,
  statusFilter,
  setStatusFilter,
  questions,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  languageFilter: FilterValue
  setLanguageFilter: (value: FilterValue) => void
  difficultyFilter: FilterValue
  setDifficultyFilter: (value: FilterValue) => void
  categoryFilter: FilterValue
  setCategoryFilter: (value: FilterValue) => void
  statusFilter: FilterValue
  setStatusFilter: (value: FilterValue) => void
  questions: GrammarQuestionRow[]
}) {
  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          questions
            .map((question) => question.category?.trim() ?? "")
            .filter((category) => category.length > 0),
        ),
      ).sort((left, right) => left.localeCompare(right)),
    [questions],
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Filter Grammar</DialogTitle>
          <DialogDescription>
            Narrow the table using language, difficulty, category, and status.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <FilterField
            label="Language"
            value={languageFilter}
            onValueChange={setLanguageFilter}
            options={[
              { value: "all", label: "All" },
              ...questions
                .map((question) => question.language)
                .filter((value, index, array) => array.indexOf(value) === index)
                .map((value) => ({
                  value,
                  label: getModelEnumBadgeMeta("vocabularyLanguage", value).label,
                })),
            ]}
          />
          <FilterField
            label="Difficulty"
            value={difficultyFilter}
            onValueChange={setDifficultyFilter}
            options={[
              { value: "all", label: "All" },
              ...questions
                .map((question) => question.difficulty)
                .filter((value, index, array) => array.indexOf(value) === index)
                .map((value) => ({
                  value,
                  label: getModelEnumBadgeMeta("questionDifficulty", value).label,
                })),
            ]}
          />
          <FilterField
            label="Category"
            value={categoryFilter}
            onValueChange={setCategoryFilter}
            options={[
              { value: "all", label: "All" },
              ...categories.map((value) => ({ value, label: value })),
            ]}
          />
          <FilterField
            label="Status"
            value={statusFilter}
            onValueChange={setStatusFilter}
            options={[
              { value: "all", label: "All" },
              ...questions
                .map((question) => question.status)
                .filter((value, index, array) => array.indexOf(value) === index)
                .map((value) => ({
                  value,
                  label: getModelEnumBadgeMeta("contentStatus", value).label,
                })),
            ]}
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setLanguageFilter("all")
              setDifficultyFilter("all")
              setCategoryFilter("all")
              setStatusFilter("all")
            }}
          >
            Reset
          </Button>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function FilterField({
  label,
  value,
  onValueChange,
  options,
}: {
  label: string
  value: string
  onValueChange: (value: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <Field>
      <FieldContent>
        <FieldLabel>{label}</FieldLabel>
      </FieldContent>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )
}
