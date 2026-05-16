"use client"

import Image from "next/image"
import { useId, useRef, useState, type ChangeEvent } from "react"
import { ImageIcon, UploadIcon, XIcon } from "lucide-react"
import { toast } from "sonner"

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
      toast.error("Logo harus berupa file PNG atau SVG.")
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
        toast.error(payload.message ?? "Logo gagal diunggah.")
        return
      }

      onChange(payload.url)
      toast.success("Logo berhasil diunggah.")
    } catch {
      toast.error("Logo gagal diunggah.")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Field data-invalid={Boolean(error)}>
      <FieldContent>
        <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
        <FieldDescription>
          Gunakan PNG atau SVG agar ikon tetap tajam di berbagai ukuran.
        </FieldDescription>
      </FieldContent>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3 rounded-xl border bg-muted/25 p-3">
          <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-lg border bg-background text-muted-foreground [&_svg]:size-5">
            {value ? (
              <Image
                src={value}
                alt=""
                width={56}
                height={56}
                unoptimized
                className="size-full object-contain p-2"
              />
            ) : (
              <ImageIcon />
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <p className="truncate text-sm font-medium">
              {value ? value.split("/").pop() : "Belum ada logo"}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isUploading}
                onClick={() => inputRef.current?.click()}
              >
                <UploadIcon data-icon="inline-start" />
                {isUploading ? "Mengunggah..." : "Upload logo"}
              </Button>
              {value ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isUploading}
                  onClick={() => onChange("")}
                >
                  <XIcon data-icon="inline-start" />
                  Hapus
                </Button>
              ) : null}
            </div>
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
