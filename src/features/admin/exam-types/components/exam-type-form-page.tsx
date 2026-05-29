"use client"

import Link from "next/link"
import { useEffect, useId, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useForm, useWatch, type UseFormRegister } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { AdminFormPage } from "@/components/admin-form-page"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { LogoUploadField } from "@/features/admin/components/logo-upload-field"
import { toDateTimeLocalValue, formatCurrencyIDR } from "@/lib/format"
import { getPackageFinalPrice } from "@/lib/billing"

import { createExamTypeAction, updateExamTypeAction } from "../actions"
import type { ExamTypeRow } from "../queries"
import { examTypeFormSchema, type ExamTypeFormValues } from "../schemas"

type ExamTypeFormPageProps = {
  mode: "create" | "edit"
  examTypeId?: number
  title: string
  subtitle: string
  submitLabel: string
  backHref: string
  backLabel: string
  initialValues?: ExamTypeRow | null
}

function buildDefaultValues(initialValues?: ExamTypeRow | null): ExamTypeFormValues {
  return {
    name: initialValues?.name ?? "",
    description: initialValues?.description ?? "",
    logoUrl: initialValues?.logoUrl ?? "",
    coverUrl: initialValues?.coverUrl ?? "",
    packageIsActive: initialValues?.packageIsActive ?? true,
    packagePrice: initialValues?.packagePrice ?? 100000,
    packageDiscountPercent: initialValues?.packageDiscountPercent ?? 0,
    packageDurationMonths: initialValues?.packageDurationMonths ?? 1,
    practiceQuotaPerMonth: initialValues?.practiceQuotaPerMonth ?? -1,
    quizQuotaPerMonth: initialValues?.quizQuotaPerMonth ?? -1,
    tryoutQuotaPerMonth: initialValues?.tryoutQuotaPerMonth ?? -1,
    aiExplanationQuotaPerMonth: initialValues?.aiExplanationQuotaPerMonth ?? -1,
    premiumPracticesEnabled: initialValues?.premiumPracticesEnabled ?? true,
    premiumTryoutsEnabled: initialValues?.premiumTryoutsEnabled ?? true,
    rankingEnabled: initialValues?.rankingEnabled ?? true,
    countdownTitle: initialValues?.countdownTitle ?? "",
    countdownTargetAt: toDateTimeLocalValue(initialValues?.countdownTargetAt),
    registrationStartAt: toDateTimeLocalValue(initialValues?.registrationStartAt),
    registrationEndAt: toDateTimeLocalValue(initialValues?.registrationEndAt),
    examStartAt: toDateTimeLocalValue(initialValues?.examStartAt),
    examEndAt: toDateTimeLocalValue(initialValues?.examEndAt),
    announcementAt: toDateTimeLocalValue(initialValues?.announcementAt),
    informationContent: initialValues?.informationContent ?? "",
  }
}

export function ExamTypeFormPage({
  mode,
  examTypeId,
  title,
  subtitle,
  submitLabel,
  backHref,
  backLabel,
  initialValues,
}: ExamTypeFormPageProps) {
  const router = useRouter()
  const formId = useId()
  const defaultValues = useMemo(() => buildDefaultValues(initialValues), [initialValues])

  const form = useForm<ExamTypeFormValues>({
    resolver: zodResolver(examTypeFormSchema),
    defaultValues,
  })

  useEffect(() => {
    form.reset(defaultValues)
  }, [defaultValues, form])

  const rootError = form.formState.errors.root?.message
  const isSubmitting = form.formState.isSubmitting
  const logoUrl = useWatch({ control: form.control, name: "logoUrl" })
  const coverUrl = useWatch({ control: form.control, name: "coverUrl" })
  const packageIsActive = useWatch({ control: form.control, name: "packageIsActive" })
  const packagePrice = useWatch({ control: form.control, name: "packagePrice" })
  const packageDiscountPercent = useWatch({
    control: form.control,
    name: "packageDiscountPercent",
  })
  const packageDurationMonths = useWatch({
    control: form.control,
    name: "packageDurationMonths",
  })
  const premiumPracticesEnabled = useWatch({
    control: form.control,
    name: "premiumPracticesEnabled",
  })
  const premiumTryoutsEnabled = useWatch({
    control: form.control,
    name: "premiumTryoutsEnabled",
  })
  const rankingEnabled = useWatch({ control: form.control, name: "rankingEnabled" })
  const pricePreview = getPackageFinalPrice(
    packagePrice || 0,
    packageDiscountPercent || 0,
  )

  const handleSubmit = form.handleSubmit(async (values) => {
    const result =
      mode === "create"
        ? await createExamTypeAction(values)
        : await updateExamTypeAction(examTypeId ?? 0, values)

    if (!result.success) {
      if (result.fieldErrors) {
        (Object.keys(result.fieldErrors) as Array<keyof ExamTypeFormValues>).forEach((fieldName) => {
          const message = result.fieldErrors?.[fieldName]?.[0]

          if (message) {
            form.setError(fieldName, {
              type: "server",
              message,
            })
          }
        })
      }

      if (result.message) {
        form.setError("root", {
          type: "server",
          message: result.message,
        })
        toast.error(result.message)
      }

      return
    }

    toast.success(mode === "create" ? "Exam type created." : "Exam type updated.")

    if (mode === "create") {
      router.replace(`/admin/exam-types/${result.data.id}`)
      return
    }

    router.refresh()
  })

  return (
    <AdminFormPage
      title={title}
      subtitle={subtitle}
      backHref={backHref}
      backLabel={backLabel}
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" asChild>
            <Link href={backHref}>Cancel</Link>
          </Button>
          <Button type="submit" form={formId} disabled={isSubmitting}>
            {isSubmitting ? (mode === "create" ? "Creating..." : "Saving...") : submitLabel}
          </Button>
        </div>
      }
    >
      <form id={formId} onSubmit={handleSubmit}>
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Core identity, description, and brand assets for the exam type.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                {rootError ? (
                  <p className="text-sm text-destructive" aria-live="polite">
                    {rootError}
                  </p>
                ) : null}

                <Field data-invalid={Boolean(form.formState.errors.name)}>
                  <FieldContent>
                    <FieldLabel htmlFor={`${formId}-name`} className="required">
                      Name
                    </FieldLabel>
                  </FieldContent>
                  <div className="flex flex-col gap-1.5">
                    <Input
                      id={`${formId}-name`}
                      placeholder="Computer Based Test"
                      aria-invalid={Boolean(form.formState.errors.name)}
                      {...form.register("name")}
                    />
                    <FieldError>{form.formState.errors.name?.message}</FieldError>
                  </div>
                </Field>

                <Field data-invalid={Boolean(form.formState.errors.description)}>
                  <FieldContent>
                    <FieldLabel htmlFor={`${formId}-description`}>Description</FieldLabel>
                  </FieldContent>
                  <div className="flex flex-col gap-1.5">
                    <Textarea
                      id={`${formId}-description`}
                      rows={4}
                      placeholder="Short description for the exam type."
                      aria-invalid={Boolean(form.formState.errors.description)}
                      {...form.register("description")}
                    />
                    <FieldError>{form.formState.errors.description?.message}</FieldError>
                  </div>
                </Field>

                <div className="grid gap-4 lg:grid-cols-2">
                  <LogoUploadField
                    label="Logo"
                    value={logoUrl}
                    error={form.formState.errors.logoUrl?.message}
                    onChange={(value) =>
                      form.setValue("logoUrl", value, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  />

                  <LogoUploadField
                    label="Cover"
                    value={coverUrl}
                    error={form.formState.errors.coverUrl?.message}
                    onChange={(value) =>
                      form.setValue("coverUrl", value, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  />
                </div>
              </FieldGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Package Settings</CardTitle>
              <CardDescription>
                Pricing, duration, quotas, and premium feature availability.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <div className="grid gap-4 sm:grid-cols-2">
                  <NumberField
                    formId={formId}
                    name="packagePrice"
                    label="Package Price"
                    min={0}
                    error={form.formState.errors.packagePrice?.message}
                    register={form.register}
                  />
                  <NumberField
                    formId={formId}
                    name="packageDiscountPercent"
                    label="Package Discount %"
                    min={0}
                    max={100}
                    error={form.formState.errors.packageDiscountPercent?.message}
                    register={form.register}
                  />
                  <NumberField
                    formId={formId}
                    name="packageDurationMonths"
                    label="Duration Months"
                    min={1}
                    error={form.formState.errors.packageDurationMonths?.message}
                    register={form.register}
                  />
                  <NumberField
                    formId={formId}
                    name="practiceQuotaPerMonth"
                    label="Practice Quota / Month"
                    min={-1}
                    error={form.formState.errors.practiceQuotaPerMonth?.message}
                    register={form.register}
                  />
                  <NumberField
                    formId={formId}
                    name="quizQuotaPerMonth"
                    label="Quiz Quota / Month"
                    min={-1}
                    error={form.formState.errors.quizQuotaPerMonth?.message}
                    register={form.register}
                  />
                  <NumberField
                    formId={formId}
                    name="tryoutQuotaPerMonth"
                    label="Tryout Quota / Month"
                    min={-1}
                    error={form.formState.errors.tryoutQuotaPerMonth?.message}
                    register={form.register}
                  />
                  <NumberField
                    formId={formId}
                    name="aiExplanationQuotaPerMonth"
                    label="AI Explanation Quota / Month"
                    min={-1}
                    error={form.formState.errors.aiExplanationQuotaPerMonth?.message}
                    register={form.register}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <SwitchField
                    id={`${formId}-package-active`}
                    label="Package Active"
                    checked={packageIsActive}
                    onCheckedChange={(checked) =>
                      form.setValue("packageIsActive", checked, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  />
                  <SwitchField
                    id={`${formId}-premium-practices`}
                    label="Premium Practices"
                    checked={premiumPracticesEnabled}
                    onCheckedChange={(checked) =>
                      form.setValue("premiumPracticesEnabled", checked, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  />
                  <SwitchField
                    id={`${formId}-premium-tryouts`}
                    label="Premium Tryouts"
                    checked={premiumTryoutsEnabled}
                    onCheckedChange={(checked) =>
                      form.setValue("premiumTryoutsEnabled", checked, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  />
                  <SwitchField
                    id={`${formId}-ranking`}
                    label="Ranking"
                    checked={rankingEnabled}
                    onCheckedChange={(checked) =>
                      form.setValue("rankingEnabled", checked, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  />
                </div>

                <div className="rounded-xl border bg-secondary/25 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">Price Preview</p>
                      <p className="text-sm text-muted-foreground">
                        Duration {packageDurationMonths.toLocaleString("id-ID")} month(s)
                        {packageDiscountPercent > 0 ? " with discount applied" : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Final Price
                      </p>
                      <p className="text-lg font-semibold text-foreground">
                        {formatCurrencyIDR(pricePreview)}
                      </p>
                    </div>
                  </div>
                </div>
              </FieldGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Schedule & Content</CardTitle>
              <CardDescription>
                Countdown, exam dates, and long-form information content.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field data-invalid={Boolean(form.formState.errors.countdownTitle)}>
                  <FieldContent>
                    <FieldLabel htmlFor={`${formId}-countdown-title`}>
                      Countdown Title
                    </FieldLabel>
                  </FieldContent>
                  <div className="flex flex-col gap-1.5">
                    <Input
                      id={`${formId}-countdown-title`}
                      placeholder="Exam registration ends in"
                      aria-invalid={Boolean(form.formState.errors.countdownTitle)}
                      {...form.register("countdownTitle")}
                    />
                    <FieldError>{form.formState.errors.countdownTitle?.message}</FieldError>
                  </div>
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <DateTimeField
                    formId={formId}
                    name="countdownTargetAt"
                    label="Countdown Target At"
                    error={form.formState.errors.countdownTargetAt?.message}
                    register={form.register}
                  />
                  <DateTimeField
                    formId={formId}
                    name="registrationStartAt"
                    label="Registration Start At"
                    error={form.formState.errors.registrationStartAt?.message}
                    register={form.register}
                  />
                  <DateTimeField
                    formId={formId}
                    name="registrationEndAt"
                    label="Registration End At"
                    error={form.formState.errors.registrationEndAt?.message}
                    register={form.register}
                  />
                  <DateTimeField
                    formId={formId}
                    name="examStartAt"
                    label="Exam Start At"
                    error={form.formState.errors.examStartAt?.message}
                    register={form.register}
                  />
                  <DateTimeField
                    formId={formId}
                    name="examEndAt"
                    label="Exam End At"
                    error={form.formState.errors.examEndAt?.message}
                    register={form.register}
                  />
                  <DateTimeField
                    formId={formId}
                    name="announcementAt"
                    label="Announcement At"
                    error={form.formState.errors.announcementAt?.message}
                    register={form.register}
                  />
                </div>

                <Field data-invalid={Boolean(form.formState.errors.informationContent)}>
                  <FieldContent>
                    <FieldLabel htmlFor={`${formId}-information-content`}>
                      Information Content
                    </FieldLabel>
                  </FieldContent>
                  <div className="flex flex-col gap-1.5">
                    <Textarea
                      id={`${formId}-information-content`}
                      rows={6}
                      placeholder="Paste rich text or HTML content for exam information."
                      aria-invalid={Boolean(form.formState.errors.informationContent)}
                      {...form.register("informationContent")}
                    />
                    <FieldError>{form.formState.errors.informationContent?.message}</FieldError>
                  </div>
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>
        </div>
      </form>
    </AdminFormPage>
  )
}

function NumberField({
  formId,
  name,
  label,
  min,
  max,
  error,
  register,
}: {
  formId: string
  name:
    | "packagePrice"
    | "packageDiscountPercent"
    | "packageDurationMonths"
    | "practiceQuotaPerMonth"
    | "quizQuotaPerMonth"
    | "tryoutQuotaPerMonth"
    | "aiExplanationQuotaPerMonth"
  label: string
  min: number
  max?: number
  error?: string
  register: UseFormRegister<ExamTypeFormValues>
}) {
  return (
    <Field data-invalid={Boolean(error)}>
      <FieldContent>
        <FieldLabel htmlFor={`${formId}-${name}`} className="required">
          {label}
        </FieldLabel>
      </FieldContent>
      <div className="flex flex-col gap-1.5">
        <Input
          id={`${formId}-${name}`}
          type="number"
          min={min}
          max={max}
          aria-invalid={Boolean(error)}
          {...register(name, { valueAsNumber: true })}
        />
        <FieldError>{error}</FieldError>
      </div>
    </Field>
  )
}

function SwitchField({
  id,
  label,
  checked,
  onCheckedChange,
}: {
  id: string
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <Field className="rounded-lg border bg-secondary/30 p-3">
      <div className="flex items-center justify-between gap-4">
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
      </div>
    </Field>
  )
}

function DateTimeField({
  formId,
  name,
  label,
  error,
  register,
}: {
  formId: string
  name:
    | "countdownTargetAt"
    | "registrationStartAt"
    | "registrationEndAt"
    | "examStartAt"
    | "examEndAt"
    | "announcementAt"
  label: string
  error?: string
  register: UseFormRegister<ExamTypeFormValues>
}) {
  return (
    <Field data-invalid={Boolean(error)}>
      <FieldContent>
        <FieldLabel htmlFor={`${formId}-${name}`}>{label}</FieldLabel>
      </FieldContent>
      <div className="flex flex-col gap-1.5">
        <Input
          id={`${formId}-${name}`}
          type="datetime-local"
          aria-invalid={Boolean(error)}
          {...register(name)}
        />
        <FieldError>{error}</FieldError>
      </div>
    </Field>
  )
}
