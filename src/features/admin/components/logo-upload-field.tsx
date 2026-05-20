"use client"

import { useId, useRef, useState, type ChangeEvent } from "react"
import { ImageIcon, UploadIcon, XIcon } from "lucide-react"
import { toast } from "sonner"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"

type LogoUploadFieldProps = {
  label: string
  value: string
  error?: string
  onChange: (value: string) => void
}

type UploadResponse = {
  url?: string
  message?: string
}

const ACCEPTED_LOGO_TYPES = ["image/png", "image/svg+xml"]

export function LogoUploadField({
  label,
  value,
  error,
  onChange,
}: LogoUploadFieldProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""

    if (!file) {
      return
    }

    if (!ACCEPTED_LOGO_TYPES.includes(file.type)) {
      toast.error("Logo must be a PNG or SVG file.")
      return
    }

    const formData = new FormData()
    formData.append("file", file)
    setIsUploading(true)

    try {
      const response = await fetch("/api/admin/taxonomy/uploads", {
        method: "POST",
        body: formData,
      })
      const payload = (await response.json()) as UploadResponse

      if (!response.ok || !payload.url) {
        toast.error(payload.message ?? "Logo upload failed.")
        return
      }

      onChange(payload.url)
      toast.success("Logo uploaded successfully.")
    } catch {
      toast.error("Logo upload failed.")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Field data-invalid={Boolean(error)}>
      <FieldContent>
        <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
        <FieldDescription>
          Upload a PNG or SVG logo. Square images work best.
        </FieldDescription>
      </FieldContent>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Avatar className="size-16 shrink-0 rounded-full bg-muted">
          <AvatarImage
            src={value || undefined}
            alt={`${label} preview`}
            className="object-contain"
          />
          <AvatarFallback className="rounded-full bg-muted text-muted-foreground">
            <ImageIcon />
          </AvatarFallback>
        </Avatar>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUploading}
              onClick={() => inputRef.current?.click()}
            >
              <UploadIcon data-icon="inline-start" />
              {isUploading ? "Uploading..." : value ? "Replace logo" : "Upload logo"}
            </Button>

            {value ? (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={isUploading}
                onClick={() => onChange("")}
              >
                <XIcon data-icon="inline-start" />
                Remove logo
              </Button>
            ) : null}
          </div>

        </div>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="image/png,image/svg+xml"
          className="sr-only"
          onChange={handleFileChange}
        />
        <FieldError>{error}</FieldError>
      </div>
    </Field>
  )
}
