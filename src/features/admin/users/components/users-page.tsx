"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import type { ColumnDef, VisibilityState } from "@tanstack/react-table"
import {
  EllipsisVerticalIcon,
  EyeIcon,
  PencilLineIcon,
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
import { getModelEnumBadgeMeta } from "@/lib/model-enums"
import { formatAdminDateTime } from "@/lib/format"

import { deleteUserAction, deleteUsersAction } from "../actions"
import { userColumnLabels } from "../constants"
import type { AdminUserRow } from "../queries"

type UsersPageProps = {
  users: AdminUserRow[]
  currentUserId: number
}

const DEFAULT_COLUMN_VISIBILITY: VisibilityState = {
  createdAt: false,
  updatedAt: false,
}

function createColumns({
  onView,
  onEdit,
  onDelete,
  currentUserId,
}: {
  onView: (user: AdminUserRow) => void
  onEdit: (user: AdminUserRow) => void
  onDelete: (user: AdminUserRow) => void
  currentUserId: number
}): ColumnDef<AdminUserRow>[] {
  return [
    {
      accessorKey: "name",
      meta: { label: userColumnLabels.name },
      header: ({ column }) => <SortableHeader column={column}>Name</SortableHeader>,
      cell: ({ row }) => (
        <button
          type="button"
          className="text-left font-medium text-foreground hover:underline"
          onClick={() => onView(row.original)}
        >
          {row.original.name}
        </button>
      ),
    },
    {
      accessorKey: "email",
      meta: { label: userColumnLabels.email },
      header: ({ column }) => <SortableHeader column={column}>Email</SortableHeader>,
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.email}</span>,
    },
    {
      accessorKey: "role",
      meta: { label: userColumnLabels.role },
      header: ({ column }) => <SortableHeader column={column}>Role</SortableHeader>,
      cell: ({ row }) => {
        const badge = getModelEnumBadgeMeta("userRole", row.original.role)

        return (
          <Badge variant="soft" className={badge.className}>
            {badge.label}
          </Badge>
        )
      },
    },
    {
      accessorKey: "status",
      meta: { label: userColumnLabels.status },
      header: ({ column }) => <SortableHeader column={column}>Status</SortableHeader>,
      cell: ({ row }) => {
        const badge = getModelEnumBadgeMeta("userStatus", row.original.status)

        return (
          <Badge variant="soft" className={badge.className}>
            {badge.label}
          </Badge>
        )
      },
    },
    {
      accessorKey: "activePackageName",
      meta: { label: userColumnLabels.plan },
      header: ({ column }) => <SortableHeader column={column}>Package</SortableHeader>,
      cell: ({ row }) => {
        if (row.original.activePackageName) {
          return <Badge variant="soft">{row.original.activePackageName}</Badge>
        }

        return <span className="text-sm text-muted-foreground">-</span>
      },
    },
    {
      accessorKey: "gender",
      meta: { label: userColumnLabels.gender },
      header: ({ column }) => <SortableHeader column={column}>Gender</SortableHeader>,
      cell: ({ row }) => {
        if (!row.original.gender) {
          return <span className="text-sm text-muted-foreground">-</span>
        }

        const badge = getModelEnumBadgeMeta("gender", row.original.gender)

        return (
          <Badge variant="soft" className={badge.className}>
            {badge.label}
          </Badge>
        )
      },
    },
    {
      accessorKey: "phoneNumber",
      meta: { label: userColumnLabels.phoneNumber },
      header: ({ column }) => <SortableHeader column={column}>Phone</SortableHeader>,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.phoneNumber ?? "-"}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      meta: { label: userColumnLabels.createdAt },
      header: ({ column }) => <SortableHeader column={column}>Created At</SortableHeader>,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatAdminDateTime(row.original.createdAt)}
        </span>
      ),
    },
    {
      accessorKey: "updatedAt",
      meta: { label: userColumnLabels.updatedAt },
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
      cell: ({ row }) => {
        const isSelf = row.original.id === currentUserId

        return (
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
                <DropdownMenuItem
                  variant="destructive"
                  disabled={isSelf}
                  onClick={() => onDelete(row.original)}
                >
                  <Trash2Icon />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]
}

export function UsersPage({ users, currentUserId }: UsersPageProps) {
  const router = useRouter()
  const [deleteTarget, setDeleteTarget] = useState<AdminUserRow | null>(null)

  const columns = useMemo(
    () =>
      createColumns({
        currentUserId,
        onView: (user) => router.push(`/admin/users/${user.id}`),
        onEdit: (user) => router.push(`/admin/users/${user.id}/edit`),
        onDelete: setDeleteTarget,
      }),
    [currentUserId, router],
  )

  async function handleDelete() {
    if (!deleteTarget) {
      return
    }

    const result = await deleteUserAction(deleteTarget.id)

    if (result.success) {
      toast.success("User deleted.")
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
        title="Users"
        subtitle="Manage user accounts to update roles, statuses, and access."
      />

      <AdminDataTable
        data={users}
        columns={columns}
        searchPlaceholder="Search users..."
        emptyMessage="No users found."
        defaultColumnVisibility={DEFAULT_COLUMN_VISIBILITY}
        defaultPageSize="25"
        enableRowSelection
        getRowId={(user) => String(user.id)}
        getRowCanSelect={(user) => user.id !== currentUserId}
        onDeleteSelected={async (selectedUsers) => {
          const result = await deleteUsersAction(selectedUsers.map((user) => user.id))

          if (result.success) {
            toast.success(`${result.data.deletedCount} users deleted.`)
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
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The user account and related session,
              payment, and activity records will be removed.
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
