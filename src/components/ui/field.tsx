"use client"

import * as React from "react"

import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type FieldOrientation = "vertical" | "horizontal" | "responsive"

function FieldGroup({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="field-group"
      className={cn("flex flex-col gap-5", className)}
      {...props}
    />
  )
}

function FieldSet({
  className,
  ...props
}: React.ComponentProps<"fieldset">) {
  return (
    <fieldset
      data-slot="field-set"
      className={cn("flex flex-col gap-5 border-0 p-0", className)}
      {...props}
    />
  )
}

function FieldLegend({
  className,
  ...props
}: React.ComponentProps<"legend">) {
  return (
    <legend
      data-slot="field-legend"
      className={cn("mb-1 text-sm font-medium leading-none", className)}
      {...props}
    />
  )
}

function Field({
  className,
  orientation = "vertical",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { orientation?: FieldOrientation }) {
  return (
    <div
      data-slot="field"
      data-orientation={orientation}
      className={cn(
        "flex flex-col gap-2",
        orientation === "horizontal" &&
          "sm:flex-row sm:items-center sm:justify-between sm:gap-4",
        orientation === "responsive" &&
          "sm:flex-row sm:items-start sm:justify-between sm:gap-4",
        className,
      )}
      {...props}
    />
  )
}

function FieldContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="field-content"
      className={cn("flex flex-col gap-1.5", className)}
      {...props}
    />
  )
}

function FieldLabel({
  className,
  ...props
}: React.ComponentProps<typeof Label>) {
  return (
    <Label
      data-slot="field-label"
      className={cn("text-sm font-medium", className)}
      {...props}
    />
  )
}

function FieldDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      data-slot="field-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function FieldError({
  className,
  children,
  errors,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement> & {
  errors?: Array<{ message?: string } | string | undefined>
}) {
  const message =
    typeof children === "string"
      ? children
      : Array.isArray(errors)
        ? errors.find(Boolean)
        : children

  const resolvedMessage =
    typeof message === "string"
      ? message
      : message && typeof message === "object" && "message" in message
        ? message.message
        : undefined

  if (!resolvedMessage) {
    return null
  }

  return (
    <p
      data-slot="field-error"
      aria-live="polite"
      className={cn("text-sm text-destructive", className)}
      {...props}
    >
      {resolvedMessage}
    </p>
  )
}

export {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
}
