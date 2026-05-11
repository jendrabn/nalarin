"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeftIcon, PencilLineIcon } from "lucide-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTrigger,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Separator } from "@/components/ui/separator"
import { getModelEnumBadgeMeta } from "@/lib/model-enums"
import { formatAdminDateTime, formatCurrencyIDR } from "@/lib/format"

import {
  cancelSubscriptionAction,
  forceDowngradeSubscriptionAction,
} from "../actions"
import type { AdminSubscriptionDetails } from "../queries"

type SubscriberDetailPageProps = {
  subscription: AdminSubscriptionDetails
  backHref: string
}

function DetailItem({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <div className="text-sm font-medium text-foreground">{value}</div>
    </div>
  )
}

export function SubscriberDetailPage({
  subscription,
  backHref,
}: SubscriberDetailPageProps) {
  const router = useRouter()
  const [cancelOpen, setCancelOpen] = useState(false)
  const [downgradeOpen, setDowngradeOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)

  const planBadge = getModelEnumBadgeMeta("planCode", subscription.planCode)
  const statusBadge = getModelEnumBadgeMeta("subscriptionStatus", subscription.status)
  const sourceBadge = getModelEnumBadgeMeta("subscriptionSource", subscription.source)
  const userRoleBadge = getModelEnumBadgeMeta("userRole", subscription.userRole)
  const userStatusBadge = getModelEnumBadgeMeta("userStatus", subscription.userStatus)
  const paymentStatusBadge = subscription.paymentStatus
    ? getModelEnumBadgeMeta("paymentStatus", subscription.paymentStatus)
    : null
  const paymentGatewayBadge = subscription.paymentGateway
    ? getModelEnumBadgeMeta("paymentGateway", subscription.paymentGateway)
    : null
  const paymentMethodBadge = subscription.paymentMethod
    ? getModelEnumBadgeMeta("paymentMethod", subscription.paymentMethod)
    : null

  async function handleCancelSubscription() {
    setIsPending(true)

    try {
      const result = await cancelSubscriptionAction(subscription.id)

      if (!result.success) {
        toast.error(result.message)
        return
      }

      toast.success("Subscription cancelled.")
      router.refresh()
      setCancelOpen(false)
    } finally {
      setIsPending(false)
    }
  }

  async function handleForceDowngrade() {
    setIsPending(true)

    try {
      const result = await forceDowngradeSubscriptionAction(subscription.id)

      if (!result.success) {
        toast.error(result.message)
        return
      }

      toast.success("User downgraded to Free.")
      router.refresh()
      setDowngradeOpen(false)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={subscription.userName}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline">
              <Link href={backHref}>
                <ArrowLeftIcon data-icon="inline-start" />
                Back
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/admin/users/${subscription.userId}/edit`}>
                <PencilLineIcon data-icon="inline-start" />
                Edit User
              </Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>User</CardTitle>
              <CardDescription>Identity and account state for the subscription owner.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <dl className="grid gap-4 sm:grid-cols-2">
                <DetailItem label="User ID" value={subscription.userId} />
                <DetailItem label="Name" value={subscription.userName} />
                <DetailItem label="Email" value={subscription.userEmail} />
                <DetailItem
                  label="Role"
                  value={<Badge variant="soft" className={userRoleBadge.className}>{userRoleBadge.label}</Badge>}
                />
                <DetailItem
                  label="Status"
                  value={<Badge variant="soft" className={userStatusBadge.className}>{userStatusBadge.label}</Badge>}
                />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Subscription</CardTitle>
              <CardDescription>Current subscription record and lifecycle metadata.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap gap-2">
                <Badge variant="soft" className={planBadge.className}>
                  {planBadge.label}
                </Badge>
                <Badge variant="soft" className={statusBadge.className}>
                  {statusBadge.label}
                </Badge>
                <Badge variant="soft" className={sourceBadge.className}>
                  {sourceBadge.label}
                </Badge>
              </div>

              <dl className="grid gap-4 sm:grid-cols-2">
                <DetailItem label="Subscription ID" value={`#${subscription.id}`} />
                <DetailItem
                  label="Starts At"
                  value={formatAdminDateTime(subscription.startsAt)}
                />
                <DetailItem
                  label="Ends At"
                  value={formatAdminDateTime(subscription.endsAt)}
                />
                <DetailItem
                  label="Cancelled At"
                  value={formatAdminDateTime(subscription.cancelledAt)}
                />
                <DetailItem
                  label="Activated By"
                  value={subscription.activatedByAdminName ?? subscription.activatedByAdminId ?? "-"}
                />
                <DetailItem
                  label="Cancelled By"
                  value={subscription.cancelledByAdminName ?? subscription.cancelledByAdminId ?? "-"}
                />
                <DetailItem
                  label="Cancellation Reason"
                  value={subscription.cancellationReason ?? "-"}
                />
                <DetailItem
                  label="Created At"
                  value={formatAdminDateTime(subscription.createdAt)}
                />
                <DetailItem
                  label="Updated At"
                  value={formatAdminDateTime(subscription.updatedAt)}
                />
              </dl>

              {subscription.status === "active" ? (
                <>
                  <Separator />
                  <div className="flex flex-wrap gap-2">
                    <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline">Cancel Subscription</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cancel this subscription?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will immediately revoke the user&apos;s paid access and
                            return the account to Free.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={isPending}>Close</AlertDialogCancel>
                          <AlertDialogAction
                            disabled={isPending}
                            onClick={(event) => {
                              event.preventDefault()
                              void handleCancelSubscription()
                            }}
                          >
                            {isPending ? "Cancelling..." : "Cancel Subscription"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    <AlertDialog open={downgradeOpen} onOpenChange={setDowngradeOpen}>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive">Force Downgrade</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Force downgrade to Free?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This cancels the current active subscription and restores Free
                            access for the user.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={isPending}>Close</AlertDialogCancel>
                          <AlertDialogAction
                            disabled={isPending}
                            onClick={(event) => {
                              event.preventDefault()
                              void handleForceDowngrade()
                            }}
                          >
                            {isPending ? "Updating..." : "Force Downgrade"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
              <CardDescription>Latest payment linked to this subscription.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {subscription.paymentId ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    {paymentStatusBadge ? (
                      <Badge variant="soft" className={paymentStatusBadge.className}>
                        {paymentStatusBadge.label}
                      </Badge>
                    ) : null}
                    {paymentGatewayBadge ? (
                      <Badge variant="soft" className={paymentGatewayBadge.className}>
                        {paymentGatewayBadge.label}
                      </Badge>
                    ) : null}
                    {paymentMethodBadge ? (
                      <Badge variant="soft" className={paymentMethodBadge.className}>
                        {paymentMethodBadge.label}
                      </Badge>
                    ) : null}
                  </div>

                  <dl className="grid gap-4 sm:grid-cols-2">
                    <DetailItem label="Payment ID" value={`#${subscription.paymentId}`} />
                    <DetailItem label="Amount" value={formatCurrencyIDR(subscription.paymentAmount ?? 0)} />
                    <DetailItem
                      label="Gateway Transaction ID"
                      value={subscription.gatewayTransactionId ?? "-"}
                    />
                    <DetailItem
                      label="Payment URL"
                      value={
                        subscription.paymentUrl ? (
                          <a
                            href={subscription.paymentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary underline-offset-4 hover:underline"
                          >
                            Open payment page
                          </a>
                        ) : (
                          "-"
                        )
                      }
                    />
                    <DetailItem
                      label="Paid At"
                      value={formatAdminDateTime(subscription.paidAt)}
                    />
                    <DetailItem
                      label="Expired At"
                      value={formatAdminDateTime(subscription.expiredAt)}
                    />
                    <DetailItem
                      label="Proof URL"
                      value={subscription.proofUrl ?? "-"}
                    />
                    <DetailItem label="Notes" value={subscription.notes ?? "-"} />
                  </dl>

                  {subscription.rawPayload ? (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                          Raw Payload
                        </p>
                        <pre className="overflow-x-auto rounded-xl border border-border/60 bg-muted/30 p-4 text-xs text-muted-foreground">
                          {JSON.stringify(subscription.rawPayload, null, 2)}
                        </pre>
                      </div>
                    </>
                  ) : null}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No payment is linked to this subscription yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
