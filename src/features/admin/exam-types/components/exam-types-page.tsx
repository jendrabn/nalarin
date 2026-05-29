"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import type { ColumnDef, VisibilityState } from "@tanstack/react-table"
import {
  EllipsisVerticalIcon,
  EyeIcon,
  PencilLineIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react"
import { toast } from "sonner"

import { AdminDataTable, SortableHeader } from "@/components/admin-data-table"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { TaxonomyLogo } from "@/components/taxonomy-logo"
import { formatAdminDateTime } from "@/lib/format"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

import { deleteExamTypeAction } from "../actions"
import type { ExamTypeRow } from "../queries"

type ExamTypesPageProps = {
  examTypes: ExamTypeRow[]
}

const DEFAULT_COLUMN_VISIBILITY: VisibilityState = {
  logo: false,
  createdAt: false,
  updatedAt: false,
}

function DescriptionCell({ description }: { description?: string | null }) {
  const value = description?.trim()

  if (!value) {
    return <span className="block w-full truncate text-sm text-muted-foreground">-</span>
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          aria-label={value}
          className="block w-full max-w-[28rem] truncate text-sm text-muted-foreground outline-none"
        >
          {value}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" align="start" className="max-w-sm">
        <p className="whitespace-pre-wrap text-left">{value}</p>
      </TooltipContent>
    </Tooltip>
  )
}

function createColumns({
  onView,
  onEdit,
  onDelete,
}: {
  onView: (examType: ExamTypeRow) => void
  onEdit: (examType: ExamTypeRow) => void
  onDelete: (examType: ExamTypeRow) => void
}): ColumnDef<ExamTypeRow>[] {
  return [
    {
      accessorKey: "name",
      meta: { label: "Name" },
      header: ({ column }) => <SortableHeader column={column}>Name</SortableHeader>,
      cell: ({ row }) => <span className="font-medium text-foreground">{row.original.name}</span>,
    },
    {
      accessorKey: "description",
      meta: { label: "Description" },
      header: ({ column }) => <SortableHeader column={column}>Description</SortableHeader>,
      cell: ({ row }) => <DescriptionCell description={row.original.description} />,
    },
    {
      id: "logo",
      meta: { label: "Logo" },
      header: ({ column }) => <SortableHeader column={column}>Logo</SortableHeader>,
      enableSorting: false,
      enableHiding: true,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <TaxonomyLogo src={row.original.logoUrl} alt={row.original.name} />
        </div>
      ),
    },
    {
      accessorKey: "subjectCount",
      meta: { label: "Subjects" },
      header: ({ column }) => <SortableHeader column={column}>Subjects</SortableHeader>,
      cell: ({ row }) => <span className="tabular-nums">{row.original.subjectCount}</span>,
    },
    {
      accessorKey: "topicCount",
      meta: { label: "Topics" },
      header: ({ column }) => <SortableHeader column={column}>Topics</SortableHeader>,
      cell: ({ row }) => <span className="tabular-nums">{row.original.topicCount}</span>,
    },
    {
      accessorKey: "questionCount",
      meta: { label: "Questions" },
      header: ({ column }) => <SortableHeader column={column}>Questions</SortableHeader>,
      cell: ({ row }) => <span className="tabular-nums">{row.original.questionCount}</span>,
    },
    {
      accessorKey: "createdAt",
      meta: { label: "Created At" },
      header: ({ column }) => <SortableHeader column={column}>Created At</SortableHeader>,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatAdminDateTime(row.original.createdAt)}
        </span>
      ),
    },
    {
      accessorKey: "updatedAt",
      meta: { label: "Updated At" },
      header: ({ column }) => <SortableHeader column={column}>Updated At</SortableHeader>,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatAdminDateTime(row.original.updatedAt)}
        </span>
      ),
    },
    {
      id: "actions",
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
                aria-label={`Open actions for ${row.original.name}`}
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

export function ExamTypesPage({ examTypes }: ExamTypesPageProps) {
  const router = useRouter()
  const [deleteTarget, setDeleteTarget] = useState<ExamTypeRow | null>(null)
  const [deleteConfirmName, setDeleteConfirmName] = useState("")

  const columns = useMemo(
    () =>
      createColumns({
        onView: (examType) => router.push(`/admin/exam-types/${examType.id}`),
        onEdit: (examType) => router.push(`/admin/exam-types/${examType.id}/edit`),
        onDelete: (examType) => {
          setDeleteTarget(examType)
          setDeleteConfirmName("")
        },
      }),
    [router],
  )

  const deleteDisabled =
    !deleteTarget ||
    deleteConfirmName.trim().toLowerCase() !== deleteTarget.name.trim().toLowerCase()

  async function handleDelete() {
    if (!deleteTarget) {
      return
    }

    const result = await deleteExamTypeAction(deleteTarget.id)

    if (!result.success) {
      toast.error(result.message)
      return
    }

    toast.success("Exam type deleted.")
    setDeleteTarget(null)
    setDeleteConfirmName("")
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Exam Types"
        subtitle="Manage exam types, package settings, and public information."
        actions={
          <Button asChild>
            <Link href="/admin/exam-types/create">
              <PlusIcon data-icon="inline-start" />
              Create Exam Type
            </Link>
          </Button>
        }
      />

      <AdminDataTable
        data={examTypes}
        columns={columns}
        searchPlaceholder="Search exam types..."
        emptyMessage="No exam types found."
        defaultColumnVisibility={DEFAULT_COLUMN_VISIBILITY}
      />

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null)
            setDeleteConfirmName("")
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this exam type?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The exam type and its package data will be removed
              only if there are no related records that still reference it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Type <span className="font-medium text-foreground">{deleteTarget?.name ?? ""}</span>{" "}
              to confirm deletion.
            </p>
            <Input
              value={deleteConfirmName}
              onChange={(event) => setDeleteConfirmName(event.target.value)}
              placeholder={deleteTarget?.name ?? "Exam type name"}
              disabled={!deleteTarget}
              aria-label="Confirm exam type name"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                type="button"
                variant="destructive"
                disabled={deleteDisabled}
                onClick={() => void handleDelete()}
              >
                Delete
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
