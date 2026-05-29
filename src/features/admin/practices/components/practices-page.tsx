"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { ColumnDef, VisibilityState } from "@tanstack/react-table"
import {
  ArchiveIcon,
  BarChart3Icon,
  EllipsisVerticalIcon,
  EyeIcon,
  PencilLineIcon,
  PlusIcon,
  RocketIcon,
  Trash2Icon,
} from "lucide-react"
import { toast } from "sonner"

import { AdminDataTable, SortableHeader } from "@/components/admin-data-table"
import { PageHeader } from "@/components/page-header"
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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getModelEnumBadgeMeta } from "@/lib/model-enums"

import {
  archivePracticeAction,
  deletePracticeAction,
  deletePracticesAction,
  publishPracticeAction,
} from "../actions"
import { practiceColumnLabels, type PracticeStatus } from "../constants"
import type { PracticeRow } from "../queries"

type PracticesPageProps = {
  practices: PracticeRow[]
}

type DialogTarget =
  | { type: "publish"; practice: PracticeRow }
  | { type: "archive"; practice: PracticeRow }
  | { type: "delete"; practice: PracticeRow }
  | null

const DEFAULT_COLUMN_VISIBILITY: VisibilityState = {
  topicName: false,
  publishedAt: false,
  createdAt: false,
  updatedAt: false,
}

function formatDateTime(value: Date | null) {
  if (!value) {
    return "-"
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value)
}

function statusBadge(status: PracticeStatus) {
  const badge = getModelEnumBadgeMeta("contentStatus", status)

  return (
    <Badge variant="soft" className={badge.className}>
      {badge.label}
    </Badge>
  )
}

function createColumns({
  onView,
  onResults,
  onEdit,
  onPublish,
  onArchive,
  onDelete,
}: {
  onView: (practice: PracticeRow) => void
  onResults: (practice: PracticeRow) => void
  onEdit: (practice: PracticeRow) => void
  onPublish: (practice: PracticeRow) => void
  onArchive: (practice: PracticeRow) => void
  onDelete: (practice: PracticeRow) => void
}): ColumnDef<PracticeRow>[] {
  return [
    {
      accessorKey: "title",
      meta: { label: practiceColumnLabels.title },
      header: ({ column }) => <SortableHeader column={column}>Title</SortableHeader>,
      cell: ({ row }) => (
        <span className="font-medium text-foreground">{row.original.title}</span>
      ),
    },
    {
      accessorKey: "examTypeName",
      meta: { label: practiceColumnLabels.examType },
      header: ({ column }) => <SortableHeader column={column}>Exam Type</SortableHeader>,
    },
    {
      accessorKey: "subjectName",
      meta: { label: practiceColumnLabels.subject },
      header: ({ column }) => <SortableHeader column={column}>Subject</SortableHeader>,
    },
    {
      accessorKey: "topicName",
      meta: { label: practiceColumnLabels.topic },
      header: ({ column }) => <SortableHeader column={column}>Topic</SortableHeader>,
      cell: ({ row }) => <span>{row.original.topicName ?? "-"}</span>,
    },
    {
      accessorKey: "status",
      meta: { label: practiceColumnLabels.status },
      header: ({ column }) => <SortableHeader column={column}>Status</SortableHeader>,
      cell: ({ row }) => statusBadge(row.original.status),
    },
    {
      accessorKey: "isFree",
      meta: { label: practiceColumnLabels.access },
      header: ({ column }) => <SortableHeader column={column}>Access</SortableHeader>,
      cell: ({ row }) => (
        <Badge variant={row.original.isFree ? "secondary" : "outline"}>
          {row.original.isFree ? "Free" : "Paid"}
        </Badge>
      ),
    },
    {
      accessorKey: "questionCount",
      meta: { label: practiceColumnLabels.questions },
      header: ({ column }) => <SortableHeader column={column}>Questions</SortableHeader>,
      cell: ({ row }) => <span className="tabular-nums">{row.original.questionCount}</span>,
    },
    {
      accessorKey: "sessionCount",
      meta: { label: practiceColumnLabels.sessions },
      header: ({ column }) => <SortableHeader column={column}>Sessions</SortableHeader>,
      cell: ({ row }) => <span className="tabular-nums">{row.original.sessionCount}</span>,
    },
    {
      accessorKey: "publishedAt",
      meta: { label: practiceColumnLabels.publishedAt },
      header: ({ column }) => <SortableHeader column={column}>Published At</SortableHeader>,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDateTime(row.original.publishedAt)}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      meta: { label: practiceColumnLabels.createdAt },
      header: ({ column }) => <SortableHeader column={column}>Created At</SortableHeader>,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDateTime(row.original.createdAt)}
        </span>
      ),
    },
    {
      accessorKey: "updatedAt",
      meta: { label: practiceColumnLabels.updatedAt },
      header: ({ column }) => <SortableHeader column={column}>Updated At</SortableHeader>,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDateTime(row.original.updatedAt)}
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
                aria-label={`Open actions for ${row.original.title}`}
              >
                <EllipsisVerticalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => onView(row.original)}>
              <EyeIcon />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onResults(row.original)}>
              <BarChart3Icon />
              Results & Analytics
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(row.original)}>
              <PencilLineIcon />
              Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onPublish(row.original)}>
                <RocketIcon />
                Publish
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onArchive(row.original)}>
                <ArchiveIcon />
                Archive
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

export function PracticesPage({ practices }: PracticesPageProps) {
  const router = useRouter()
  const [dialogTarget, setDialogTarget] = useState<DialogTarget>(null)

  const columns = useMemo(
    () =>
      createColumns({
        onView: (practice) => router.push(`/admin/practices/${practice.id}`),
        onResults: (practice) => router.push(`/admin/practices/${practice.id}/results`),
        onEdit: (practice) => router.push(`/admin/practices/${practice.id}/edit`),
        onPublish: (practice) => setDialogTarget({ type: "publish", practice }),
        onArchive: (practice) => setDialogTarget({ type: "archive", practice }),
        onDelete: (practice) => setDialogTarget({ type: "delete", practice }),
      }),
    [router],
  )

  async function handleDialogAction() {
    if (!dialogTarget) {
      return
    }

    const result =
      dialogTarget.type === "publish"
        ? await publishPracticeAction(dialogTarget.practice.id)
        : dialogTarget.type === "archive"
          ? await archivePracticeAction(dialogTarget.practice.id)
          : await deletePracticeAction(dialogTarget.practice.id)

    if (result.success) {
      toast.success(
        dialogTarget.type === "publish"
          ? "Practice published."
          : dialogTarget.type === "archive"
            ? "Practice archived."
            : "Practice deleted.",
      )
      setDialogTarget(null)
      router.refresh()
      return
    }

    toast.error(result.message)
    setDialogTarget(null)
  }

  const dialogCopy =
      dialogTarget?.type === "publish"
      ? {
          title: "Publish practice?",
          description: "This will publish the practice using the current data.",
          action: "Publish",
          variant: "default" as const,
        }
      : dialogTarget?.type === "archive"
        ? {
            title: "Archive practice?",
            description:
              "Archived practices are final. Existing sessions remain available for review.",
            action: "Archive",
            variant: "destructive" as const,
          }
        : {
            title: "Delete practice?",
            description: "This action cannot be undone. Practices with sessions cannot be deleted.",
            action: "Delete",
            variant: "destructive" as const,
          }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Practices"
        subtitle="Manage practices to control publication, access, and scoring."
        actions={
          <Button asChild>
            <Link href="/admin/practices/create">
              <PlusIcon data-icon="inline-start" />
              Create Practice
            </Link>
          </Button>
        }
      />

      <AdminDataTable
        data={practices}
        columns={columns}
        searchPlaceholder="Search practices..."
        emptyMessage="No practices found."
        defaultColumnVisibility={DEFAULT_COLUMN_VISIBILITY}
        defaultPageSize="10"
        enableRowSelection
        getRowId={(practice) => String(practice.id)}
        onDeleteSelected={async (selectedPractices) => {
          const result = await deletePracticesAction(
            selectedPractices.map((practice) => practice.id),
          )

          if (result.success) {
            toast.success(`${result.data.deletedCount} practices deleted.`)
            router.refresh()
            return true
          }

          toast.error(result.message)
          return false
        }}
      />

      <AlertDialog
        open={Boolean(dialogTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDialogTarget(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogCopy.title}</AlertDialogTitle>
            <AlertDialogDescription>{dialogCopy.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                type="button"
                variant={dialogCopy.variant === "destructive" ? "destructive-solid" : "default"}
                onClick={() => void handleDialogAction()}
              >
                {dialogCopy.action}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
