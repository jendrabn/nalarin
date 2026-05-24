"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeftIcon, CheckIcon } from "lucide-react"
import { toast } from "sonner"

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
import { Separator } from "@/components/ui/separator"
import { getModelEnumBadgeMeta } from "@/lib/model-enums"
import { formatAdminDateTime, formatCurrencyIDR } from "@/lib/format"

import { approveManualPaymentAction } from "../actions"
import type { AdminPaymentDetails } from "../queries"

type PaymentDetailPageProps = {
  payment: AdminPaymentDetails
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

export function PaymentDetailPage({ payment, backHref }: PaymentDetailPageProps) {
  const router = useRouter()
  const [approveOpen, setApproveOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)

  const statusBadge = getModelEnumBadgeMeta("paymentStatus", payment.status)
  const gatewayBadge = getModelEnumBadgeMeta("paymentGateway", payment.gateway)
  const paymentMethodBadge = payment.paymentMethod
    ? getModelEnumBadgeMeta("paymentMethod", payment.paymentMethod)
    : null
  const sourceBadge = getModelEnumBadgeMeta("transactionSource", payment.transactionSource)
  const planBadge = getModelEnumBadgeMeta("planCode", payment.planCode)
  const userRoleBadge = getModelEnumBadgeMeta("userRole", payment.userRole)
  const userStatusBadge = getModelEnumBadgeMeta("userStatus", payment.userStatus)

  async function handleApprove() {
    setIsPending(true)

    try {
      const result = await approveManualPaymentAction(payment.id)

      if (!result.success) {
        toast.error(result.message)
        return
      }

      toast.success("Manual payment approved.")
      router.refresh()
      setApproveOpen(false)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Payment #${payment.id}`}
        subtitle={`${payment.userName} - ${payment.userEmail}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline">
              <Link href={backHref}>
                <ArrowLeftIcon data-icon="inline-start" />
                Back
              </Link>
            </Button>
            {payment.paymentUrl ? (
              <Button asChild variant="outline">
                <a href={payment.paymentUrl} target="_blank" rel="noreferrer">
                  Open Payment Link
                </a>
              </Button>
            ) : null}
            {payment.gateway === "manual" && payment.status === "pending" ? (
              <AlertDialog open={approveOpen} onOpenChange={setApproveOpen}>
                <AlertDialogTrigger asChild>
                  <Button>
                    <CheckIcon data-icon="inline-start" />
                    Approve
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Approve this payment?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will create an active subscription for the user and mark the
                      payment as paid.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isPending}>Close</AlertDialogCancel>
                    <AlertDialogAction
                      disabled={isPending}
                      onClick={(event) => {
                        event.preventDefault()
                        void handleApprove()
                      }}
                    >
                      {isPending ? "Approving..." : "Approve Payment"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Payment</CardTitle>
            <CardDescription>Transaction record and billing metadata.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap gap-2">
              <Badge variant="soft" className={statusBadge.className}>
                {statusBadge.label}
              </Badge>
              <Badge variant="soft" className={gatewayBadge.className}>
                {gatewayBadge.label}
              </Badge>
              <Badge variant="soft" className={planBadge.className}>
                {planBadge.label}
              </Badge>
              {paymentMethodBadge ? (
                <Badge variant="soft" className={paymentMethodBadge.className}>
                  {paymentMethodBadge.label}
                </Badge>
              ) : null}
              <Badge variant="soft" className={sourceBadge.className}>
                {sourceBadge.label}
              </Badge>
            </div>

            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailItem label="Payment ID" value={`#${payment.id}`} />
              <DetailItem
                label="Subscription"
                value={payment.subscriptionId ? `#${payment.subscriptionId}` : "-"}
              />
              <DetailItem label="Final Amount" value={formatCurrencyIDR(payment.amount)} />
              <DetailItem
                label="Original Amount"
                value={formatCurrencyIDR(payment.originalAmount ?? payment.amount)}
              />
              <DetailItem
                label="Voucher Discount"
                value={formatCurrencyIDR(payment.discountAmount)}
              />
              <DetailItem
                label="Voucher"
                value={
                  payment.voucherId ? (
                    <Button variant="link" className="h-auto p-0" asChild>
                      <Link href={`/admin/vouchers/${payment.voucherId}`}>
                        {payment.voucherCodeSnapshot ?? `#${payment.voucherId}`}
                      </Link>
                    </Button>
                  ) : (
                    "-"
                  )
                }
              />
              <DetailItem label="Order ID" value={payment.gatewayOrderId ?? "-"} />
              <DetailItem
                label="Gateway Transaction ID"
                value={payment.gatewayTransactionId ?? "-"}
              />
              <DetailItem label="Paid At" value={formatAdminDateTime(payment.paidAt)} />
              <DetailItem
                label="Expired At"
                value={formatAdminDateTime(payment.expiredAt)}
              />
              <DetailItem
                label="Payment Method"
                value={paymentMethodBadge ? paymentMethodBadge.label : "-"}
              />
              <DetailItem label="Proof URL" value={payment.proofUrl ?? "-"} />
              <DetailItem label="Notes" value={payment.notes ?? "-"} />
              <DetailItem label="Created At" value={formatAdminDateTime(payment.createdAt)} />
              <DetailItem label="Updated At" value={formatAdminDateTime(payment.updatedAt)} />
            </dl>

            {payment.rawPayload ? (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    Raw Payload
                  </p>
                  <pre className="overflow-x-auto rounded-xl border border-border/60 bg-muted/30 p-4 text-xs text-muted-foreground">
                    {JSON.stringify(payment.rawPayload, null, 2)}
                  </pre>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User</CardTitle>
            <CardDescription>Account that initiated the payment.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailItem label="User ID" value={payment.userId} />
              <DetailItem label="Name" value={payment.userName} />
              <DetailItem label="Email" value={payment.userEmail} />
              <DetailItem
                label="Role"
                value={
                  <Badge variant="soft" className={userRoleBadge.className}>
                    {userRoleBadge.label}
                  </Badge>
                }
              />
              <DetailItem
                label="Status"
                value={
                  <Badge variant="soft" className={userStatusBadge.className}>
                    {userStatusBadge.label}
                  </Badge>
                }
              />
              <DetailItem
                label="Linked Subscription"
                value={payment.linkedSubscription ? `#${payment.linkedSubscription.id}` : "-"}
              />
            </dl>

            {payment.linkedSubscription ? (
              <>
                <Separator />
                <div className="space-y-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    Linked Subscription
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant="soft"
                      className={getModelEnumBadgeMeta(
                        "planCode",
                        payment.linkedSubscription.planCode,
                      ).className}
                    >
                      {getModelEnumBadgeMeta(
                        "planCode",
                        payment.linkedSubscription.planCode,
                      ).label}
                    </Badge>
                    <Badge
                      variant="soft"
                      className={getModelEnumBadgeMeta(
                        "subscriptionStatus",
                        payment.linkedSubscription.status,
                      ).className}
                    >
                      {getModelEnumBadgeMeta(
                        "subscriptionStatus",
                        payment.linkedSubscription.status,
                      ).label}
                    </Badge>
                    <Badge
                      variant="soft"
                      className={getModelEnumBadgeMeta(
                        "subscriptionSource",
                        payment.linkedSubscription.source,
                      ).className}
                    >
                      {getModelEnumBadgeMeta(
                        "subscriptionSource",
                        payment.linkedSubscription.source,
                      ).label}
                    </Badge>
                  </div>
                  <dl className="grid gap-4 sm:grid-cols-2">
                    <DetailItem
                      label="Starts At"
                      value={formatAdminDateTime(payment.linkedSubscription.startsAt)}
                    />
                    <DetailItem
                      label="Ends At"
                      value={formatAdminDateTime(payment.linkedSubscription.endsAt)}
                    />
                    <DetailItem
                      label="Activated By"
                      value={payment.linkedSubscription.activatedByAdminId ?? "-"}
                    />
                    <DetailItem
                      label="Cancelled By"
                      value={payment.linkedSubscription.cancelledByAdminId ?? "-"}
                    />
                    <DetailItem
                      label="Cancelled At"
                      value={formatAdminDateTime(payment.linkedSubscription.cancelledAt)}
                    />
                  </dl>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
