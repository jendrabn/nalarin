"use client"

import Link from "next/link"
import { useId, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useForm, useWatch, type UseFormRegister } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { RefreshCcwIcon } from "lucide-react"
import { toast } from "sonner"

import { AdminFormPage } from "@/components/admin-form-page"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

import { createVoucherAction } from "../actions"
import { voucherFormSchema, type VoucherFormValues } from "../schemas"

function buildDefaultValues(): VoucherFormValues {
  const now = new Date()
  const endsAt = new Date(now)
  endsAt.setDate(endsAt.getDate() + 7)

  return {
    name: "",
    code: "",
    startsAt: toDateTimeLocal(now),
    endsAt: toDateTimeLocal(endsAt),
    discountPercent: 30,
    isPublic: false,
    promoLabel: "",
    promoDescription: "",
    isActive: true,
    internalNotes: "",
  }
}

export function VoucherFormPage() {
  const router = useRouter()
  const formId = useId()
  const defaultValues = useMemo(() => buildDefaultValues(), [])
  const form = useForm<VoucherFormValues>({
    resolver: zodResolver(voucherFormSchema),
    defaultValues,
  })
  const watchedIsPublic = useWatch({ control: form.control, name: "isPublic" })
  const watchedIsActive = useWatch({ control: form.control, name: "isActive" })
  const rootError = form.formState.errors.root?.message
  const isSubmitting = form.formState.isSubmitting

  const handleSubmit = form.handleSubmit(async (values) => {
    const result = await createVoucherAction(values)

    if (!result.success) {
      if (result.fieldErrors) {
        ;(Object.keys(result.fieldErrors) as Array<keyof VoucherFormValues>).forEach(
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

      form.setError("root", {
        type: "server",
        message: result.message,
      })
      toast.error(result.message)
      return
    }

    toast.success("Voucher created.")
    router.replace(`/admin/vouchers/${result.data.id}`)
  })

  return (
    <AdminFormPage
      title="Create Voucher"
      subtitle="Create a voucher to define its code, discount, and validity window."
      backHref="/admin/vouchers"
      backLabel="Back to Vouchers"
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/vouchers">Cancel</Link>
          </Button>
          <Button type="submit" form={formId} disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Voucher"}
          </Button>
        </div>
      }
    >
      <form id={formId} onSubmit={handleSubmit}>
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Voucher Details</CardTitle>
              <CardDescription>
                Identity, code, active period, and discount configuration.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                {rootError ? (
                  <p className="text-sm text-destructive" aria-live="polite">
                    {rootError}
                  </p>
                ) : null}

                <div className="grid gap-4 lg:grid-cols-2">
                  <Field data-invalid={Boolean(form.formState.errors.name)}>
                    <FieldContent>
                      <FieldLabel htmlFor={`${formId}-name`} className="required">
                        Voucher Name
                      </FieldLabel>
                    </FieldContent>
                    <div className="flex flex-col gap-1.5">
                      <Input
                        id={`${formId}-name`}
                        placeholder="May UTBK Promo"
                        aria-invalid={Boolean(form.formState.errors.name)}
                        {...form.register("name")}
                      />
                      <FieldError>{form.formState.errors.name?.message}</FieldError>
                    </div>
                  </Field>

                  <Field data-invalid={Boolean(form.formState.errors.code)}>
                    <FieldContent>
                      <FieldLabel htmlFor={`${formId}-code`} className="required">
                        Voucher Code
                      </FieldLabel>
                    </FieldContent>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <div className="flex flex-1 flex-col gap-1.5">
                        <Input
                          id={`${formId}-code`}
                          placeholder="NALARIN-UTBK30"
                          className="uppercase"
                          aria-invalid={Boolean(form.formState.errors.code)}
                          {...form.register("code")}
                        />
                        <FieldError>{form.formState.errors.code?.message}</FieldError>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          form.setValue("code", generateVoucherCode(), {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                      >
                        <RefreshCcwIcon data-icon="inline-start" />
                        Generate
                      </Button>
                    </div>
                  </Field>

                  <DateTimeField
                    formId={formId}
                    name="startsAt"
                    label="Starts At"
                    error={form.formState.errors.startsAt?.message}
                    register={form.register}
                  />
                  <DateTimeField
                    formId={formId}
                    name="endsAt"
                    label="Ends At"
                    error={form.formState.errors.endsAt?.message}
                    register={form.register}
                  />
                  <NumberField
                    formId={formId}
                    name="discountPercent"
                    label="Discount Percentage"
                    suffix="%"
                    error={form.formState.errors.discountPercent?.message}
                    register={form.register}
                  />
                </div>
              </FieldGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rules & Visibility</CardTitle>
              <CardDescription>
                Vouchers are single-use and automatically apply to all paid plans.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <div className="grid gap-4 md:grid-cols-2">
                  <SwitchField
                    label="Show Publicly"
                    description="Display this voucher as a checkout promotion."
                    checked={watchedIsPublic}
                    onCheckedChange={(checked) => form.setValue("isPublic", checked)}
                  />
                  <SwitchField
                    label="Active Status"
                    description="Allow this voucher to be used during its active period."
                    checked={watchedIsActive}
                    onCheckedChange={(checked) => form.setValue("isActive", checked)}
                  />
                </div>

                <Field data-invalid={Boolean(form.formState.errors.promoLabel)}>
                  <FieldContent>
                    <FieldLabel htmlFor={`${formId}-promo-label`}>Promo Label</FieldLabel>
                  </FieldContent>
                  <div className="flex flex-col gap-1.5">
                    <Input
                      id={`${formId}-promo-label`}
                      placeholder="30% off paid plans"
                      aria-invalid={Boolean(form.formState.errors.promoLabel)}
                      {...form.register("promoLabel")}
                    />
                    <FieldError>{form.formState.errors.promoLabel?.message}</FieldError>
                  </div>
                </Field>

                <Field data-invalid={Boolean(form.formState.errors.promoDescription)}>
                  <FieldContent>
                    <FieldLabel htmlFor={`${formId}-promo-description`}>
                      Promo Description
                    </FieldLabel>
                  </FieldContent>
                  <div className="flex flex-col gap-1.5">
                    <Textarea
                      id={`${formId}-promo-description`}
                      rows={3}
                      placeholder="Use before the promo period ends."
                      aria-invalid={Boolean(form.formState.errors.promoDescription)}
                      {...form.register("promoDescription")}
                    />
                    <FieldError>{form.formState.errors.promoDescription?.message}</FieldError>
                  </div>
                </Field>

                <Field data-invalid={Boolean(form.formState.errors.internalNotes)}>
                  <FieldContent>
                    <FieldLabel htmlFor={`${formId}-internal-notes`}>Internal Notes</FieldLabel>
                  </FieldContent>
                  <div className="flex flex-col gap-1.5">
                    <Textarea
                      id={`${formId}-internal-notes`}
                      rows={3}
                      placeholder="Admin-only notes."
                      aria-invalid={Boolean(form.formState.errors.internalNotes)}
                      {...form.register("internalNotes")}
                    />
                    <FieldError>{form.formState.errors.internalNotes?.message}</FieldError>
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

type VoucherRegister = UseFormRegister<VoucherFormValues>

function DateTimeField({
  formId,
  name,
  label,
  error,
  register,
}: {
  formId: string
  name: "startsAt" | "endsAt"
  label: string
  error?: string
  register: VoucherRegister
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
          type="datetime-local"
          aria-invalid={Boolean(error)}
          {...register(name)}
        />
        <FieldError>{error}</FieldError>
      </div>
    </Field>
  )
}

function NumberField({
  formId,
  name,
  label,
  suffix,
  error,
  register,
}: {
  formId: string
  name: "discountPercent"
  label: string
  suffix?: string
  error?: string
  register: VoucherRegister
}) {
  return (
    <Field data-invalid={Boolean(error)}>
      <FieldContent>
        <FieldLabel htmlFor={`${formId}-${name}`} className="required">
          {label}
        </FieldLabel>
      </FieldContent>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <Input
            id={`${formId}-${name}`}
            type="number"
            min={1}
            aria-invalid={Boolean(error)}
            {...register(name, { valueAsNumber: true })}
          />
          {suffix ? <span className="text-sm text-muted-foreground">{suffix}</span> : null}
        </div>
        <FieldError>{error}</FieldError>
      </div>
    </Field>
  )
}

function SwitchField({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <Field orientation="responsive" className="rounded-xl border bg-secondary/25 p-4">
      <FieldContent>
        <FieldLabel>{label}</FieldLabel>
        <FieldDescription>{description}</FieldDescription>
      </FieldContent>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </Field>
  )
}

function generateVoucherCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let suffix = ""

  for (let index = 0; index < 6; index += 1) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)]
  }

  return `NALARIN-${suffix}`
}

function toDateTimeLocal(date: Date) {
  const pad = (input: number) => String(input).padStart(2, "0")

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}
