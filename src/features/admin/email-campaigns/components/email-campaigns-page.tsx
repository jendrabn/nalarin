"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import type { ColumnDef, VisibilityState } from "@tanstack/react-table"
import { EyeIcon, PlusIcon } from "lucide-react"

import { AdminDataTable, SortableHeader } from "@/components/admin-data-table"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { getModelEnumBadgeMeta } from "@/lib/model-enums"
import { formatAdminDateTime } from "@/lib/format"

import { emailCampaignColumnLabels } from "../constants"
import type { AdminEmailCampaignRow } from "../queries"

type EmailCampaignsPageProps = {
  campaigns: AdminEmailCampaignRow[]
}

const DEFAULT_COLUMN_VISIBILITY: VisibilityState = {
  updatedAt: false,
}

function TableColumnHeader({ children }: { children: string }) {
  return (
    <span className="-ml-2 inline-flex h-8 items-center px-2 text-[0.8rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
      {children}
    </span>
  )
}

function getProgress(campaign: AdminEmailCampaignRow) {
  if (campaign.totalRecipients === 0) {
    return 0
  }

  return Math.round(
    ((campaign.sentCount + campaign.failedCount + campaign.cancelledCount) /
      campaign.totalRecipients) *
      100,
  )
}

function createColumns({
  onView,
}: {
  onView: (campaign: AdminEmailCampaignRow) => void
}): ColumnDef<AdminEmailCampaignRow>[] {
  return [
    {
      accessorKey: "subject",
      meta: { label: emailCampaignColumnLabels.subject },
      header: ({ column }) => <SortableHeader column={column}>Subject</SortableHeader>,
      cell: ({ row }) => (
        <button
          type="button"
          className="max-w-[28rem] truncate text-left font-medium text-foreground hover:underline"
          onClick={() => onView(row.original)}
        >
          {row.original.subject}
        </button>
      ),
    },
    {
      accessorKey: "status",
      meta: { label: emailCampaignColumnLabels.status },
      header: ({ column }) => <SortableHeader column={column}>Status</SortableHeader>,
      cell: ({ row }) => {
        const badge = getModelEnumBadgeMeta("emailCampaignStatus", row.original.status)

        return (
          <Badge variant="soft" className={badge.className}>
            {badge.label}
          </Badge>
        )
      },
    },
    {
      id: "progress",
      meta: { label: "Progress" },
      header: () => <TableColumnHeader>Progress</TableColumnHeader>,
      cell: ({ row }) => {
        const progress = getProgress(row.original)

        return (
          <div className="flex min-w-44 flex-col gap-1.5">
            <Progress value={progress} />
            <span className="text-xs text-muted-foreground">
              {progress}% of {row.original.totalRecipients}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: "sentCount",
      meta: { label: emailCampaignColumnLabels.sentCount },
      header: ({ column }) => <SortableHeader column={column}>Sent</SortableHeader>,
      cell: ({ row }) => <span className="tabular-nums">{row.original.sentCount}</span>,
    },
    {
      accessorKey: "failedCount",
      meta: { label: emailCampaignColumnLabels.failedCount },
      header: ({ column }) => <SortableHeader column={column}>Failed</SortableHeader>,
      cell: ({ row }) => <span className="tabular-nums">{row.original.failedCount}</span>,
    },
    {
      accessorKey: "createdAt",
      meta: { label: emailCampaignColumnLabels.createdAt },
      header: ({ column }) => <SortableHeader column={column}>Created At</SortableHeader>,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatAdminDateTime(row.original.createdAt)}
        </span>
      ),
    },
    {
      accessorKey: "updatedAt",
      meta: { label: emailCampaignColumnLabels.updatedAt },
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
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="rounded-full"
            aria-label={`Open ${row.original.subject}`}
            onClick={() => onView(row.original)}
          >
            <EyeIcon />
          </Button>
        </div>
      ),
    },
  ]
}

export function EmailCampaignsPage({ campaigns }: EmailCampaignsPageProps) {
  const router = useRouter()
  const columns = createColumns({
    onView: (campaign) => router.push(`/admin/email-campaigns/${campaign.id}`),
  })

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Email Campaigns"
        subtitle="Compose and monitor queued email campaigns for selected users."
        actions={
          <Button asChild>
            <Link href="/admin/email-campaigns/create">
              <PlusIcon data-icon="inline-start" />
              New Campaign
            </Link>
          </Button>
        }
      />

      <AdminDataTable
        data={campaigns}
        columns={columns}
        searchPlaceholder="Search campaigns..."
        emptyMessage="No email campaigns found."
        defaultColumnVisibility={DEFAULT_COLUMN_VISIBILITY}
        defaultPageSize="25"
        getRowId={(campaign) => String(campaign.id)}
      />
    </div>
  )
}
