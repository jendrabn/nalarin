"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { AdminDataTable, SortableHeader } from "@/components/admin-data-table"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatAdminDateTime, formatCurrencyIDR } from "@/lib/format"

import { deleteVoucherAction } from "../actions"
import type { AdminVoucherDetails } from "../queries"

type VoucherDetailPageProps = {
  voucher: AdminVoucherDetails
}

export function VoucherDetailPage({ voucher }: VoucherDetailPageProps) {
  const router = useRouter()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={voucher.name}
        subtitle="Review this voucher to verify discount rules and redemption history."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/admin/vouchers">Back</Link>
            </Button>
            <Button
              type="button"
              variant="destructive-solid"
              onClick={async () => {
                const result = await deleteVoucherAction(voucher.id)

                if (result.success) {
                  toast.success("Voucher deleted.")
                  router.replace("/admin/vouchers")
                  return
                }

                toast.error(result.message)
              }}
            >
              <Trash2Icon data-icon="inline-start" />
              Delete
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-4">
        <MetricCard label="Usage" value={`${voucher.usageCount}/1`} />
        <MetricCard label="Plans" value="Paid" />
        <MetricCard label="Discount" value={`${voucher.discountPercent}%`} />
        <MetricCard label="Status" value={voucher.isActive ? "Active" : "Inactive"} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Voucher Configuration</CardTitle>
          <CardDescription>Active period, visibility, and internal notes.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 text-sm md:grid-cols-2">
            <Info label="Starts At" value={formatAdminDateTime(voucher.startsAt)} />
            <Info label="Ends At" value={formatAdminDateTime(voucher.endsAt)} />
            <Info label="Plans" value="All paid plans" />
            <Info label="Visibility" value={voucher.isPublic ? "Public" : "Private"} />
            <Info label="Promo Label" value={voucher.promoLabel ?? "-"} />
            <Info label="Promo Description" value={voucher.promoDescription ?? "-"} />
            <Info label="Internal Notes" value={voucher.internalNotes ?? "-"} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usage History</CardTitle>
          <CardDescription>Users and payments that successfully redeemed this voucher.</CardDescription>
        </CardHeader>
        <CardContent>
          <AdminDataTable
            data={voucher.redemptions}
            searchPlaceholder="Search usage..."
            emptyMessage="No usage yet."
            columns={[
              {
                accessorKey: "userName",
                meta: { label: "User" },
                header: ({ column }) => <SortableHeader column={column}>User</SortableHeader>,
                cell: ({ row }) => (
                  <span className="font-medium text-foreground">{row.original.userName}</span>
                ),
              },
              {
                accessorKey: "userEmail",
                meta: { label: "Email" },
                header: ({ column }) => <SortableHeader column={column}>Email</SortableHeader>,
              },
              {
                accessorKey: "paymentId",
                meta: { label: "Payment" },
                header: ({ column }) => <SortableHeader column={column}>Payment</SortableHeader>,
                cell: ({ row }) => (
                  <Button variant="link" className="h-auto p-0" asChild>
                    <Link href={`/admin/payments/${row.original.paymentId}`}>
                      #{row.original.paymentId}
                    </Link>
                  </Button>
                ),
              },
              {
                accessorKey: "discountAmount",
                meta: { label: "Discount" },
                header: ({ column }) => <SortableHeader column={column}>Discount</SortableHeader>,
                cell: ({ row }) => formatCurrencyIDR(row.original.discountAmount),
              },
              {
                accessorKey: "finalAmount",
                meta: { label: "Paid" },
                header: ({ column }) => <SortableHeader column={column}>Paid</SortableHeader>,
                cell: ({ row }) => formatCurrencyIDR(row.original.finalAmount),
              },
              {
                accessorKey: "redeemedAt",
                meta: { label: "Redeemed At" },
                header: ({ column }) => <SortableHeader column={column}>Redeemed</SortableHeader>,
                cell: ({ row }) => formatAdminDateTime(row.original.redeemedAt),
              },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-secondary/25 p-3">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <div className="mt-2">
        {value === "Active" || value === "Public" ? (
          <Badge variant="soft">{value}</Badge>
        ) : value === "Inactive" || value === "Private" ? (
          <Badge variant="outline">{value}</Badge>
        ) : (
          <p className="break-words">{value}</p>
        )}
      </div>
    </div>
  )
}
