"use client"

import { useEffect, useId, useMemo, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { UploadIcon } from "lucide-react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

import type { BlogPostStatus } from "../constants"
import {
  blogPostStatusLabels,
  blogPostStatusValues,
} from "../constants"
import {
  createBlogPostAction,
  updateBlogPostAction,
} from "../actions/blog-posts"
import type { BlogPostDetails } from "../queries/blog-posts"
import type { BlogCategoryRow } from "../queries/blog-categories"
import {
  blogPostFormSchema,
  type BlogPostFormValues,
} from "../schemas/blog-post"
import { BlogRichTextEditor } from "./blog-rich-text-editor"
import { formatTagsInput, previewBlogPostSlug } from "../utils/blog-post"
import { uploadBlogImage } from "../utils/upload"

const CATEGORY_NONE_VALUE = "__none__"

type BlogPostFormPageProps = {
  mode: "create" | "edit"
  postId?: number
  title: string
  description: string
  submitLabel: string
  backHref: string
  categories: Pick<BlogCategoryRow, "id" | "name">[]
  initialValues?: BlogPostDetails | null
}

function buildDefaultValues(
  initialValues?: BlogPostDetails | null,
): BlogPostFormValues {
  return {
    title: initialValues?.title ?? "",
    categoryId: initialValues?.categoryId ? String(initialValues.categoryId) : "",
    excerpt: initialValues?.excerpt ?? "",
    content: initialValues?.content ?? "<p></p>",
    thumbnailUrl: initialValues?.thumbnailUrl ?? "",
    tagsInput: formatTagsInput(initialValues?.tags),
    status: initialValues?.status ?? "draft",
    seoTitle: initialValues?.seoTitle ?? "",
    metaDescription: initialValues?.metaDescription ?? "",
  }
}

function statusDescription(status: BlogPostStatus) {
  if (status === "published") {
    return "Visible on the public blog."
  }

  if (status === "archived") {
    return "Kept for reference and hidden from the public listing."
  }

  return "Saved as a draft and hidden from the public listing."
}

export function BlogPostFormPage({
  mode,
  postId,
  title,
  description,
  submitLabel,
  backHref,
  categories,
  initialValues,
}: BlogPostFormPageProps) {
  const router = useRouter()
  const formId = useId()
  const thumbnailInputRef = useRef<HTMLInputElement | null>(null)
  const defaultValues = useMemo(() => buildDefaultValues(initialValues), [initialValues])

  const form = useForm<BlogPostFormValues>({
    resolver: zodResolver(blogPostFormSchema),
    defaultValues,
  })

  useEffect(() => {
    form.reset(defaultValues)
  }, [defaultValues, form])

  const watchedTitle = useWatch({
    control: form.control,
    name: "title",
  })
  const watchedCategoryId = useWatch({
    control: form.control,
    name: "categoryId",
  })
  const watchedStatus = useWatch({
    control: form.control,
    name: "status",
  })
  const watchedThumbnailUrl = useWatch({
    control: form.control,
    name: "thumbnailUrl",
  })
  const slugPreview = previewBlogPostSlug(watchedTitle)
  const isSubmitting = form.formState.isSubmitting
  const rootError = form.formState.errors.root?.message

  const handleSubmit = form.handleSubmit(async (values) => {
    const result =
      mode === "create"
        ? await createBlogPostAction(values)
        : await updateBlogPostAction(postId ?? 0, values)

    if (!result.success) {
      if (result.fieldErrors) {
        (Object.keys(result.fieldErrors) as Array<keyof BlogPostFormValues>).forEach(
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

    toast.success(
      mode === "create" ? "Blog post created." : "Blog post updated.",
    )

    if (mode === "create") {
      router.replace(`/admin/blog/${result.data.id}/edit`)
      return
    }

    router.refresh()
  })

  return (
    <AdminFormPage
      title={title}
      subtitle={description}
      backHref={backHref}
      backLabel="Back to Blog Posts"
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
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Post Details</CardTitle>
              <CardDescription>
                Core article metadata, publication status, and hero thumbnail.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                {rootError ? (
                  <p className="text-sm text-destructive" aria-live="polite">
                    {rootError}
                  </p>
                ) : null}

                <Field data-invalid={Boolean(form.formState.errors.title)}>
                  <FieldContent>
                    <FieldLabel htmlFor={`${formId}-title`} className="required">
                      Title
                    </FieldLabel>
                  </FieldContent>
                  <div className="flex flex-col gap-1.5">
                    <Input
                      id={`${formId}-title`}
                      placeholder="Why Consistency Beats Cramming"
                      aria-invalid={Boolean(form.formState.errors.title)}
                      {...form.register("title")}
                    />
                    <FieldDescription>
                      Keep the title clear and SEO-friendly.
                    </FieldDescription>
                    <FieldError>{form.formState.errors.title?.message}</FieldError>
                  </div>
                </Field>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field data-invalid={Boolean(form.formState.errors.categoryId)}>
                  <FieldContent>
                    <FieldLabel htmlFor={`${formId}-category`}>
                      Category
                    </FieldLabel>
                  </FieldContent>
                  <div className="flex flex-col gap-1.5">
                    <Select
                        value={watchedCategoryId || CATEGORY_NONE_VALUE}
                        onValueChange={(value) =>
                          form.setValue(
                            "categoryId",
                            value === CATEGORY_NONE_VALUE ? "" : value,
                            {
                              shouldDirty: true,
                              shouldValidate: true,
                            },
                          )
                        }
                      >
                        <SelectTrigger
                          id={`${formId}-category`}
                          aria-invalid={Boolean(form.formState.errors.categoryId)}
                        >
                          <SelectValue placeholder="Uncategorized" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={CATEGORY_NONE_VALUE}>
                            Uncategorized
                          </SelectItem>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={String(category.id)}>
                              {category.name}
                            </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldDescription>
                      Optional. Blog posts can be saved without a category.
                    </FieldDescription>
                    <FieldError>
                      {form.formState.errors.categoryId?.message}
                    </FieldError>
                  </div>
                </Field>

                  <Field data-invalid={Boolean(form.formState.errors.status)}>
                  <FieldContent>
                    <FieldLabel htmlFor={`${formId}-status`} className="required">
                      Status
                    </FieldLabel>
                  </FieldContent>
                  <div className="flex flex-col gap-1.5">
                    <Select
                        value={watchedStatus}
                        onValueChange={(value) =>
                          form.setValue("status", value as BlogPostStatus)
                        }
                      >
                        <SelectTrigger
                          id={`${formId}-status`}
                          aria-invalid={Boolean(form.formState.errors.status)}
                        >
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {blogPostStatusValues.map((status) => (
                            <SelectItem key={status} value={status}>
                              {blogPostStatusLabels[status]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldDescription>{statusDescription(watchedStatus)}</FieldDescription>
                      <FieldError>{form.formState.errors.status?.message}</FieldError>
                    </div>
                  </Field>
                </div>

                <Field data-invalid={Boolean(form.formState.errors.excerpt)}>
                  <FieldContent>
                    <FieldLabel htmlFor={`${formId}-excerpt`}>
                      Excerpt
                    </FieldLabel>
                  </FieldContent>
                  <div className="flex flex-col gap-1.5">
                    <Textarea
                      id={`${formId}-excerpt`}
                      rows={4}
                      placeholder="Short article summary."
                      aria-invalid={Boolean(form.formState.errors.excerpt)}
                      {...form.register("excerpt")}
                    />
                    <FieldDescription>
                      Optional summary used in listings and previews.
                    </FieldDescription>
                    <FieldError>{form.formState.errors.excerpt?.message}</FieldError>
                  </div>
                </Field>

                <Field data-invalid={Boolean(form.formState.errors.thumbnailUrl)}>
                  <FieldContent>
                    <FieldLabel htmlFor={`${formId}-thumbnail`}>
                      Thumbnail
                    </FieldLabel>
                  </FieldContent>
                  <div className="flex flex-col gap-3">
                    {watchedThumbnailUrl ? (
                      <Image
                        src={watchedThumbnailUrl}
                        alt="Blog thumbnail preview"
                        width={960}
                        height={540}
                        className="aspect-video w-full rounded-xl border border-border/60 object-cover"
                      />
                      ) : (
                        <div className="flex aspect-video items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/30 text-sm text-muted-foreground">
                          No thumbnail selected.
                        </div>
                      )}

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => thumbnailInputRef.current?.click()}
                      >
                        <UploadIcon data-icon="inline-start" />
                        Upload Thumbnail
                      </Button>
                      {watchedThumbnailUrl ? (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => form.setValue("thumbnailUrl", "")}
                        >
                          Remove
                        </Button>
                      ) : null}
                    </div>

                    <input
                      ref={thumbnailInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0]
                        event.target.value = ""

                        if (!file) {
                          return
                        }

                        void (async () => {
                          try {
                            const url = await uploadBlogImage(file)
                            form.setValue("thumbnailUrl", url, {
                              shouldDirty: true,
                              shouldValidate: true,
                            })
                          } catch (error) {
                            const message =
                              error instanceof Error
                                ? error.message
                                : "Failed to upload the thumbnail."
                            toast.error(message)
                          }
                        })()
                      }}
                    />
                    <FieldDescription>
                      Optional cover image for the article card and editor preview.
                    </FieldDescription>
                    <FieldError>
                      {form.formState.errors.thumbnailUrl?.message}
                    </FieldError>
                  </div>
                </Field>

                <Field data-invalid={Boolean(form.formState.errors.tagsInput)}>
                  <FieldContent>
                    <FieldLabel htmlFor={`${formId}-tags`}>
                      Tags
                    </FieldLabel>
                  </FieldContent>
                  <div className="flex flex-col gap-1.5">
                    <Input
                      id={`${formId}-tags`}
                      placeholder="utbk, belajar, strategi"
                      aria-invalid={Boolean(form.formState.errors.tagsInput)}
                      {...form.register("tagsInput")}
                    />
                    <FieldDescription>
                      Separate tags with commas.
                    </FieldDescription>
                    <FieldError>{form.formState.errors.tagsInput?.message}</FieldError>
                  </div>
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
              <CardDescription>
                Compose the article body with formatting and image upload support.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Field data-invalid={Boolean(form.formState.errors.content)}>
                <FieldContent>
                  <FieldLabel htmlFor={`${formId}-content`} className="required">
                    Article Body
                  </FieldLabel>
                </FieldContent>
                <div className="flex flex-col gap-1.5">
                  <Controller
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <BlogRichTextEditor
                        value={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                  <FieldDescription>
                    Use the toolbar to format text or upload images directly into the content.
                  </FieldDescription>
                  <FieldError>{form.formState.errors.content?.message}</FieldError>
                </div>
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SEO</CardTitle>
              <CardDescription>
                Search metadata and the automatic slug preview.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field data-invalid={Boolean(form.formState.errors.seoTitle)}>
                  <FieldContent>
                    <FieldLabel htmlFor={`${formId}-seo-title`}>
                      SEO Title
                    </FieldLabel>
                  </FieldContent>
                  <div className="flex flex-col gap-1.5">
                    <Input
                      id={`${formId}-seo-title`}
                      placeholder="SEO-friendly title"
                      aria-invalid={Boolean(form.formState.errors.seoTitle)}
                      {...form.register("seoTitle")}
                    />
                    <FieldDescription>
                      Optional title shown in search engines and social previews.
                    </FieldDescription>
                    <FieldError>{form.formState.errors.seoTitle?.message}</FieldError>
                  </div>
                </Field>

                  <Field data-invalid={Boolean(form.formState.errors.metaDescription)}>
                  <FieldContent>
                    <FieldLabel htmlFor={`${formId}-meta-description`}>
                      Meta Description
                    </FieldLabel>
                  </FieldContent>
                  <div className="flex flex-col gap-1.5">
                    <Textarea
                      id={`${formId}-meta-description`}
                      rows={4}
                      placeholder="Short page description."
                      aria-invalid={Boolean(form.formState.errors.metaDescription)}
                      {...form.register("metaDescription")}
                    />
                    <FieldDescription>
                      Keep it concise and actionable.
                    </FieldDescription>
                    <FieldError>
                      {form.formState.errors.metaDescription?.message}
                    </FieldError>
                  </div>
                </Field>
                </div>

                <Field>
                  <FieldContent>
                    <FieldLabel>Slug Preview</FieldLabel>
                  </FieldContent>
                  <div className="flex flex-col gap-1.5">
                    <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                      {slugPreview || "slug-preview"}
                    </div>
                    <FieldDescription>
                      Slug is generated automatically and cannot be edited manually.
                    </FieldDescription>
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
