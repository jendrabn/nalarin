"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useId, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { Controller, useForm, useWatch, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { UploadIcon } from "lucide-react"
import { toast } from "sonner"

import { AdminFormPage } from "@/components/admin-form-page"
import { Badge } from "@/components/ui/badge"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { getModelEnumBadgeMeta } from "@/lib/model-enums"

import {
  createMaterialAction,
  updateMaterialAction,
} from "../actions"
import type {
  MaterialDetails,
  MaterialExamTypeLookup,
  MaterialSubjectLookup,
  MaterialTopicLookup,
} from "../queries"
import { materialFormSchema, type MaterialFormValues } from "../schemas"
import { MaterialRichTextEditor } from "./material-rich-text-editor"
import { getMaterialContentMode } from "../utils/material"
import { uploadMaterialImage } from "../utils/upload"

const TOPIC_NONE_VALUE = "__none__"
const SUBJECT_NONE_VALUE = "__no_subject__"

type MaterialFormPageProps = {
  mode: "create" | "edit"
  materialId?: number
  title: string
  description: string
  submitLabel: string
  backHref: string
  lookups: {
    examTypes: MaterialExamTypeLookup[]
    subjects: MaterialSubjectLookup[]
    topics: MaterialTopicLookup[]
  }
  initialValues?: MaterialDetails | null
}

function buildDefaultValues(initialValues?: MaterialDetails | null): MaterialFormValues {
  return {
    examTypeId: initialValues?.examTypeId ? String(initialValues.examTypeId) : "",
    subjectId: initialValues?.subjectId ? String(initialValues.subjectId) : "",
    topicId: initialValues?.topicId ? String(initialValues.topicId) : "",
    title: initialValues?.title ?? "",
    excerpt: initialValues?.excerpt ?? "",
    thumbnailUrl: initialValues?.thumbnailUrl ?? "",
    youtubeUrl: initialValues?.youtubeUrl ?? "",
    content: initialValues?.content ?? "<p></p>",
    isFree: initialValues?.isFree ?? true,
    status: initialValues?.status ?? "draft",
  }
}

function statusDescription(status: MaterialFormValues["status"]) {
  if (status === "published") {
    return "Visible on the public materials listing."
  }

  if (status === "archived") {
    return "Hidden from the public listing but kept for reference."
  }

  return "Saved as a draft and hidden from the public listing."
}

function contentModeDescription(mode: ReturnType<typeof getMaterialContentMode>) {
  if (mode === "mixed") {
    return "This material includes both a YouTube embed and rich text content."
  }

  if (mode === "video") {
    return "This material is video-only."
  }

  if (mode === "text") {
    return "This material is text-only."
  }

  return "Add a YouTube URL or rich text content before publishing."
}

export function MaterialFormPage({
  mode,
  materialId,
  title,
  description,
  submitLabel,
  backHref,
  lookups,
  initialValues,
}: MaterialFormPageProps) {
  const router = useRouter()
  const formId = useId()
  const thumbnailInputRef = useRef<HTMLInputElement | null>(null)
  const defaultValues = useMemo(() => buildDefaultValues(initialValues), [initialValues])

  const form = useForm<MaterialFormValues>({
    resolver: zodResolver(materialFormSchema) as Resolver<MaterialFormValues>,
    defaultValues,
  })

  useEffect(() => {
    form.reset(defaultValues)
  }, [defaultValues, form])

  const watchedExamTypeId = useWatch({ control: form.control, name: "examTypeId" })
  const watchedSubjectId = useWatch({ control: form.control, name: "subjectId" })
  const watchedTopicId = useWatch({ control: form.control, name: "topicId" })
  const watchedStatus = useWatch({ control: form.control, name: "status" })
  const watchedIsFree = useWatch({ control: form.control, name: "isFree" })
  const watchedThumbnailUrl = useWatch({ control: form.control, name: "thumbnailUrl" })
  const watchedYoutubeUrl = useWatch({ control: form.control, name: "youtubeUrl" })
  const watchedContent = useWatch({ control: form.control, name: "content" })

  const selectedExamTypeId = Number(watchedExamTypeId || 0)
  const selectedSubjectId = Number(watchedSubjectId || 0)
  const selectedExamType = lookups.examTypes.find((examType) => examType.id === selectedExamTypeId)
  const filteredSubjects = lookups.subjects.filter(
    (subject) => subject.examTypeId === selectedExamTypeId,
  )
  const filteredTopics = lookups.topics.filter((topic) => topic.subjectId === selectedSubjectId)
  const selectedSubject = lookups.subjects.find((subject) => subject.id === selectedSubjectId)
  const contentMode = getMaterialContentMode(watchedYoutubeUrl, watchedContent)
  const isSubmitting = form.formState.isSubmitting
  const rootError = form.formState.errors.root?.message

  useEffect(() => {
    if (!watchedExamTypeId) {
      return
    }

    if (watchedSubjectId && !filteredSubjects.some((subject) => String(subject.id) === watchedSubjectId)) {
      form.setValue("subjectId", "", {
        shouldDirty: true,
        shouldValidate: true,
      })
      form.setValue("topicId", "", {
        shouldDirty: true,
        shouldValidate: true,
      })
    }
  }, [filteredSubjects, form, watchedExamTypeId, watchedSubjectId])

  useEffect(() => {
    if (!watchedSubjectId) {
      return
    }

    if (watchedTopicId && !filteredTopics.some((topic) => String(topic.id) === watchedTopicId)) {
      form.setValue("topicId", "", {
        shouldDirty: true,
        shouldValidate: true,
      })
    }
  }, [filteredTopics, form, watchedSubjectId, watchedTopicId])

  const handleSubmit = form.handleSubmit(async (values) => {
    const result =
      mode === "create"
        ? await createMaterialAction(values)
        : await updateMaterialAction(materialId ?? 0, values)

    if (!result.success) {
      if (result.fieldErrors) {
        (Object.keys(result.fieldErrors) as Array<keyof MaterialFormValues>).forEach(
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

    toast.success(mode === "create" ? "Material created." : "Material updated.")

    if (mode === "create") {
      router.replace(`/admin/materials/${result.data.id}/edit`)
      return
    }

    router.refresh()
  })

  async function handleThumbnailUpload(file: File) {
    try {
      const url = await uploadMaterialImage(file)
      form.setValue("thumbnailUrl", url, {
        shouldDirty: true,
        shouldValidate: true,
      })
      toast.success("Thumbnail uploaded.")
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to upload the thumbnail."
      toast.error(message)
    }
  }

  return (
    <AdminFormPage
      title={title}
      subtitle={description}
      backHref={backHref}
      backLabel="Back to Materials"
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
        <FieldGroup className="gap-6">
          {rootError ? (
            <p className="text-sm text-destructive" aria-live="polite">
              {rootError}
            </p>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Material Details</CardTitle>
              <CardDescription>
                Basic metadata, access level, thumbnail, and publication status.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Field data-invalid={Boolean(form.formState.errors.title)}>
                <FieldContent>
                  <FieldLabel htmlFor={`${formId}-title`} className="required">
                    Title
                  </FieldLabel>
                </FieldContent>
                <div className="flex flex-col gap-1.5">
                  <Input
                    id={`${formId}-title`}
                    placeholder="Understanding Probability"
                    aria-invalid={Boolean(form.formState.errors.title)}
                    {...form.register("title")}
                  />
                  <FieldDescription>Keep the title concise and descriptive.</FieldDescription>
                  <FieldError>{form.formState.errors.title?.message}</FieldError>
                </div>
              </Field>

              <Field data-invalid={Boolean(form.formState.errors.excerpt)}>
                <FieldContent>
                  <FieldLabel htmlFor={`${formId}-excerpt`}>Excerpt</FieldLabel>
                </FieldContent>
                <div className="flex flex-col gap-1.5">
                  <Textarea
                    id={`${formId}-excerpt`}
                    rows={4}
                    placeholder="Short summary that appears in the card and search preview."
                    aria-invalid={Boolean(form.formState.errors.excerpt)}
                    {...form.register("excerpt")}
                  />
                  <FieldDescription>Optional. Keep it short and informative.</FieldDescription>
                  <FieldError>{form.formState.errors.excerpt?.message}</FieldError>
                </div>
              </Field>

              <div className="grid gap-4 lg:grid-cols-2">
                <Field data-invalid={Boolean(form.formState.errors.isFree)}>
                  <FieldContent>
                    <FieldLabel>Access</FieldLabel>
                  </FieldContent>
                  <div className="flex flex-col gap-1.5">
                    <Select
                      value={watchedIsFree ? "free" : "paid"}
                      onValueChange={(value) =>
                        form.setValue("isFree", value === "free", {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select access" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                      </SelectContent>
                    </Select>
                    <FieldDescription>
                      {watchedIsFree
                        ? "Free materials are visible to all users."
                        : "Paid materials follow the active plan access rules."}
                    </FieldDescription>
                  </div>
                </Field>

                <Field data-invalid={Boolean(form.formState.errors.status)}>
                  <FieldContent>
                    <FieldLabel className="required">Status</FieldLabel>
                  </FieldContent>
                  <div className="flex flex-col gap-1.5">
                    <Select
                      value={watchedStatus}
                      onValueChange={(value) =>
                        form.setValue("status", value as MaterialFormValues["status"], {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                    >
                      <SelectTrigger aria-invalid={Boolean(form.formState.errors.status)}>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                    <FieldDescription>{statusDescription(watchedStatus)}</FieldDescription>
                    <FieldError>{form.formState.errors.status?.message}</FieldError>
                  </div>
                </Field>
              </div>

              <Field data-invalid={Boolean(form.formState.errors.thumbnailUrl)}>
                <FieldContent>
                  <FieldLabel>Thumbnail</FieldLabel>
                </FieldContent>
                <div className="flex flex-col gap-3">
                  <div className="overflow-hidden rounded-xl border border-border/60 bg-muted/20">
                    <div className="relative aspect-video w-full">
                      {watchedThumbnailUrl ? (
                        <Image
                          src={watchedThumbnailUrl}
                          alt="Material thumbnail preview"
                          fill
                          sizes="(max-width: 1024px) 100vw, 50vw"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                          No thumbnail selected.
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 lg:flex-row">
                    <Input
                      placeholder="https://..."
                      aria-invalid={Boolean(form.formState.errors.thumbnailUrl)}
                      {...form.register("thumbnailUrl")}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => thumbnailInputRef.current?.click()}
                    >
                      <UploadIcon data-icon="inline-start" />
                      Upload
                    </Button>
                  </div>
                  <input
                    ref={thumbnailInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0]

                      if (file) {
                        void handleThumbnailUpload(file)
                      }

                      event.target.value = ""
                    }}
                  />
                  <FieldDescription>
                    Optional. You can upload a thumbnail or paste an image URL.
                  </FieldDescription>
                  <FieldError>{form.formState.errors.thumbnailUrl?.message}</FieldError>
                </div>
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Taxonomy</CardTitle>
              <CardDescription>
                Assign the material to an exam type, subject, and topic.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <Field data-invalid={Boolean(form.formState.errors.examTypeId)}>
                  <FieldContent>
                    <FieldLabel className="required">Exam Type</FieldLabel>
                  </FieldContent>
                  <div className="flex flex-col gap-1.5">
                    <Select
                      value={watchedExamTypeId}
                      onValueChange={(value) =>
                        form.setValue("examTypeId", value, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                    >
                      <SelectTrigger aria-invalid={Boolean(form.formState.errors.examTypeId)}>
                        <SelectValue placeholder="Select exam type" />
                      </SelectTrigger>
                      <SelectContent>
                        {lookups.examTypes.map((examType) => (
                          <SelectItem key={examType.id} value={String(examType.id)}>
                            {examType.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldDescription>
                      {selectedExamType
                        ? `Currently assigned to ${selectedExamType.name}.`
                        : "Select the exam type this material belongs to."}
                    </FieldDescription>
                    <FieldError>{form.formState.errors.examTypeId?.message}</FieldError>
                  </div>
                </Field>

                <Field data-invalid={Boolean(form.formState.errors.subjectId)}>
                  <FieldContent>
                    <FieldLabel className="required">Subject</FieldLabel>
                  </FieldContent>
                  <div className="flex flex-col gap-1.5">
                    <Select
                      value={watchedSubjectId}
                      onValueChange={(value) =>
                        form.setValue("subjectId", value, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                      disabled={!watchedExamTypeId}
                    >
                      <SelectTrigger aria-invalid={Boolean(form.formState.errors.subjectId)}>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredSubjects.length > 0 ? (
                          filteredSubjects.map((subject) => (
                            <SelectItem key={subject.id} value={String(subject.id)}>
                              {subject.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value={SUBJECT_NONE_VALUE} disabled>
                            No subjects available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FieldDescription>
                      {selectedSubject
                        ? `Currently assigned to ${selectedSubject.name}.`
                        : "Subject must belong to the selected exam type."}
                    </FieldDescription>
                    <FieldError>{form.formState.errors.subjectId?.message}</FieldError>
                  </div>
                </Field>
              </div>

              <Field data-invalid={Boolean(form.formState.errors.topicId)}>
                <FieldContent>
                  <FieldLabel>Topic</FieldLabel>
                </FieldContent>
                <div className="flex flex-col gap-1.5">
                  <Select
                    value={watchedTopicId || TOPIC_NONE_VALUE}
                    onValueChange={(value) =>
                      form.setValue("topicId", value === TOPIC_NONE_VALUE ? "" : value, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                    disabled={!watchedSubjectId}
                  >
                    <SelectTrigger aria-invalid={Boolean(form.formState.errors.topicId)}>
                      <SelectValue placeholder="Optional" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={TOPIC_NONE_VALUE}>No topic</SelectItem>
                      {filteredTopics.map((topic) => (
                        <SelectItem key={topic.id} value={String(topic.id)}>
                          {topic.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldDescription>
                    Optional metadata used for filtering and detail breadcrumbs.
                  </FieldDescription>
                  <FieldError>{form.formState.errors.topicId?.message}</FieldError>
                </div>
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Media Content</CardTitle>
              <CardDescription>
                Add a YouTube URL, rich text content, or both.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Field data-invalid={Boolean(form.formState.errors.youtubeUrl)}>
                <FieldContent>
                  <FieldLabel htmlFor={`${formId}-youtube-url`}>YouTube URL</FieldLabel>
                </FieldContent>
                <div className="flex flex-col gap-1.5">
                  <Input
                    id={`${formId}-youtube-url`}
                    placeholder="https://www.youtube.com/watch?v=..."
                    aria-invalid={Boolean(form.formState.errors.youtubeUrl)}
                    {...form.register("youtubeUrl")}
                  />
                  <FieldDescription>
                    Optional. Private or unlisted YouTube links are supported.
                  </FieldDescription>
                  <FieldError>{form.formState.errors.youtubeUrl?.message}</FieldError>
                </div>
              </Field>

              <Field data-invalid={Boolean(form.formState.errors.content)}>
                <FieldContent>
                  <FieldLabel>Content</FieldLabel>
                </FieldContent>
                <div className="flex flex-col gap-1.5">
                  <Controller
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <MaterialRichTextEditor
                        value={field.value}
                        onChange={field.onChange}
                        disabled={isSubmitting}
                      />
                    )}
                  />
                  <FieldDescription>{contentModeDescription(contentMode)}</FieldDescription>
                  <FieldError>{form.formState.errors.content?.message}</FieldError>
                </div>
              </Field>

              <div className="grid gap-3 rounded-xl border border-border/60 bg-muted/20 p-4 lg:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    Content mode
                  </p>
                  <div className="mt-2">
                    <Badge
                      variant="soft"
                      className={
                        contentMode === "mixed"
                          ? "border-chart-2/20 bg-chart-2/10 text-chart-2"
                          : contentMode === "video"
                            ? "border-chart-1/20 bg-chart-1/10 text-chart-1"
                            : contentMode === "text"
                              ? "border-chart-3/20 bg-chart-3/10 text-chart-3"
                              : "border-border bg-muted text-muted-foreground"
                      }
                    >
                      {contentMode === "mixed"
                        ? "Video + Text"
                        : contentMode === "video"
                          ? "Video"
                          : contentMode === "text"
                            ? "Text"
                            : "Empty"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    Publication
                  </p>
                  <div className="mt-2 text-sm font-medium text-foreground">
                    {getModelEnumBadgeMeta("contentStatus", watchedStatus).label}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {contentModeDescription(contentMode)}
                </div>
              </div>
            </CardContent>
          </Card>
        </FieldGroup>
      </form>
    </AdminFormPage>
  )
}
