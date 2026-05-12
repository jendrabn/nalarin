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
  archiveTryoutAction,
  deleteTryoutAction,
  publishTryoutAction,
} from "../actions"
import { tryoutColumnLabels, type TryoutStatus } from "../constants"
import type { TryoutRow } from "../queries"

type TryoutsPageProps = {
  tryouts: TryoutRow[]
}

type DialogTarget =
  | { type: "publish"; tryout: TryoutRow }
  | { type: "archive"; tryout: TryoutRow }
  | { type: "delete"; tryout: TryoutRow }
  | null

const DEFAULT_COLUMN_VISIBILITY: VisibilityState = {
  startsAt: false,
  endsAt: false,
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

function statusBadge(status: TryoutStatus) {
  const badge = getModelEnumBadgeMeta("contentStatus", status)

  return (
    <Badge variant="soft" className={badge.className}>
      {badge.label}
    </Badge>
  )
}

function createColumns({
  onView,
  onEdit,
  onPublish,
  onArchive,
  onDelete,
}: {
  onView: (tryout: TryoutRow) => void
  onEdit: (tryout: TryoutRow) => void
  onPublish: (tryout: TryoutRow) => void
  onArchive: (tryout: TryoutRow) => void
  onDelete: (tryout: TryoutRow) => void
}): ColumnDef<TryoutRow>[] {
  return [
    {
      accessorKey: "title",
      meta: { label: tryoutColumnLabels.title },
      header: ({ column }) => <SortableHeader column={column}>Title</SortableHeader>,
      cell: ({ row }) => (
        <span className="font-medium text-foreground">{row.original.title}</span>
      ),
    },
    {
      accessorKey: "examTypeName",
      meta: { label: tryoutColumnLabels.examType },
      header: ({ column }) => <SortableHeader column={column}>Exam Type</SortableHeader>,
      cell: ({ row }) => <span>{row.original.examTypeName}</span>,
    },
    {
      accessorKey: "status",
      meta: { label: tryoutColumnLabels.status },
      header: ({ column }) => <SortableHeader column={column}>Status</SortableHeader>,
      cell: ({ row }) => statusBadge(row.original.status),
    },
    {
      accessorKey: "isFree",
      meta: { label: tryoutColumnLabels.access },
      header: ({ column }) => <SortableHeader column={column}>Access</SortableHeader>,
      cell: ({ row }) => (
        <Badge variant={row.original.isFree ? "secondary" : "outline"}>
          {row.original.isFree ? "Free" : "Paid"}
        </Badge>
      ),
    },
    {
      accessorKey: "sectionCount",
      meta: { label: tryoutColumnLabels.sections },
      header: ({ column }) => <SortableHeader column={column}>Sections</SortableHeader>,
      cell: ({ row }) => <span className="tabular-nums">{row.original.sectionCount}</span>,
    },
    {
      accessorKey: "questionCount",
      meta: { label: tryoutColumnLabels.questions },
      header: ({ column }) => <SortableHeader column={column}>Questions</SortableHeader>,
      cell: ({ row }) => <span className="tabular-nums">{row.original.questionCount}</span>,
    },
    {
      accessorKey: "sessionCount",
      meta: { label: tryoutColumnLabels.sessions },
      header: ({ column }) => <SortableHeader column={column}>Sessions</SortableHeader>,
      cell: ({ row }) => <span className="tabular-nums">{row.original.sessionCount}</span>,
    },
    {
      accessorKey: "startsAt",
      meta: { label: tryoutColumnLabels.startsAt },
      header: ({ column }) => <SortableHeader column={column}>Starts At</SortableHeader>,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDateTime(row.original.startsAt)}
        </span>
      ),
    },
    {
      accessorKey: "endsAt",
      meta: { label: tryoutColumnLabels.endsAt },
      header: ({ column }) => <SortableHeader column={column}>Ends At</SortableHeader>,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDateTime(row.original.endsAt)}
        </span>
      ),
    },
    {
      accessorKey: "publishedAt",
      meta: { label: tryoutColumnLabels.publishedAt },
      header: ({ column }) => <SortableHeader column={column}>Published At</SortableHeader>,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDateTime(row.original.publishedAt)}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      meta: { label: tryoutColumnLabels.createdAt },
      header: ({ column }) => <SortableHeader column={column}>Created At</SortableHeader>,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDateTime(row.original.createdAt)}
        </span>
      ),
    },
    {
      accessorKey: "updatedAt",
      meta: { label: tryoutColumnLabels.updatedAt },
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
                  <DropdownMenuItem variant="destructive" onClick={() => onDelete(row.original)}>
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

export function TryoutsPage({ tryouts }: TryoutsPageProps) {
  const router = useRouter()
  const [dialogTarget, setDialogTarget] = useState<DialogTarget>(null)

  const columns = useMemo(
    () =>
      createColumns({
        onView: (tryout) => router.push(`/admin/tryouts/${tryout.id}`),
        onEdit: (tryout) => router.push(`/admin/tryouts/${tryout.id}/edit`),
        onPublish: (tryout) => setDialogTarget({ type: "publish", tryout }),
        onArchive: (tryout) => setDialogTarget({ type: "archive", tryout }),
        onDelete: (tryout) => setDialogTarget({ type: "delete", tryout }),
      }),
    [router],
  )

  async function handleDialogAction() {
    if (!dialogTarget) {
      return
    }

    const result =
      dialogTarget.type === "publish"
        ? await publishTryoutAction(dialogTarget.tryout.id)
        : dialogTarget.type === "archive"
          ? await archiveTryoutAction(dialogTarget.tryout.id)
          : await deleteTryoutAction(dialogTarget.tryout.id)

    if (result.success) {
      toast.success(
        dialogTarget.type === "publish"
          ? "Tryout published."
          : dialogTarget.type === "archive"
            ? "Tryout archived."
            : "Tryout deleted.",
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
          title: "Publish tryout?",
          description:
            "This will publish the draft immediately and set published_at once. After publishing, title, schedule, settings, sections, questions, and points can no longer be edited.",
          action: "Publish",
          variant: "default" as const,
        }
      : dialogTarget?.type === "archive"
        ? {
            title: "Archive tryout?",
            description:
              "Archived tryouts are final. Existing user sessions remain available for review, but the tryout cannot be republished or edited.",
            action: "Archive",
            variant: "destructive" as const,
          }
        : {
            title: "Delete tryout?",
            description:
              "This action cannot be undone. Only draft tryouts without sessions can be deleted.",
            action: "Delete",
            variant: "destructive" as const,
          }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Tryouts"
        subtitle="Manage multi-section tryouts, schedules, access, scoring, and publication state."
        actions={
          <Button asChild>
            <Link href="/admin/tryouts/create">
              <PlusIcon data-icon="inline-start" />
              Create Tryout
            </Link>
          </Button>
        }
      />

      <AdminDataTable
        data={tryouts}
        columns={columns}
        searchPlaceholder="Search tryouts..."
        emptyMessage="No tryouts found."
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
