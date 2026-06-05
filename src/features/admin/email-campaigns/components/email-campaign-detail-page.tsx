"use client"

import { useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { ColumnDef, VisibilityState } from "@tanstack/react-table"
import { ArrowLeftIcon, RefreshCwIcon, XCircleIcon } from "lucide-react"
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { getModelEnumBadgeMeta } from "@/lib/model-enums"
import { formatAdminDateTime } from "@/lib/format"

import {
  cancelEmailCampaignAction,
  retryFailedEmailCampaignRecipientsAction,
} from "../actions"
import { emailCampaignRecipientColumnLabels } from "../constants"
import type {
  AdminEmailCampaignDetails,
  AdminEmailCampaignRecipientRow,
} from "../queries"

type EmailCampaignDetailPageProps = {
  campaign: AdminEmailCampaignDetails
  backHref: string
}

const DEFAULT_COLUMN_VISIBILITY: VisibilityState = {
  bullJobId: false,
  lastError: false,
  updatedAt: false,
}

function DetailItem({
  label,
  value,
}: {
  label: string
  value: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <div className="text-sm font-medium text-foreground">{value}</div>
    </div>
  )
}

function getProgress(campaign: AdminEmailCampaignDetails) {
  if (campaign.totalRecipients === 0) {
    return 0
  }

  return Math.round(
    ((campaign.sentCount + campaign.failedCount + campaign.cancelledCount) /
      campaign.totalRecipients) *
      100,
  )
}

function createRecipientColumns(): ColumnDef<AdminEmailCampaignRecipientRow>[] {
  return [
    {
      accessorKey: "name",
      meta: { label: emailCampaignRecipientColumnLabels.name },
      header: ({ column }) => <SortableHeader column={column}>Name</SortableHeader>,
      cell: ({ row }) => (
        <span className="font-medium text-foreground">{row.original.name}</span>
      ),
    },
    {
      accessorKey: "email",
      meta: { label: emailCampaignRecipientColumnLabels.email },
      header: ({ column }) => <SortableHeader column={column}>Email</SortableHeader>,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.email}</span>
      ),
    },
    {
      accessorKey: "status",
      meta: { label: emailCampaignRecipientColumnLabels.status },
      header: ({ column }) => <SortableHeader column={column}>Status</SortableHeader>,
      cell: ({ row }) => {
        const badge = getModelEnumBadgeMeta(
          "emailCampaignRecipientStatus",
          row.original.status,
        )

        return (
          <Badge variant="soft" className={badge.className}>
            {badge.label}
          </Badge>
        )
      },
    },
    {
      accessorKey: "attempts",
      meta: { label: emailCampaignRecipientColumnLabels.attempts },
      header: ({ column }) => <SortableHeader column={column}>Attempts</SortableHeader>,
      cell: ({ row }) => <span className="tabular-nums">{row.original.attempts}</span>,
    },
    {
      accessorKey: "lastError",
      meta: { label: "Last Error" },
      header: ({ column }) => <SortableHeader column={column}>Last Error</SortableHeader>,
      cell: ({ row }) => (
        <span className="block max-w-[24rem] truncate text-sm text-muted-foreground">
          {row.original.lastError ?? "-"}
        </span>
      ),
    },
    {
      accessorKey: "bullJobId",
      meta: { label: "Job ID" },
      header: ({ column }) => <SortableHeader column={column}>Job ID</SortableHeader>,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.bullJobId ?? "-"}</span>
      ),
    },
    {
      accessorKey: "sentAt",
      meta: { label: emailCampaignRecipientColumnLabels.sentAt },
      header: ({ column }) => <SortableHeader column={column}>Sent At</SortableHeader>,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.sentAt ? formatAdminDateTime(row.original.sentAt) : "-"}
        </span>
      ),
    },
    {
      accessorKey: "updatedAt",
      meta: { label: emailCampaignRecipientColumnLabels.updatedAt },
      header: ({ column }) => <SortableHeader column={column}>Updated At</SortableHeader>,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatAdminDateTime(row.original.updatedAt)}
        </span>
      ),
    },
  ]
}

export function EmailCampaignDetailPage({
  campaign,
  backHref,
}: EmailCampaignDetailPageProps) {
  const router = useRouter()
  const [cancelOpen, setCancelOpen] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)
  const statusBadge = getModelEnumBadgeMeta("emailCampaignStatus", campaign.status)
  const progress = getProgress(campaign)
  const recipientColumns = useMemo(() => createRecipientColumns(), [])
  const canCancel = campaign.status === "queued" || campaign.status === "sending"
  const canRetry = campaign.failedCount > 0 && campaign.status !== "cancelled"

  async function handleCancel() {
    setIsCancelling(true)

    try {
      const result = await cancelEmailCampaignAction(campaign.id)

      if (!result.success) {
        toast.error(result.message)
        return
      }

      toast.success(`${result.data.cancelledCount} queued recipients cancelled.`)
      setCancelOpen(false)
      router.refresh()
    } finally {
      setIsCancelling(false)
    }
  }

  async function handleRetry() {
    setIsRetrying(true)

    try {
      const result = await retryFailedEmailCampaignRecipientsAction(campaign.id)

      if (!result.success) {
        toast.error(result.message)
        return
      }

      toast.success(`${result.data.queuedCount} failed recipients queued.`)
      router.refresh()
    } finally {
      setIsRetrying(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Email Campaign #${campaign.id}`}
        subtitle={campaign.subject}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline">
              <Link href={backHref}>
                <ArrowLeftIcon data-icon="inline-start" />
                Back
              </Link>
            </Button>
            {canRetry ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleRetry()}
                disabled={isRetrying}
              >
                <RefreshCwIcon data-icon="inline-start" />
                {isRetrying ? "Retrying..." : "Retry Failed"}
              </Button>
            ) : null}
            {canCancel ? (
              <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive">
                    <XCircleIcon data-icon="inline-start" />
                    Cancel
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel this campaign?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Queued recipients will be marked cancelled. Emails already being
                      processed may finish before the worker sees the cancellation.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel asChild>
                      <Button type="button" variant="outline" disabled={isCancelling}>
                        Close
                      </Button>
                    </AlertDialogCancel>
                    <AlertDialogAction asChild>
                      <Button
                        type="button"
                        variant="destructive-solid"
                        disabled={isCancelling}
                        onClick={(event) => {
                          event.preventDefault()
                          void handleCancel()
                        }}
                      >
                        {isCancelling ? "Cancelling..." : "Cancel Campaign"}
                      </Button>
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
            <CardDescription>Current queue state.</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant="soft" className={statusBadge.className}>
              {statusBadge.label}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recipients</CardTitle>
            <CardDescription>Total campaign targets.</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold tabular-nums">
              {campaign.totalRecipients}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Sent</CardTitle>
            <CardDescription>Successfully delivered jobs.</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold tabular-nums">
              {campaign.sentCount}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Failed</CardTitle>
            <CardDescription>Recipients requiring retry.</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold tabular-nums">
              {campaign.failedCount}
            </span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Progress</CardTitle>
          <CardDescription>Queue completion and campaign timestamps.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <Progress value={progress} />
              <span className="text-sm text-muted-foreground">{progress}% complete</span>
            </div>
            <Separator />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <DetailItem label="Created" value={formatAdminDateTime(campaign.createdAt)} />
              <DetailItem
                label="Started"
                value={campaign.startedAt ? formatAdminDateTime(campaign.startedAt) : "-"}
              />
              <DetailItem
                label="Completed"
                value={campaign.completedAt ? formatAdminDateTime(campaign.completedAt) : "-"}
              />
              <DetailItem
                label="Cancelled"
                value={campaign.cancelledAt ? formatAdminDateTime(campaign.cancelledAt) : "-"}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Message Preview</CardTitle>
          <CardDescription>Sanitized HTML that was stored for delivery.</CardDescription>
        </CardHeader>
        <CardContent>
          <article
            className="prose prose-sm max-w-none rounded-lg border border-border/60 bg-background p-4 text-foreground"
            dangerouslySetInnerHTML={{ __html: campaign.contentHtml }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recipients</CardTitle>
          <CardDescription>Per-recipient queue and delivery status.</CardDescription>
        </CardHeader>
        <CardContent>
          <AdminDataTable
            data={campaign.recipients}
            columns={recipientColumns}
            searchPlaceholder="Search recipients..."
            emptyMessage="No recipients found."
            defaultColumnVisibility={DEFAULT_COLUMN_VISIBILITY}
            defaultPageSize="25"
            getRowId={(recipient) => String(recipient.id)}
          />
        </CardContent>
      </Card>
    </div>
  )
}
