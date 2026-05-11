"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { EllipsisVerticalIcon, EyeIcon, RefreshCcwIcon, BanIcon } from "lucide-react"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { AdminDataTable, SortableHeader } from "@/components/admin-data-table"
import { getModelEnumBadgeMeta } from "@/lib/model-enums"
import { formatAdminDateTime } from "@/lib/format"

import {
  cancelSubscriptionAction,
  forceDowngradeSubscriptionAction,
} from "../actions"
import type { AdminSubscriptionRow } from "../queries"

type SubscribersPageProps = {
  subscriptions: AdminSubscriptionRow[]
}

export function SubscribersPage({ subscriptions }: SubscribersPageProps) {
  const router = useRouter()
  const [cancelTargetId, setCancelTargetId] = useState<number | null>(null)
  const [downgradeTargetId, setDowngradeTargetId] = useState<number | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function handleCancel(subscriptionId: number) {
    setIsPending(true)

    try {
      const result = await cancelSubscriptionAction(subscriptionId)

      if (!result.success) {
        toast.error(result.message)
        return
      }

      toast.success("Subscription cancelled.")
      router.refresh()
      setCancelTargetId(null)
    } finally {
      setIsPending(false)
    }
  }

  async function handleForceDowngrade(subscriptionId: number) {
    setIsPending(true)

    try {
      const result = await forceDowngradeSubscriptionAction(subscriptionId)

      if (!result.success) {
        toast.error(result.message)
        return
      }

      toast.success("User downgraded to Free.")
      router.refresh()
      setDowngradeTargetId(null)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Subscribers"
          subtitle="Manage active subscriptions, expired records, and manual grants."
        />

        <AdminDataTable
          data={subscriptions}
          searchPlaceholder="Search subscribers..."
          emptyMessage="No subscriptions found."
          defaultColumnVisibility={{
            createdAt: false,
            updatedAt: false,
            cancellationReason: false,
            activatedByAdminId: false,
            cancelledByAdminId: false,
          }}
          columns={[
          {
            accessorKey: "userName",
            meta: { label: "User" },
            header: ({ column }) => <SortableHeader column={column}>User</SortableHeader>,
            cell: ({ row }) => <span className="font-medium text-foreground">{row.original.userName}</span>,
          },
          {
            accessorKey: "userEmail",
            meta: { label: "Email" },
            header: ({ column }) => <SortableHeader column={column}>Email</SortableHeader>,
            cell: ({ row }) => (
              <span className="text-sm text-muted-foreground">{row.original.userEmail}</span>
            ),
          },
          {
            accessorKey: "planCode",
            meta: { label: "Plan" },
            header: ({ column }) => <SortableHeader column={column}>Plan</SortableHeader>,
            cell: ({ row }) => {
              const badge = getModelEnumBadgeMeta("planCode", row.original.planCode)

              return (
                <Badge variant="soft" className={badge.className}>
                  {badge.label}
                </Badge>
              )
            },
          },
          {
            accessorKey: "status",
            meta: { label: "Status" },
            header: ({ column }) => <SortableHeader column={column}>Status</SortableHeader>,
            cell: ({ row }) => {
              const badge = getModelEnumBadgeMeta("subscriptionStatus", row.original.status)

              return (
                <Badge variant="soft" className={badge.className}>
                  {badge.label}
                </Badge>
              )
            },
          },
          {
            accessorKey: "source",
            meta: { label: "Source" },
            header: ({ column }) => <SortableHeader column={column}>Source</SortableHeader>,
            cell: ({ row }) => {
              const badge = getModelEnumBadgeMeta("subscriptionSource", row.original.source)

              return (
                <Badge variant="soft" className={badge.className}>
                  {badge.label}
                </Badge>
              )
            },
          },
          {
            accessorKey: "startsAt",
            meta: { label: "Starts At" },
            header: ({ column }) => <SortableHeader column={column}>Starts At</SortableHeader>,
            cell: ({ row }) => (
              <span className="text-sm text-muted-foreground">
                {formatAdminDateTime(row.original.startsAt)}
              </span>
            ),
          },
          {
            accessorKey: "endsAt",
            meta: { label: "Ends At" },
            header: ({ column }) => <SortableHeader column={column}>Ends At</SortableHeader>,
            cell: ({ row }) => (
              <span className="text-sm text-muted-foreground">
                {formatAdminDateTime(row.original.endsAt)}
              </span>
            ),
          },
          {
            accessorKey: "cancelledAt",
            meta: { label: "Cancelled At" },
            header: ({ column }) => <SortableHeader column={column}>Cancelled At</SortableHeader>,
            cell: ({ row }) => (
              <span className="text-sm text-muted-foreground">
                {formatAdminDateTime(row.original.cancelledAt)}
              </span>
            ),
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
                      aria-label={`Open actions for subscription ${row.original.id}`}
                    >
                      <EllipsisVerticalIcon />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={() => router.push(`/admin/subscribers/${row.original.id}`)}>
                      <EyeIcon />
                      View
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setCancelTargetId(row.original.id)}
                      disabled={row.original.status !== "active"}
                      className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                    >
                      <BanIcon />
                      Cancel Subscription
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setDowngradeTargetId(row.original.id)}
                      disabled={row.original.status !== "active"}
                      className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                    >
                      <RefreshCcwIcon />
                      Force Downgrade
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ),
          },
          ]}
        />
      </div>

      <AlertDialog open={cancelTargetId !== null} onOpenChange={(open) => !open && setCancelTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately revoke paid access and return the user to Free.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Close</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isPending}
              onClick={(event) => {
                event.preventDefault()
                if (cancelTargetId) {
                  void handleCancel(cancelTargetId)
                }
              }}
            >
              {isPending ? "Cancelling..." : "Cancel Subscription"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={downgradeTargetId !== null}
        onOpenChange={(open) => !open && setDowngradeTargetId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Force downgrade to Free?</AlertDialogTitle>
            <AlertDialogDescription>
              This cancels the current active subscription and restores Free access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Close</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isPending}
              onClick={(event) => {
                event.preventDefault()
                if (downgradeTargetId) {
                  void handleForceDowngrade(downgradeTargetId)
                }
              }}
            >
              {isPending ? "Updating..." : "Force Downgrade"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
