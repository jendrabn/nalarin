"use client"

import { useEffect, useId, useMemo } from "react"
import { useForm, useWatch } from "react-hook-form"
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
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

import type { TaxonomyActionResult } from "../actions"
import { topicFormSchema, type TopicFormValues } from "../schemas"
import type { ExamTypeLookup, SubjectLookup } from "../queries"

type TopicFormDialogProps = {
  open: boolean
  mode: "create" | "edit"
  title: string
  description: string
  submitLabel: string
  examTypes: ExamTypeLookup[]
  subjects: SubjectLookup[]
  initialValues?: TopicFormValues
  onOpenChange: (open: boolean) => void
  onSubmit: (values: TopicFormValues) => Promise<TaxonomyActionResult<TopicFormValues, { id: number }>>
  onSuccess: () => Promise<void> | void
}

function buildDefaultValues(initialValues?: TopicFormValues): TopicFormValues {
  return {
    subjectId: initialValues?.subjectId ?? "",
    name: initialValues?.name ?? "",
    description: initialValues?.description ?? "",
  }
}

export function TopicFormDialog({
  open,
  mode,
  title,
  description,
  submitLabel,
  examTypes,
  subjects,
  initialValues,
  onOpenChange,
  onSubmit,
  onSuccess,
}: TopicFormDialogProps) {
  const formId = useId()
  const defaultValues = useMemo(() => buildDefaultValues(initialValues), [initialValues])

  const form = useForm<TopicFormValues>({
    resolver: zodResolver(topicFormSchema),
    defaultValues,
  })

  useEffect(() => {
    if (open) {
      form.reset(defaultValues)
    }
  }, [defaultValues, form, open])

  const watchedSubjectId = useWatch({ control: form.control, name: "subjectId" })
  const rootError = form.formState.errors.root?.message
  const isSubmitting = form.formState.isSubmitting

  const handleSubmit = form.handleSubmit(async (values) => {
    const result = await onSubmit(values)

    if (!result.success) {
      if (result.fieldErrors) {
        (Object.keys(result.fieldErrors) as Array<keyof TopicFormValues>).forEach((fieldName) => {
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form id={formId} onSubmit={handleSubmit}>
          <FieldGroup>
            {rootError ? (
              <p className="text-sm text-destructive" aria-live="polite">
                {rootError}
              </p>
            ) : null}

            <Field data-invalid={Boolean(form.formState.errors.subjectId)}>
              <FieldContent>
                <FieldLabel htmlFor={`${formId}-subject`} className="required">
                  Subject
                </FieldLabel>
                <FieldDescription>Pick the subject that owns this topic.</FieldDescription>
              </FieldContent>
              <div className="flex flex-col gap-1.5">
                <Select
                  value={watchedSubjectId || ""}
                  onValueChange={(value) =>
                    form.setValue("subjectId", value, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger id={`${formId}-subject`}>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => {
                      const examType = examTypes.find((item) => item.id === subject.examTypeId)

                      return (
                        <SelectItem key={subject.id} value={String(subject.id)}>
                          {subject.name}
                          {examType ? ` · ${examType.name}` : ""}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                <FieldError>{form.formState.errors.subjectId?.message}</FieldError>
              </div>
            </Field>

            <Field data-invalid={Boolean(form.formState.errors.name)}>
              <FieldContent>
                <FieldLabel htmlFor={`${formId}-name`} className="required">
                  Name
                </FieldLabel>
              </FieldContent>
              <div className="flex flex-col gap-1.5">
                <Input
                  id={`${formId}-name`}
                  placeholder="Polynomial"
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
                  placeholder="Short topic description."
                  aria-invalid={Boolean(form.formState.errors.description)}
                  {...form.register("description")}
                />
                <FieldError>{form.formState.errors.description?.message}</FieldError>
              </div>
            </Field>
          </FieldGroup>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
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
