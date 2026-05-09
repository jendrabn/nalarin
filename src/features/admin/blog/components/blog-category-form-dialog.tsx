"use client"

import { useEffect, useId } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { toast } from "sonner"

import {
  blogCategoryFormSchema,
  type BlogCategoryFormValues,
} from "../schemas/blog-category"
import type { BlogCategoryActionResult } from "../actions/blog-categories"

type BlogCategoryFormDialogProps = {
  open: boolean
  mode: "create" | "edit"
  title: string
  description: string
  submitLabel: string
  initialValues?: BlogCategoryFormValues
  onOpenChange: (open: boolean) => void
  onSubmit: (
    values: BlogCategoryFormValues,
  ) => Promise<BlogCategoryActionResult<unknown>>
  onSuccess: (result: unknown) => void | Promise<void>
}

export function BlogCategoryFormDialog({
  open,
  mode,
  title,
  description,
  submitLabel,
  initialValues,
  onOpenChange,
  onSubmit,
  onSuccess,
}: BlogCategoryFormDialogProps) {
  const formId = useId()
  const form = useForm<BlogCategoryFormValues>({
    resolver: zodResolver(blogCategoryFormSchema),
    defaultValues: {
      name: initialValues?.name ?? "",
      description: initialValues?.description ?? "",
    },
  })

  useEffect(() => {
    if (!open) {
      return
    }

    form.reset({
      name: initialValues?.name ?? "",
      description: initialValues?.description ?? "",
    })
  }, [form, initialValues?.description, initialValues?.name, open])

  const handleSubmit = form.handleSubmit(async (values) => {
    const result = await onSubmit(values)

    if (!result.success) {
      const fieldErrors = result.fieldErrors

      if (fieldErrors) {
        (Object.keys(fieldErrors) as Array<keyof BlogCategoryFormValues>).forEach(
          (fieldName) => {
            const message = fieldErrors[fieldName]?.[0]

            if (message) {
              form.setError(fieldName, {
                type: "server",
                message,
              })
            }
          },
        )
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

    await onSuccess(result.data)
  })

  const rootError = form.formState.errors.root?.message

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
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

            <Field data-invalid={Boolean(form.formState.errors.name)}>
              <FieldContent>
                <FieldLabel htmlFor={`${formId}-name`} className="required">
                  Name
                </FieldLabel>
              </FieldContent>
              <div className="flex flex-col gap-1.5">
                <Input
                  id={`${formId}-name`}
                  placeholder="Study Tips"
                  aria-invalid={Boolean(form.formState.errors.name)}
                  {...form.register("name")}
                />
                <FieldError>{form.formState.errors.name?.message}</FieldError>
              </div>
            </Field>

            <Field data-invalid={Boolean(form.formState.errors.description)}>
              <FieldContent>
                <FieldLabel htmlFor={`${formId}-description`} className="required">
                  Description
                </FieldLabel>
              </FieldContent>
              <div className="flex flex-col gap-1.5">
                <Textarea
                  id={`${formId}-description`}
                  rows={5}
                  placeholder="Short summary of what belongs in this category."
                  aria-invalid={Boolean(form.formState.errors.description)}
                  {...form.register("description")}
                />
                <FieldError>{form.formState.errors.description?.message}</FieldError>
              </div>
            </Field>
          </FieldGroup>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={form.formState.isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" form={formId} disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting
              ? mode === "create"
                ? "Creating..."
                : "Saving..."
              : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
