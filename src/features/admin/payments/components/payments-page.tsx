"use client"

import { useRouter } from "next/navigation"
import { EllipsisVerticalIcon, EyeIcon } from "lucide-react"

import { AdminDataTable, SortableHeader } from "@/components/admin-data-table"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getModelEnumBadgeMeta } from "@/lib/model-enums"
import { formatAdminDateTime, formatCurrencyIDR } from "@/lib/format"

import type { AdminPaymentRow } from "../queries"
import { ManualSubscriptionDialog } from "./manual-subscription-dialog"

type PaymentsPageProps = {
  payments: AdminPaymentRow[]
  users: Array<{
    id: number
    name: string
    email: string
    activePlanCode: "free" | "pro" | "max"
  }>
}

export function PaymentsPage({ payments, users }: PaymentsPageProps) {
  const router = useRouter()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Payments"
        subtitle="Track Midtrans and manual payments, then approve manual transfers when needed."
        actions={<ManualSubscriptionDialog users={users} />}
      />

      <AdminDataTable
        data={payments}
        searchPlaceholder="Search payments..."
        emptyMessage="No payments found."
        defaultColumnVisibility={{
          createdAt: false,
          updatedAt: false,
          gatewayTransactionId: false,
          paymentUrl: false,
          proofUrl: false,
          notes: false,
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
            accessorKey: "amount",
            meta: { label: "Amount" },
            header: ({ column }) => <SortableHeader column={column}>Amount</SortableHeader>,
            cell: ({ row }) => (
              <span className="font-medium tabular-nums">
                {formatCurrencyIDR(row.original.amount)}
              </span>
            ),
          },
          {
            accessorKey: "status",
            meta: { label: "Status" },
            header: ({ column }) => <SortableHeader column={column}>Status</SortableHeader>,
            cell: ({ row }) => {
              const badge = getModelEnumBadgeMeta("paymentStatus", row.original.status)

              return (
                <Badge variant="soft" className={badge.className}>
                  {badge.label}
                </Badge>
              )
            },
          },
          {
            accessorKey: "gateway",
            meta: { label: "Gateway" },
            header: ({ column }) => <SortableHeader column={column}>Gateway</SortableHeader>,
            cell: ({ row }) => {
              const badge = getModelEnumBadgeMeta("paymentGateway", row.original.gateway)

              return (
                <Badge variant="soft" className={badge.className}>
                  {badge.label}
                </Badge>
              )
            },
          },
          {
            accessorKey: "paymentMethod",
            meta: { label: "Method" },
            header: ({ column }) => <SortableHeader column={column}>Method</SortableHeader>,
            cell: ({ row }) =>
              row.original.paymentMethod ? (
                (() => {
                  const badge = getModelEnumBadgeMeta(
                    "paymentMethod",
                    row.original.paymentMethod,
                  )

                  return (
                    <Badge variant="soft" className={badge.className}>
                      {badge.label}
                    </Badge>
                  )
                })()
              ) : (
                "-"
              ),
          },
          {
            accessorKey: "transactionSource",
            meta: { label: "Source" },
            header: ({ column }) => <SortableHeader column={column}>Source</SortableHeader>,
            cell: ({ row }) => {
              const badge = getModelEnumBadgeMeta(
                "transactionSource",
                row.original.transactionSource,
              )

              return (
                <Badge variant="soft" className={badge.className}>
                  {badge.label}
                </Badge>
              )
            },
          },
          {
            accessorKey: "gatewayOrderId",
            meta: { label: "Order ID" },
            header: ({ column }) => <SortableHeader column={column}>Order ID</SortableHeader>,
            cell: ({ row }) => (
              <span className="font-mono text-xs text-muted-foreground">
                {row.original.gatewayOrderId ?? "-"}
              </span>
            ),
          },
          {
            accessorKey: "paidAt",
            meta: { label: "Paid At" },
            header: ({ column }) => <SortableHeader column={column}>Paid At</SortableHeader>,
            cell: ({ row }) => (
              <span className="text-sm text-muted-foreground">
                {formatAdminDateTime(row.original.paidAt)}
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
                      aria-label={`Open actions for payment ${row.original.id}`}
                    >
                      <EllipsisVerticalIcon />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={() => router.push(`/admin/payments/${row.original.id}`)}>
                      <EyeIcon />
                      View
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ),
          },
        ]}
      />
    </div>
  )
}
