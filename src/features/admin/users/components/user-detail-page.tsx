"use client"

import type { ReactNode } from "react"
import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeftIcon,
  PencilLineIcon,
} from "lucide-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/page-header"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { getModelEnumBadgeMeta } from "@/lib/model-enums"

import { updateUserRoleStatusAction } from "../actions"
import { UserRoleStatusDialog } from "./user-role-status-dialog"
import type { AdminUserDetails } from "../queries"
import {
  formatAdminDateTime,
  formatCurrencyIDR,
  getUserInitials,
} from "../utils"

type UserDetailPageProps = {
  user: AdminUserDetails
  backHref: string
  detailHref: string
  openEditOnMount?: boolean
}

function DetailItem({
  label,
  value,
}: {
  label: string
  value: ReactNode
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <div className="text-sm font-medium text-foreground">{value}</div>
    </div>
  )
}

export function UserDetailPage({
  user,
  backHref,
  detailHref,
  openEditOnMount = false,
}: UserDetailPageProps) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(openEditOnMount)

  function closeEditDialog() {
    setEditOpen(false)

    if (openEditOnMount) {
      router.replace(detailHref)
    }
  }

  async function handleEditSuccess() {
    toast.success("User updated.")
    router.refresh()
    closeEditDialog()
  }

  const roleBadge = getModelEnumBadgeMeta("userRole", user.role)
  const statusBadge = getModelEnumBadgeMeta("userStatus", user.status)
  const activePackageLabel = user.activePackageName ?? "No active package"
  const genderBadge = user.gender ? getModelEnumBadgeMeta("gender", user.gender) : null
  const paymentBadge = user.latestPayment
    ? getModelEnumBadgeMeta("paymentStatus", user.latestPayment.status)
    : null
  const gatewayBadge = user.latestPayment
    ? getModelEnumBadgeMeta("paymentGateway", user.latestPayment.gateway)
    : null
  const paymentMethodBadge = user.latestPayment?.paymentMethod
    ? getModelEnumBadgeMeta("paymentMethod", user.latestPayment.paymentMethod)
    : null
  const subscriptionStatusBadge = user.activeSubscription
    ? getModelEnumBadgeMeta("subscriptionStatus", user.activeSubscription.status)
    : null
  const subscriptionSourceBadge = user.activeSubscription
    ? getModelEnumBadgeMeta("subscriptionSource", user.activeSubscription.source)
    : null
  const editInitialValues = useMemo(
    () => ({
      role: user.role,
      status: user.status,
    }),
    [user.role, user.status],
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={user.name}
        subtitle="Review this user account to manage profile data and access."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline">
              <Link href={backHref}>
                <ArrowLeftIcon data-icon="inline-start" />
                Back
              </Link>
            </Button>
            <Button type="button" onClick={() => setEditOpen(true)}>
              <PencilLineIcon data-icon="inline-start" />
              Edit
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Account identity and contact details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <dl className="grid gap-4 sm:grid-cols-2">
                <DetailItem label="User ID" value={user.id} />
                <DetailItem
                  label="Avatar"
                  value={
                    <Avatar className="size-10">
                      {user.avatarUrl ? (
                        <AvatarImage src={user.avatarUrl} alt={user.name} />
                      ) : null}
                      <AvatarFallback>{getUserInitials(user.name)}</AvatarFallback>
                    </Avatar>
                  }
                />
                <DetailItem label="Name" value={user.name} />
                <DetailItem label="Email" value={user.email} />
                <DetailItem
                  label="Role"
                  value={
                    <Badge variant="soft" className={roleBadge.className}>
                      {roleBadge.label}
                    </Badge>
                  }
                />
                <DetailItem
                  label="Status"
                  value={
                    <Badge variant="soft" className={statusBadge.className}>
                      {statusBadge.label}
                    </Badge>
                  }
                />
                <DetailItem
                  label="Package"
                  value={
                    user.activePackageName ? (
                      <Badge variant="soft">{activePackageLabel}</Badge>
                    ) : (
                      activePackageLabel
                    )
                  }
                />
                <DetailItem label="Phone" value={user.phoneNumber ?? "-"} />
                <DetailItem
                  label="Gender"
                  value={
                    genderBadge ? (
                      <Badge variant="soft" className={genderBadge.className}>
                        {genderBadge.label}
                      </Badge>
                    ) : (
                      "-"
                    )
                  }
                />
                <DetailItem
                  label="Email Verified"
                  value={user.emailVerifiedAt ? "Verified" : "Not verified"}
                />
                <DetailItem
                  label="Google Account"
                  value={user.googleId ? "Linked" : "Not linked"}
                />
                <DetailItem
                  label="Password Login"
                  value={user.passwordHashSet ? "Enabled" : "Not set"}
                />
                <DetailItem label="Created At" value={formatAdminDateTime(user.createdAt)} />
                <DetailItem label="Updated At" value={formatAdminDateTime(user.updatedAt)} />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
              <CardDescription>Sessions and usage history for this account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <dl className="grid gap-4 sm:grid-cols-2">
                <DetailItem
                  label="Auth Sessions"
                  value={user.sessionStats.totalSessions.toLocaleString("id-ID")}
                />
                <DetailItem
                  label="Active Sessions"
                  value={user.sessionStats.activeSessions.toLocaleString("id-ID")}
                />
                <DetailItem
                  label="Last Active"
                  value={formatAdminDateTime(user.sessionStats.lastActiveAt)}
                />
                <DetailItem
                  label="Practice Sessions"
                  value={user.usageStats.practiceSessions.toLocaleString("id-ID")}
                />
                <DetailItem
                  label="Tryout Sessions"
                  value={user.usageStats.tryoutSessions.toLocaleString("id-ID")}
                />
                <DetailItem
                  label="Monthly Usage Rows"
                  value={user.usageStats.monthlyUsageRows.toLocaleString("id-ID")}
                />
                <DetailItem
                  label="Progress Snapshots"
                  value={user.usageStats.progressSnapshots.toLocaleString("id-ID")}
                />
              </dl>

              <Separator />

              <dl className="grid gap-4 sm:grid-cols-2">
                <DetailItem
                  label="Questions Authored"
                  value={user.contentStats.questions.toLocaleString("id-ID")}
                />
                <DetailItem
                  label="Practices Authored"
                  value={user.contentStats.practices.toLocaleString("id-ID")}
                />
                <DetailItem
                  label="Tryouts Authored"
                  value={user.contentStats.tryouts.toLocaleString("id-ID")}
                />
                <DetailItem
                  label="Blog Posts Authored"
                  value={user.contentStats.blogPosts.toLocaleString("id-ID")}
                />
              </dl>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Subscription</CardTitle>
              <CardDescription>
                The current package is resolved from active subscriptions, not from the
                users table.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap gap-2">
                <Badge variant="soft">{activePackageLabel}</Badge>
                {subscriptionStatusBadge ? (
                  <Badge variant="soft" className={subscriptionStatusBadge.className}>
                    {subscriptionStatusBadge.label}
                  </Badge>
                ) : (
                  <Badge variant="soft">No active subscription</Badge>
                )}
                {subscriptionSourceBadge ? (
                  <Badge variant="soft" className={subscriptionSourceBadge.className}>
                    {subscriptionSourceBadge.label}
                  </Badge>
                ) : null}
              </div>

              <dl className="grid gap-4 sm:grid-cols-2">
                <DetailItem
                  label="Active Subscription"
                  value={user.activeSubscription ? `#${user.activeSubscription.id}` : "None"}
                />
                <DetailItem
                  label="Ends At"
                  value={formatAdminDateTime(user.activeSubscriptionEndsAt)}
                />
                <DetailItem
                  label="Starts At"
                  value={formatAdminDateTime(user.activeSubscription?.startsAt ?? null)}
                />
                <DetailItem
                  label="Source"
                  value={
                    user.activeSubscription ? (
                      <Badge
                        variant="soft"
                        className={subscriptionSourceBadge?.className}
                      >
                        {subscriptionSourceBadge?.label}
                      </Badge>
                    ) : (
                      "No active subscription"
                    )
                  }
                />
              </dl>

              {user.latestSubscription && user.latestSubscription.id !== user.activeSubscription?.id ? (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      Latest subscription
                    </p>
                    <dl className="grid gap-4 sm:grid-cols-2">
                      <DetailItem
                        label="Package"
                        value={
                          user.latestSubscription.examTypeName ??
                          user.latestSubscription.packageName ??
                          "Package"
                        }
                      />
                      <DetailItem
                        label="Status"
                        value={
                          <Badge
                            variant="soft"
                            className={getModelEnumBadgeMeta(
                              "subscriptionStatus",
                              user.latestSubscription.status,
                            ).className}
                          >
                            {
                              getModelEnumBadgeMeta(
                                "subscriptionStatus",
                                user.latestSubscription.status,
                              ).label
                            }
                          </Badge>
                        }
                      />
                      <DetailItem
                        label="Source"
                        value={
                          <Badge
                            variant="soft"
                            className={
                              getModelEnumBadgeMeta(
                                "subscriptionSource",
                                user.latestSubscription.source,
                              ).className
                            }
                          >
                            {
                              getModelEnumBadgeMeta(
                                "subscriptionSource",
                                user.latestSubscription.source,
                              ).label
                            }
                          </Badge>
                        }
                      />
                      <DetailItem
                        label="Ended At"
                        value={formatAdminDateTime(user.latestSubscription.endsAt)}
                      />
                    </dl>
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payments</CardTitle>
              <CardDescription>Latest payment activity for this user.</CardDescription>
            </CardHeader>
            <CardContent>
              {user.latestPayment ? (
                <div className="space-y-6">
                  <div className="flex flex-wrap gap-2">
                    {paymentBadge ? (
                      <Badge variant="soft" className={paymentBadge.className}>
                        {paymentBadge.label}
                      </Badge>
                    ) : null}
                    {gatewayBadge ? (
                      <Badge variant="soft" className={gatewayBadge.className}>
                        {gatewayBadge.label}
                      </Badge>
                    ) : null}
                    {paymentMethodBadge ? (
                      <Badge variant="soft" className={paymentMethodBadge.className}>
                        {paymentMethodBadge.label}
                      </Badge>
                    ) : null}
                  </div>

                  <dl className="grid gap-4 sm:grid-cols-2">
                    <DetailItem
                      label="Amount"
                      value={formatCurrencyIDR(user.latestPayment.amount)}
                    />
                    <DetailItem
                      label="Package"
                      value={
                        user.latestPayment.examTypeName ??
                        user.latestPayment.packageName ??
                        "Package"
                      }
                    />
                    <DetailItem
                      label="Transaction Source"
                      value={
                        <Badge
                          variant="soft"
                          className={getModelEnumBadgeMeta(
                            "transactionSource",
                            user.latestPayment.transactionSource,
                          ).className}
                        >
                          {
                            getModelEnumBadgeMeta(
                              "transactionSource",
                              user.latestPayment.transactionSource,
                            ).label
                          }
                        </Badge>
                      }
                    />
                    <DetailItem
                      label="Paid At"
                      value={formatAdminDateTime(user.latestPayment.paidAt)}
                    />
                    <DetailItem
                      label="Expired At"
                      value={formatAdminDateTime(user.latestPayment.expiredAt)}
                    />
                    <DetailItem
                      label="Payment URL"
                      value={
                        user.latestPayment.paymentUrl ? (
                          <a
                            href={user.latestPayment.paymentUrl}
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
                      label="Created At"
                      value={formatAdminDateTime(user.latestPayment.createdAt)}
                    />
                    <DetailItem
                      label="Updated At"
                      value={formatAdminDateTime(user.latestPayment.updatedAt)}
                    />
                  </dl>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No payment records found.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <UserRoleStatusDialog
        open={editOpen}
        title={`Edit ${user.name}`}
        description="Update the account role and status only."
        submitLabel="Save changes"
        initialValues={editInitialValues}
        onOpenChange={(open) => {
          if (open) {
            setEditOpen(true)
            return
          }

          closeEditDialog()
        }}
        onSubmit={(values) => updateUserRoleStatusAction(user.id, values)}
        onSuccess={handleEditSuccess}
      />
    </div>
  )
}
