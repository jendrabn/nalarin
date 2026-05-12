"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { ColumnDef, VisibilityState } from "@tanstack/react-table"
import {
  ArchiveIcon,
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

function formatModes(practice: PracticeRow) {
  const modes = [
    practice.hasPracticeMode ? "Practice" : null,
    practice.hasQuizMode ? "Quiz" : null,
  ].filter(Boolean)

  return modes.join(" + ") || "-"
}

function createColumns({
  onView,
  onEdit,
  onPublish,
  onArchive,
  onDelete,
}: {
  onView: (practice: PracticeRow) => void
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
      id: "modes",
      accessorFn: (row) => formatModes(row),
      meta: { label: practiceColumnLabels.modes },
      header: ({ column }) => <SortableHeader column={column}>Modes</SortableHeader>,
      cell: ({ row }) => <span>{formatModes(row.original)}</span>,
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
              {row.original.status === "draft" ? (
                <DropdownMenuItem onClick={() => onEdit(row.original)}>
                  <PencilLineIcon />
                  Edit
                </DropdownMenuItem>
              ) : null}
              {row.original.status === "draft" ? (
                <DropdownMenuItem onClick={() => onPublish(row.original)}>
                  <RocketIcon />
                  Publish
                </DropdownMenuItem>
              ) : null}
              {row.original.status === "published" ? (
                <DropdownMenuItem onClick={() => onArchive(row.original)}>
                  <ArchiveIcon />
                  Archive
                </DropdownMenuItem>
              ) : null}
              {row.original.status === "draft" ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => onDelete(row.original)}
                  >
                    <Trash2Icon />
                    Delete
                  </DropdownMenuItem>
                </>
              ) : null}
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
          description:
            "This will publish the draft immediately. After publishing, practice settings and questions can no longer be edited.",
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
            description:
              "This action cannot be undone. Only draft practices without sessions can be deleted.",
            action: "Delete",
            variant: "destructive" as const,
          }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Practices"
        subtitle="Manage objective-only practice and quiz packages for the question bank."
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
