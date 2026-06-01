"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import type { ColumnDef } from "@tanstack/react-table"
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldContent, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getModelEnumBadgeMeta } from "@/lib/model-enums"
import { formatAdminDateTime } from "@/lib/format"

import { deleteVocabularyAction, deleteVocabulariesAction } from "../actions"
import {
  vocabularyColumnLabels,
  vocabularyDifficultyLabels,
  vocabularyDifficultyValues,
  vocabularyLanguageLabels,
  vocabularyLanguageValues,
  vocabularyStatusValues,
  vocabularyTypeLabels,
  vocabularyTypeValues,
} from "../constants"
import type { VocabularyRow } from "../queries"
import { previewVocabularyText } from "../utils/vocabulary"

type VocabulariesPageProps = {
  vocabularies: VocabularyRow[]
}

type FilterValue = "all" | string

type DeleteTarget = VocabularyRow | null

const DEFAULT_COLUMN_VISIBILITY = {
  exampleSentence: false,
  createdAt: false,
  updatedAt: false,
}

function createColumns({
  onView,
  onEdit,
  onDelete,
}: {
  onView: (vocabulary: VocabularyRow) => void
  onEdit: (vocabulary: VocabularyRow) => void
  onDelete: (vocabulary: VocabularyRow) => void
}): ColumnDef<VocabularyRow>[] {
  return [
    {
      accessorKey: "word",
      meta: { label: vocabularyColumnLabels.word },
      header: ({ column }) => <SortableHeader column={column}>Word</SortableHeader>,
      cell: ({ row }) => {
        const vocabulary = row.original

        return (
          <div className="flex min-w-0 flex-col gap-1">
            <span className="font-medium text-foreground">{vocabulary.word}</span>
            <p className="line-clamp-2 max-w-[32rem] whitespace-normal text-sm text-muted-foreground">
              {previewVocabularyText(vocabulary.correctMeaning, 96) ||
                "No meaning provided."}
            </p>
          </div>
        )
      },
    },
    {
      accessorKey: "language",
      meta: { label: vocabularyColumnLabels.language },
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
      meta: { label: vocabularyColumnLabels.difficulty },
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
      accessorKey: "type",
      meta: { label: vocabularyColumnLabels.type },
      header: ({ column }) => <SortableHeader column={column}>Type</SortableHeader>,
      cell: ({ row }) => {
        const badge = getModelEnumBadgeMeta("vocabularyType", row.original.type)

        return (
          <Badge variant="soft" className={badge.className}>
            {badge.label}
          </Badge>
        )
      },
    },
    {
      accessorKey: "wrongOption",
      meta: { label: vocabularyColumnLabels.wrongOption },
      header: ({ column }) => <SortableHeader column={column}>Wrong Option</SortableHeader>,
      cell: ({ row }) => (
        <span className="block max-w-[24rem] truncate text-sm text-muted-foreground">
          {row.original.wrongOption}
        </span>
      ),
    },
    {
      accessorKey: "exampleSentence",
      meta: { label: vocabularyColumnLabels.exampleSentence },
      header: ({ column }) => <SortableHeader column={column}>Example Sentence</SortableHeader>,
      cell: ({ row }) => {
        const value = row.original.exampleSentence?.trim()

        if (!value) {
          return <span className="text-sm text-muted-foreground">-</span>
        }

        return (
          <span className="block max-w-[24rem] truncate text-sm text-muted-foreground">
            {value}
          </span>
        )
      },
    },
    {
      accessorKey: "status",
      meta: { label: vocabularyColumnLabels.status },
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
      meta: { label: vocabularyColumnLabels.createdAt },
      header: ({ column }) => <SortableHeader column={column}>Created At</SortableHeader>,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatAdminDateTime(row.original.createdAt)}
        </span>
      ),
    },
    {
      accessorKey: "updatedAt",
      meta: { label: vocabularyColumnLabels.updatedAt },
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
                aria-label={`Open actions for ${row.original.word}`}
              >
                <EllipsisVerticalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
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

export function VocabulariesPage({ vocabularies }: VocabulariesPageProps) {
  const router = useRouter()
  const [languageFilter, setLanguageFilter] = useState<FilterValue>("all")
  const [difficultyFilter, setDifficultyFilter] = useState<FilterValue>("all")
  const [typeFilter, setTypeFilter] = useState<FilterValue>("all")
  const [statusFilter, setStatusFilter] = useState<FilterValue>("all")
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const filteredVocabularies = useMemo(() => {
    return vocabularies.filter((item) => {
      if (languageFilter !== "all" && item.language !== languageFilter) {
        return false
      }

      if (difficultyFilter !== "all" && item.difficulty !== difficultyFilter) {
        return false
      }

      if (typeFilter !== "all" && item.type !== typeFilter) {
        return false
      }

      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false
      }

      return true
    })
  }, [difficultyFilter, languageFilter, statusFilter, typeFilter, vocabularies])

  const columns = useMemo(
    () =>
      createColumns({
        onView: (vocabulary) => router.push(`/admin/vocabularies/${vocabulary.id}`),
        onEdit: (vocabulary) => router.push(`/admin/vocabularies/${vocabulary.id}/edit`),
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
      const result = await deleteVocabularyAction(deleteTarget.id)

      if (!result.success) {
        toast.error(result.message)
        return
      }

      toast.success("Vocabulary deleted.")
      setDeleteTarget(null)
      router.refresh()
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Vocabulary"
        subtitle="Manage vocabulary cards, correct options, wrong options, and publication status for the game."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline">
              <Link href="/admin/vocabularies/import">
                <FileDownIcon data-icon="inline-start" />
                Import Excel
              </Link>
            </Button>
            <Button asChild>
              <Link href="/admin/vocabularies/create">
                <PlusIcon data-icon="inline-start" />
                Create Vocabulary
              </Link>
            </Button>
          </div>
        }
      />

      <AdminDataTable
        data={filteredVocabularies}
        columns={columns}
        searchPlaceholder="Search vocabularies..."
        emptyMessage="No vocabularies found."
        defaultColumnVisibility={DEFAULT_COLUMN_VISIBILITY}
        defaultPageSize="10"
        enableRowSelection
        getRowId={(vocabulary) => String(vocabulary.id)}
        toolbarActions={
          <Button type="button" variant="outline" onClick={() => setIsFilterOpen(true)}>
            <FilterIcon data-icon="inline-start" />
            Filter
          </Button>
        }
        onDeleteSelected={async (selectedVocabularies) => {
          const result = await deleteVocabulariesAction(
            selectedVocabularies.map((vocabulary) => vocabulary.id),
          )

          if (result.success) {
            toast.success(`${result.data.deletedCount} vocabularies deleted.`)
            router.refresh()
            return true
          }

          toast.error(result.message)
          return false
        }}
      />

      <VocabularyFilterDialog
        open={isFilterOpen}
        onOpenChange={setIsFilterOpen}
        languageFilter={languageFilter}
        setLanguageFilter={setLanguageFilter}
        difficultyFilter={difficultyFilter}
        setDifficultyFilter={setDifficultyFilter}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete vocabulary?</AlertDialogTitle>
            <AlertDialogDescription>
              This vocabulary will be permanently removed from the database.
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

function VocabularyFilterDialog({
  open,
  onOpenChange,
  languageFilter,
  setLanguageFilter,
  difficultyFilter,
  setDifficultyFilter,
  typeFilter,
  setTypeFilter,
  statusFilter,
  setStatusFilter,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  languageFilter: FilterValue
  setLanguageFilter: (value: FilterValue) => void
  difficultyFilter: FilterValue
  setDifficultyFilter: (value: FilterValue) => void
  typeFilter: FilterValue
  setTypeFilter: (value: FilterValue) => void
  statusFilter: FilterValue
  setStatusFilter: (value: FilterValue) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Filter Vocabulary</DialogTitle>
          <DialogDescription>
            Narrow the table using language, difficulty, type, and status.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <Field>
            <FieldContent>
              <FieldLabel>Language</FieldLabel>
            </FieldContent>
            <Select value={languageFilter} onValueChange={setLanguageFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All languages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {vocabularyLanguageValues.map((value) => (
                  <SelectItem key={value} value={value}>
                    {vocabularyLanguageLabels[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldContent>
              <FieldLabel>Difficulty</FieldLabel>
            </FieldContent>
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All difficulties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {vocabularyDifficultyValues.map((value) => (
                  <SelectItem key={value} value={value}>
                    {vocabularyDifficultyLabels[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldContent>
              <FieldLabel>Type</FieldLabel>
            </FieldContent>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {vocabularyTypeValues.map((value) => (
                  <SelectItem key={value} value={value}>
                    {vocabularyTypeLabels[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldContent>
              <FieldLabel>Status</FieldLabel>
            </FieldContent>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {vocabularyStatusValues.map((value) => {
                  const badge = getModelEnumBadgeMeta("contentStatus", value)

                  return (
                    <SelectItem key={value} value={value}>
                      {badge.label}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setLanguageFilter("all")
              setDifficultyFilter("all")
              setTypeFilter("all")
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
