"use client"

import { useEffect, useId, useMemo } from "react"
import { useForm, useWatch, type UseFormRegister } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { LogoUploadField } from "@/features/admin/components/logo-upload-field"

import {
  examTypeFormSchema,
  type ExamTypeFormValues,
} from "../schemas"
import type { ExamTypeActionResult } from "../actions"

type ExamTypeFormDialogProps = {
  open: boolean
  mode: "create" | "edit"
  title: string
  description: string
  submitLabel: string
  initialValues?: ExamTypeFormValues
  onOpenChange: (open: boolean) => void
  onSubmit: (values: ExamTypeFormValues) => Promise<ExamTypeActionResult<ExamTypeFormValues, { id: number }>>
  onSuccess: () => Promise<void> | void
}

function buildDefaultValues(initialValues?: ExamTypeFormValues): ExamTypeFormValues {
  return {
    name: initialValues?.name ?? "",
    description: initialValues?.description ?? "",
    logoUrl: initialValues?.logoUrl ?? "",
    countdownTitle: initialValues?.countdownTitle ?? "",
    countdownTargetAt: initialValues?.countdownTargetAt ?? "",
    registrationStartAt: initialValues?.registrationStartAt ?? "",
    registrationEndAt: initialValues?.registrationEndAt ?? "",
    examStartAt: initialValues?.examStartAt ?? "",
    examEndAt: initialValues?.examEndAt ?? "",
    announcementAt: initialValues?.announcementAt ?? "",
    informationContent: initialValues?.informationContent ?? "",
  }
}

export function ExamTypeFormDialog({
  open,
  mode,
  title,
  description,
  submitLabel,
  initialValues,
  onOpenChange,
  onSubmit,
  onSuccess,
}: ExamTypeFormDialogProps) {
  const formId = useId()
  const defaultValues = useMemo(() => buildDefaultValues(initialValues), [initialValues])

  const form = useForm<ExamTypeFormValues>({
    resolver: zodResolver(examTypeFormSchema),
    defaultValues,
  })

  useEffect(() => {
    if (open) {
      form.reset(defaultValues)
    }
  }, [defaultValues, form, open])

  const rootError = form.formState.errors.root?.message
  const isSubmitting = form.formState.isSubmitting
  const logoUrl = useWatch({ control: form.control, name: "logoUrl" })

  const handleSubmit = form.handleSubmit(async (values) => {
    const result = await onSubmit(values)

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

    await onSuccess()
    onOpenChange(false)
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl sm:max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="-mx-4 max-h-[50vh] overflow-y-auto px-4 no-scrollbar">
            <FieldGroup>
            <input type="hidden" {...form.register("logoUrl")} />
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

            <Field data-invalid={Boolean(form.formState.errors.countdownTitle)}>
              <FieldContent>
                <FieldLabel htmlFor={`${formId}-countdown-title`}>Countdown Title</FieldLabel>
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
                placeholder="Select countdown target"
                error={form.formState.errors.countdownTargetAt?.message}
                register={form.register}
              />
              <DateTimeField
                formId={formId}
                name="registrationStartAt"
                label="Registration Start At"
                placeholder="Select registration start"
                error={form.formState.errors.registrationStartAt?.message}
                register={form.register}
              />
              <DateTimeField
                formId={formId}
                name="registrationEndAt"
                label="Registration End At"
                placeholder="Select registration end"
                error={form.formState.errors.registrationEndAt?.message}
                register={form.register}
              />
              <DateTimeField
                formId={formId}
                name="examStartAt"
                label="Exam Start At"
                placeholder="Select exam start"
                error={form.formState.errors.examStartAt?.message}
                register={form.register}
              />
              <DateTimeField
                formId={formId}
                name="examEndAt"
                label="Exam End At"
                placeholder="Select exam end"
                error={form.formState.errors.examEndAt?.message}
                register={form.register}
              />
              <DateTimeField
                formId={formId}
                name="announcementAt"
                label="Announcement At"
                placeholder="Select announcement time"
                error={form.formState.errors.announcementAt?.message}
                register={form.register}
              />
            </div>

            <Field data-invalid={Boolean(form.formState.errors.informationContent)}>
              <FieldContent>
                <FieldLabel htmlFor={`${formId}-information-content`}>Information Content</FieldLabel>
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
            </FieldGroup>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (mode === "create" ? "Creating..." : "Saving...") : submitLabel}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DateTimeField({
  formId,
  name,
  label,
  placeholder,
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
  placeholder: string
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
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          {...register(name)}
        />
        <FieldError>{error}</FieldError>
      </div>
    </Field>
  )
}
