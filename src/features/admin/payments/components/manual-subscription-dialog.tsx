"use client"

import { useEffect, useId, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { ChevronDownIcon, PlusIcon, SearchIcon } from "lucide-react"
import { useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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
import { getModelEnumBadgeMeta } from "@/lib/model-enums"

import { createManualSubscriptionAction } from "../actions"
import { manualSubscriptionFormSchema, type ManualSubscriptionFormValues } from "../schemas"

type ManualSubscriptionDialogUser = {
  id: number
  name: string
  email: string
  activePlanCode: "free" | "pro" | "max"
}

type ManualSubscriptionDialogProps = {
  users: ManualSubscriptionDialogUser[]
}

function buildDefaultValues(): ManualSubscriptionFormValues {
  return {
    userId: "",
    planCode: "pro",
  }
}

export function ManualSubscriptionDialog({
  users,
}: ManualSubscriptionDialogProps) {
  const router = useRouter()
  const formId = useId()
  const defaultValues = useMemo(() => buildDefaultValues(), [])
  const [open, setOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)

  const form = useForm<ManualSubscriptionFormValues>({
    resolver: zodResolver(manualSubscriptionFormSchema),
    defaultValues,
  })

  const watchedUserId = useWatch({
    control: form.control,
    name: "userId",
  })
  const watchedPlanCode = useWatch({
    control: form.control,
    name: "planCode",
  })

  const selectedUser = users.find((user) => String(user.id) === watchedUserId) ?? null

  useEffect(() => {
    if (!open) {
      form.reset(defaultValues)
    }
  }, [defaultValues, form, open])

  async function handleSubmit(values: ManualSubscriptionFormValues) {
    setIsPending(true)

    try {
      const result = await createManualSubscriptionAction(values)

      if (!result.success) {
        if (result.fieldErrors) {
          (Object.keys(result.fieldErrors) as Array<keyof ManualSubscriptionFormValues>).forEach(
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
          toast.error(result.message)
        }

        return
      }

      toast.success(
        result.data.action === "updated"
          ? "Subscription updated."
          : "Subscription created.",
      )
      setOpen(false)
      router.refresh()
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setUserOpen(false)
        }

        setOpen(nextOpen)
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <PlusIcon data-icon="inline-start" />
          Add Subscription
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Subscription</DialogTitle>
          <DialogDescription>
            Grant a Pro or Max subscription manually. The active period will start
            now and end one month later.
          </DialogDescription>
        </DialogHeader>

        <form id={formId} onSubmit={form.handleSubmit(handleSubmit)}>
          <FieldGroup>
            <Field data-invalid={Boolean(form.formState.errors.userId)}>
              <FieldContent>
                <FieldLabel className="required">User</FieldLabel>
              </FieldContent>
              <div className="flex flex-col gap-1.5">
                <Popover open={userOpen} onOpenChange={setUserOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-between font-normal"
                      aria-invalid={Boolean(form.formState.errors.userId)}
                    >
                      {selectedUser ? (
                        <span className="truncate text-left">
                          {selectedUser.name} - {selectedUser.email} -{" "}
                          {getModelEnumBadgeMeta("planCode", selectedUser.activePlanCode).label}
                        </span>
                      ) : (
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <SearchIcon data-icon="inline-start" />
                          Search users
                        </span>
                      )}
                      <ChevronDownIcon data-icon="inline-end" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-[var(--radix-popper-anchor-width)] p-0">
                    <Command>
                      <CommandInput placeholder="Search users..." />
                      <CommandList>
                        <CommandEmpty>No users found.</CommandEmpty>
                        <CommandGroup>
                          {users.map((user) => {
                            const planLabel = getModelEnumBadgeMeta(
                              "planCode",
                              user.activePlanCode,
                            ).label

                            return (
                              <CommandItem
                                key={user.id}
                                value={`${user.name} ${user.email} ${planLabel}`}
                                onSelect={() => {
                                  form.setValue("userId", String(user.id), {
                                    shouldDirty: true,
                                    shouldValidate: true,
                                  })
                                  setUserOpen(false)
                                }}
                              >
                                <span className="truncate">
                                  {user.name} - {user.email} - {planLabel}
                                </span>
                              </CommandItem>
                            )
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FieldDescription>
                  Search by name or email, then pick the target user.
                </FieldDescription>
                <FieldError>{form.formState.errors.userId?.message}</FieldError>
              </div>
            </Field>

            <Field data-invalid={Boolean(form.formState.errors.planCode)}>
              <FieldContent>
                <FieldLabel className="required">Plan</FieldLabel>
              </FieldContent>
              <div className="flex flex-col gap-1.5">
                <Select
                  value={watchedPlanCode}
                  onValueChange={(value) =>
                    form.setValue("planCode", value as "pro" | "max", {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="max">Max</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldDescription>
                  The subscription will be granted immediately using the selected plan.
                </FieldDescription>
                <FieldError>{form.formState.errors.planCode?.message}</FieldError>
              </div>
            </Field>
          </FieldGroup>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" form={formId} disabled={isPending}>
            {isPending ? "Saving..." : "Save Subscription"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
