"use client"

import { useEffect, useId } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

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
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { modelEnums } from "@/lib/model-enums"

import type { UserActionResult } from "../actions"
import {
  userRoleStatusFormSchema,
  type UserRoleStatusFormValues,
} from "../schemas"

const roleOptions = modelEnums.userRole.values.map((value) => ({
  value,
  label: modelEnums.userRole.labels[value],
}))

const statusOptions = modelEnums.userStatus.values.map((value) => ({
  value,
  label: modelEnums.userStatus.labels[value],
}))

type UserRoleStatusDialogProps = {
  open: boolean
  title: string
  description: string
  submitLabel: string
  initialValues: UserRoleStatusFormValues
  onOpenChange: (open: boolean) => void
  onSubmit: (
    values: UserRoleStatusFormValues,
  ) => Promise<UserActionResult<{ id: number }>>
  onSuccess: (result: { id: number }) => void | Promise<void>
}

export function UserRoleStatusDialog({
  open,
  title,
  description,
  submitLabel,
  initialValues,
  onOpenChange,
  onSubmit,
  onSuccess,
}: UserRoleStatusDialogProps) {
  const formId = useId()
  const form = useForm<UserRoleStatusFormValues>({
    resolver: zodResolver(userRoleStatusFormSchema),
    defaultValues: initialValues,
  })

  useEffect(() => {
    if (!open) {
      return
    }

    form.reset(initialValues)
  }, [form, initialValues, open])

  const handleSubmit = form.handleSubmit(async (values) => {
    const result = await onSubmit(values)

    if (!result.success) {
      if (result.fieldErrors) {
        (Object.keys(result.fieldErrors) as Array<keyof UserRoleStatusFormValues>).forEach(
          (fieldName) => {
            const message = result.fieldErrors?.[fieldName]?.[0]

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

            <Field data-invalid={Boolean(form.formState.errors.role)}>
              <FieldContent>
                <FieldLabel htmlFor={`${formId}-role`} className="required">
                  Role
                </FieldLabel>
              </FieldContent>
              <div className="flex flex-col gap-1.5">
                <Controller
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        id={`${formId}-role`}
                        aria-invalid={Boolean(form.formState.errors.role)}
                      >
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {roleOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldDescription>
                  Admin can manage all content and access the admin panel. User has
                  standard platform access.
                </FieldDescription>
                <FieldError>{form.formState.errors.role?.message}</FieldError>
              </div>
            </Field>

            <Field data-invalid={Boolean(form.formState.errors.status)}>
              <FieldContent>
                <FieldLabel htmlFor={`${formId}-status`} className="required">
                  Status
                </FieldLabel>
              </FieldContent>
              <div className="flex flex-col gap-1.5">
                <Controller
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        id={`${formId}-status`}
                        aria-invalid={Boolean(form.formState.errors.status)}
                      >
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {statusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldDescription>
                  Active users can sign in normally. Inactive and suspended users are
                  blocked from access.
                </FieldDescription>
                <FieldError>{form.formState.errors.status?.message}</FieldError>
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
            {form.formState.isSubmitting ? "Saving..." : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
