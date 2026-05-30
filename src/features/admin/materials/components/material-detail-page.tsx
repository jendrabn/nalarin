"use client"

import Image from "next/image"
import Link from "next/link"
import type { ReactNode } from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArchiveIcon, PencilLineIcon, RocketIcon, Trash2Icon, VideoIcon, FileTextIcon } from "lucide-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/page-header"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getModelEnumBadgeMeta } from "@/lib/model-enums"
import { formatAdminDateTime } from "@/lib/format"
import { cn } from "@/lib/utils"

import {
  archiveMaterialAction,
  deleteMaterialAction,
  publishMaterialAction,
} from "../actions"
import type { MaterialDetails } from "../queries"
import { getMaterialContentMode } from "../utils/material"
import { getYouTubeEmbedUrl } from "@/features/materials/utils/youtube"

type MaterialDetailPageProps = {
  material: MaterialDetails
}

type DialogType = "publish" | "archive" | "delete" | null

function DetailItem({
  label,
  value,
}: {
  label: string
  value: ReactNode
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-sm font-medium text-foreground">{value}</div>
    </div>
  )
}

export function MaterialDetailPage({ material }: MaterialDetailPageProps) {
  const router = useRouter()
  const [dialogType, setDialogType] = useState<DialogType>(null)
  const statusBadge = getModelEnumBadgeMeta("contentStatus", material.status)
  const contentMode = getMaterialContentMode(material.youtubeUrl, material.content)
  const embedUrl = getYouTubeEmbedUrl(material.youtubeUrl)
  const hasVideo = contentMode === "video" || contentMode === "mixed"
  const hasText = contentMode === "text" || contentMode === "mixed"

  async function handleConfirm() {
    if (!dialogType) {
      return
    }

    const result =
      dialogType === "publish"
        ? await publishMaterialAction(material.id)
        : dialogType === "archive"
          ? await archiveMaterialAction(material.id)
          : await deleteMaterialAction(material.id)

    if (!result.success) {
      toast.error(result.message)
      setDialogType(null)
      return
    }

    toast.success(
      dialogType === "publish"
        ? "Material published."
        : dialogType === "archive"
          ? "Material archived."
          : "Material deleted.",
    )

    setDialogType(null)

    if (dialogType === "delete") {
      router.push("/admin/materials")
      router.refresh()
      return
    }

    router.refresh()
  }

  const dialogCopy =
    dialogType === "publish"
      ? {
          title: "Publish material?",
          description:
            "This will publish the material immediately. The content must include a YouTube URL or Tiptap content.",
          action: "Publish",
          variant: "default" as const,
        }
      : dialogType === "archive"
        ? {
            title: "Archive material?",
            description:
              "Archived materials are hidden from the public listing but remain accessible in the admin panel.",
            action: "Archive",
            variant: "destructive" as const,
          }
        : {
            title: "Delete material?",
            description:
              "Only draft materials that have never been published can be deleted.",
            action: "Delete",
            variant: "destructive" as const,
          }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={material.title}
        subtitle={material.excerpt ?? "Review this material to inspect its content and metadata."}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href={`/admin/materials/${material.id}/edit`}>
                <PencilLineIcon data-icon="inline-start" />
                Edit
              </Link>
            </Button>
            {material.status !== "published" ? (
              <Button type="button" onClick={() => setDialogType("publish")}>
                <RocketIcon data-icon="inline-start" />
                Publish
              </Button>
            ) : (
              <Button type="button" variant="destructive" onClick={() => setDialogType("archive")}>
                <ArchiveIcon data-icon="inline-start" />
                Archive
              </Button>
            )}
            <Button type="button" variant="destructive" onClick={() => setDialogType("delete")}>
              <Trash2Icon data-icon="inline-start" />
              Delete
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="overflow-hidden rounded-xl border border-border/60 bg-secondary/20">
              <div className="relative aspect-[16/9]">
                {material.thumbnailUrl ? (
                  <Image
                    src={material.thumbnailUrl}
                    alt={material.title}
                    fill
                    unoptimized
                    sizes="(max-width: 1280px) 100vw, 50vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-muted/30 text-sm text-muted-foreground">
                    No thumbnail selected.
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="soft" className={statusBadge.className}>
                {statusBadge.label}
              </Badge>
              <Badge variant={material.isFree ? "secondary" : "outline"}>
                {material.isFree ? "Free" : "Paid"}
              </Badge>
              <Badge variant="outline">{material.examTypeName}</Badge>
              <Badge variant="outline">{material.subjectName}</Badge>
              {material.topicName ? <Badge variant="outline">{material.topicName}</Badge> : null}
            </div>

            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailItem label="Material ID" value={material.id} />
              <DetailItem label="Slug" value={<span className="break-all font-mono text-xs">{material.slug}</span>} />
              <DetailItem label="Content Mode" value={contentModeToLabel(contentMode)} />
              <DetailItem label="Published At" value={formatAdminDateTime(material.publishedAt)} />
              <DetailItem label="Created At" value={formatAdminDateTime(material.createdAt)} />
              <DetailItem label="Updated At" value={formatAdminDateTime(material.updatedAt)} />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Taxonomy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <DetailItem label="Exam Type" value={material.examTypeName} />
              <DetailItem label="Subject" value={material.subjectName} />
              <DetailItem label="Topic" value={material.topicName ?? "-"} />
              <DetailItem label="Access" value={material.isFree ? "Free" : "Paid"} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Content Preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasVideo && hasText ? (
            <Tabs defaultValue="video" className="w-full">
              <TabsList className="w-full justify-start gap-2 bg-transparent p-0">
                <TabsTrigger
                  value="video"
                  className="rounded-full border border-border/70 bg-card px-4 py-2 data-active:border-primary/25 data-active:bg-primary/10"
                >
                  <VideoIcon />
                  Video
                </TabsTrigger>
                <TabsTrigger
                  value="text"
                  className="rounded-full border border-border/70 bg-card px-4 py-2 data-active:border-primary/25 data-active:bg-primary/10"
                >
                  <FileTextIcon />
                  Text
                </TabsTrigger>
              </TabsList>

              <TabsContent value="video" className="mt-4">
                <PreviewCard title="Video">
                  {embedUrl ? (
                    <div className="overflow-hidden rounded-lg border bg-secondary/30">
                      <div className="aspect-video">
                        <iframe
                          className="h-full w-full"
                          src={embedUrl}
                          title={material.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        />
                      </div>
                    </div>
                  ) : (
                    <EmptyNote message="YouTube URL has not been provided." />
                  )}
                </PreviewCard>
              </TabsContent>

              <TabsContent value="text" className="mt-4">
                <PreviewCard title="Text">
                  <RichTextPreview content={material.content} />
                </PreviewCard>
              </TabsContent>
            </Tabs>
          ) : hasVideo ? (
            <PreviewCard title="Video">
              {embedUrl ? (
                <div className="overflow-hidden rounded-lg border bg-secondary/30">
                  <div className="aspect-video">
                    <iframe
                      className="h-full w-full"
                      src={embedUrl}
                      title={material.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                </div>
              ) : (
                <EmptyNote message="YouTube URL has not been provided." />
              )}
            </PreviewCard>
          ) : hasText ? (
            <PreviewCard title="Text">
              <RichTextPreview content={material.content} />
            </PreviewCard>
          ) : (
            <EmptyNote message="This material does not have content yet." />
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={Boolean(dialogType)}
        onOpenChange={(open) => {
          if (!open) {
            setDialogType(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogCopy.title}</AlertDialogTitle>
            <AlertDialogDescription>{dialogCopy.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                type="button"
                variant={dialogCopy.variant === "destructive" ? "destructive-solid" : "default"}
                onClick={() => void handleConfirm()}
              >
                {dialogCopy.action}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function PreviewCard({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">{title}</p>
      {children}
    </div>
  )
}

function EmptyNote({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 p-6 text-center text-sm text-muted-foreground">
      {message}
    </div>
  )
}

function RichTextPreview({ content }: { content: string | null }) {
  if (!content?.trim()) {
    return <EmptyNote message="Text content has not been provided." />
  }

  return (
    <div
      className={cn(
        "min-w-0 text-base leading-8 text-foreground/90 sm:text-lg sm:leading-9",
        "[&_a]:font-medium [&_a]:text-primary [&_a]:underline-offset-4 [&_a:hover]:underline",
        "[&_blockquote]:my-7 [&_blockquote]:rounded-r-lg [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:bg-secondary/60 [&_blockquote]:px-5 [&_blockquote]:py-3 [&_blockquote]:text-muted-foreground",
        "[&_h2]:mt-11 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:leading-snug [&_h2]:tracking-normal",
        "[&_h3]:mt-9 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:leading-snug",
        "[&_img]:my-8 [&_img]:rounded-lg [&_img]:ring-1 [&_img]:ring-border",
        "[&_li]:my-2 [&_ol]:my-6 [&_ol]:list-decimal [&_ol]:pl-6",
        "[&_p]:my-6 [&_strong]:font-semibold [&_ul]:my-6 [&_ul]:list-disc [&_ul]:pl-6",
      )}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}

function contentModeToLabel(mode: ReturnType<typeof getMaterialContentMode>) {
  if (mode === "mixed") {
    return "Video + Text"
  }

  if (mode === "video") {
    return "Video"
  }

  if (mode === "text") {
    return "Text"
  }

  return "Empty"
}
