"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { EllipsisVerticalIcon, EyeIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

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
import { formatAdminDateTime } from "@/lib/format"

import { deleteVouchersAction } from "../actions"
import type { AdminVoucherRow } from "../queries"

type VouchersPageProps = {
  vouchers: AdminVoucherRow[]
}

export function VouchersPage({ vouchers }: VouchersPageProps) {
  const router = useRouter()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Vouchers"
        subtitle="Manage vouchers to control checkout discounts and redemption rules."
        actions={
          <Button asChild>
            <Link href="/admin/vouchers/create">
              <PlusIcon data-icon="inline-start" />
              Create Voucher
            </Link>
          </Button>
        }
      />

      <AdminDataTable
        data={vouchers}
        searchPlaceholder="Search vouchers..."
        emptyMessage="No vouchers found."
        enableRowSelection
        getRowId={(voucher) => String(voucher.id)}
        onDeleteSelected={async (selectedVouchers) => {
          const result = await deleteVouchersAction(
            selectedVouchers.map((voucher) => voucher.id),
          )

          if (result.success) {
            toast.success(`${result.data.deletedCount} voucher deleted.`)
            router.refresh()
            return true
          }

          toast.error(result.message)
          return false
        }}
        columns={[
          {
            accessorKey: "name",
            meta: { label: "Name" },
            header: ({ column }) => <SortableHeader column={column}>Name</SortableHeader>,
            cell: ({ row }) => (
              <span className="font-medium text-foreground">{row.original.name}</span>
            ),
          },
          {
            accessorKey: "code",
            meta: { label: "Code" },
            header: ({ column }) => <SortableHeader column={column}>Code</SortableHeader>,
            cell: ({ row }) => (
              <span className="font-mono text-xs font-semibold">{row.original.code}</span>
            ),
          },
          {
            accessorKey: "discountPercent",
            meta: { label: "Discount" },
            header: ({ column }) => <SortableHeader column={column}>Discount</SortableHeader>,
            cell: ({ row }) => <Badge variant="soft">{row.original.discountPercent}%</Badge>,
          },
          {
            accessorKey: "usageCount",
            meta: { label: "Usage" },
            header: ({ column }) => <SortableHeader column={column}>Usage</SortableHeader>,
            cell: ({ row }) => (
              <span className="tabular-nums">
                {row.original.usageCount}/1
              </span>
            ),
          },
          {
            accessorKey: "isPublic",
            meta: { label: "Public" },
            header: ({ column }) => <SortableHeader column={column}>Public</SortableHeader>,
            cell: ({ row }) => (
              <Badge variant={row.original.isPublic ? "soft" : "outline"}>
                {row.original.isPublic ? "Public" : "Private"}
              </Badge>
            ),
          },
          {
            accessorKey: "isActive",
            meta: { label: "Status" },
            header: ({ column }) => <SortableHeader column={column}>Status</SortableHeader>,
            cell: ({ row }) => (
              <Badge variant={row.original.isActive ? "soft" : "outline"}>
                {row.original.isActive ? "Active" : "Inactive"}
              </Badge>
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
                      aria-label={`Open actions for voucher ${row.original.code}`}
                    >
                      <EllipsisVerticalIcon />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/vouchers/${row.original.id}`}>
                        <EyeIcon />
                        View
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={async () => {
                        const result = await deleteVouchersAction([row.original.id])

                        if (result.success) {
                          toast.success("Voucher deleted.")
                          router.refresh()
                          return
                        }

                        toast.error(result.message)
                      }}
                    >
                      <Trash2Icon />
                      Delete
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
