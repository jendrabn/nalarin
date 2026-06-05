"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { SendIcon } from "lucide-react"
import { useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"

import { AdminFormPage } from "@/components/admin-form-page"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getModelEnumBadgeMeta } from "@/lib/model-enums"
import { formatAdminDateTime } from "@/lib/format"

import { createEmailCampaignAction } from "../actions"
import {
  emailCampaignFormSchema,
  type EmailCampaignFormValues,
} from "../schemas"
import type { EmailCampaignSelectableUser } from "../queries"
import { EmailCampaignRichTextEditor } from "./email-campaign-rich-text-editor"

type EmailCampaignFormPageProps = {
  users: EmailCampaignSelectableUser[]
}

const FORM_ID = "email-campaign-form"

function RecipientPicker({
  users,
  selectedIds,
  onChange,
  error,
}: {
  users: EmailCampaignSelectableUser[]
  selectedIds: number[]
  onChange: (value: number[]) => void
  error?: string
}) {
  const [query, setQuery] = useState("")
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])
  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    if (!normalizedQuery) {
      return users
    }

    return users.filter((user) =>
      [
        user.name,
        user.email,
        user.role,
        user.activePackageName,
        user.gender,
        user.phoneNumber,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    )
  }, [query, users])
  const selectableFilteredUsers = filteredUsers.filter((user) => user.status === "active")
  const selectedFilteredCount = selectableFilteredUsers.filter((user) =>
    selectedSet.has(user.id),
  ).length
  const allFilteredSelected =
    selectableFilteredUsers.length > 0 &&
    selectedFilteredCount === selectableFilteredUsers.length

  function setSelected(nextSet: Set<number>) {
    onChange(Array.from(nextSet))
  }

  function toggleUser(user: EmailCampaignSelectableUser, checked: boolean) {
    if (user.status !== "active") {
      return
    }

    const next = new Set(selectedSet)

    if (checked) {
      next.add(user.id)
    } else {
      next.delete(user.id)
    }

    setSelected(next)
  }

  function toggleFiltered(checked: boolean) {
    const next = new Set(selectedSet)

    for (const user of selectableFilteredUsers) {
      if (checked) {
        next.add(user.id)
      } else {
        next.delete(user.id)
      }
    }

    setSelected(next)
  }

  return (
    <Field data-invalid={Boolean(error)}>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full sm:max-w-sm">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search recipients..."
              aria-label="Search recipients"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {selectedIds.length} active user{selectedIds.length === 1 ? "" : "s"} selected.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border/60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center uppercase tracking-[0.16em] text-[0.64rem] text-muted-foreground">
                  <Checkbox
                    checked={
                      allFilteredSelected
                        ? true
                        : selectedFilteredCount > 0
                          ? "indeterminate"
                          : false
                    }
                    onCheckedChange={(checked) => toggleFiltered(checked === true)}
                    disabled={selectableFilteredUsers.length === 0}
                    aria-label="Select filtered recipients"
                  />
                </TableHead>
                <TableHead className="uppercase tracking-[0.16em] text-[0.64rem] text-muted-foreground">
                  Name
                </TableHead>
                <TableHead className="uppercase tracking-[0.16em] text-[0.64rem] text-muted-foreground">
                  Email
                </TableHead>
                <TableHead className="uppercase tracking-[0.16em] text-[0.64rem] text-muted-foreground">
                  Role
                </TableHead>
                <TableHead className="uppercase tracking-[0.16em] text-[0.64rem] text-muted-foreground">
                  Package
                </TableHead>
                <TableHead className="uppercase tracking-[0.16em] text-[0.64rem] text-muted-foreground">
                  Gender
                </TableHead>
                <TableHead className="uppercase tracking-[0.16em] text-[0.64rem] text-muted-foreground">
                  Phone
                </TableHead>
                <TableHead className="uppercase tracking-[0.16em] text-[0.64rem] text-muted-foreground">
                  Created At
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => {
                  const roleBadge = getModelEnumBadgeMeta("userRole", user.role)
                  const genderBadge = user.gender
                    ? getModelEnumBadgeMeta("gender", user.gender)
                    : null

                  return (
                    <TableRow key={user.id}>
                      <TableCell className="w-12 text-center">
                        <Checkbox
                          checked={selectedSet.has(user.id)}
                          onCheckedChange={(checked) =>
                            toggleUser(user, checked === true)
                          }
                          disabled={user.status !== "active"}
                          aria-label={`Select ${user.name}`}
                        />
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-foreground">{user.name}</span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.email}
                      </TableCell>
                      <TableCell>
                        <Badge variant="soft" className={roleBadge.className}>
                          {roleBadge.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.activePackageName ? (
                          <Badge variant="soft">{user.activePackageName}</Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {genderBadge ? (
                          <Badge variant="soft" className={genderBadge.className}>
                            {genderBadge.label}
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.phoneNumber ?? "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatAdminDateTime(user.createdAt)}
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-sm text-muted-foreground">
                    No users found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <FieldError>{error}</FieldError>
    </Field>
  )
}

export function EmailCampaignFormPage({ users }: EmailCampaignFormPageProps) {
  const router = useRouter()
  const [rootError, setRootError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const form = useForm<EmailCampaignFormValues>({
    resolver: zodResolver(emailCampaignFormSchema),
    defaultValues: {
      subject: "",
      contentHtml: "<p></p>",
      recipientIds: [],
    },
  })

  const selectedRecipientIds =
    useWatch({
      control: form.control,
      name: "recipientIds",
    }) ?? []
  const contentHtml =
    useWatch({
      control: form.control,
      name: "contentHtml",
    }) ?? "<p></p>"

  async function handleSubmit(values: EmailCampaignFormValues) {
    setRootError(null)
    setIsSubmitting(true)

    try {
      const result = await createEmailCampaignAction(values)

      if (!result.success) {
        setRootError(result.message)

        if (result.fieldErrors) {
          for (const [field, errors] of Object.entries(result.fieldErrors)) {
            form.setError(field as keyof EmailCampaignFormValues, {
              message: errors?.[0],
            })
          }
        }

        toast.error(result.message)
        return
      }

      toast.success("Email campaign queued.")
      router.push(`/admin/email-campaigns/${result.data.id}`)
      router.refresh()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AdminFormPage
      title="New Email Campaign"
      subtitle="Create a queued email campaign for selected active users."
      backHref="/admin/email-campaigns"
      backLabel="Back to Email Campaigns"
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" asChild disabled={isSubmitting}>
            <Link href="/admin/email-campaigns">Cancel</Link>
          </Button>
          <Button type="submit" form={FORM_ID} disabled={isSubmitting}>
            <SendIcon data-icon="inline-start" />
            {isSubmitting ? "Queueing..." : "Queue Campaign"}
          </Button>
        </div>
      }
    >
      <form id={FORM_ID} onSubmit={form.handleSubmit(handleSubmit)}>
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Message</CardTitle>
              <CardDescription>Subject and rich text content for the campaign.</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                {rootError ? (
                  <p className="text-sm text-destructive" aria-live="polite">
                    {rootError}
                  </p>
                ) : null}

                <Field data-invalid={Boolean(form.formState.errors.subject)}>
                  <FieldContent>
                    <FieldLabel htmlFor={`${FORM_ID}-subject`} className="required">
                      Subject
                    </FieldLabel>
                  </FieldContent>
                  <div className="flex flex-col gap-1.5">
                    <Input
                      id={`${FORM_ID}-subject`}
                      placeholder="Promo Nalarin minggu ini"
                      aria-invalid={Boolean(form.formState.errors.subject)}
                      {...form.register("subject")}
                    />
                    <FieldError>{form.formState.errors.subject?.message}</FieldError>
                  </div>
                </Field>

                <Field data-invalid={Boolean(form.formState.errors.contentHtml)}>
                  <FieldContent>
                    <FieldLabel className="required">Content</FieldLabel>
                  </FieldContent>
                  <EmailCampaignRichTextEditor
                    value={contentHtml}
                    onChange={(value) =>
                      form.setValue("contentHtml", value, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                    disabled={isSubmitting}
                  />
                  <FieldError>{form.formState.errors.contentHtml?.message}</FieldError>
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recipients</CardTitle>
              <CardDescription>Select active users that will receive this email.</CardDescription>
            </CardHeader>
            <CardContent>
              <RecipientPicker
                users={users}
                selectedIds={selectedRecipientIds}
                onChange={(value) =>
                  form.setValue("recipientIds", value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                error={form.formState.errors.recipientIds?.message}
              />
            </CardContent>
          </Card>
        </div>
      </form>
    </AdminFormPage>
  )
}
