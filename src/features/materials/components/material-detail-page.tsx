import Link from "next/link"
import type { ReactNode } from "react"
import {
  ArrowLeftIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  FileTextIcon,
  LockIcon,
  PlayCircleIcon,
  VideoIcon,
} from "lucide-react"

import { SiteFooter } from "@/components/site-footer"
import { SiteNavbar, type SiteUser } from "@/components/site-navbar"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { formatBlogDate } from "@/features/blog/utils"

import type { CurrentUser } from "@/features/auth/services/session"

import type { PublicMaterialDetail } from "../queries"
import { getYouTubeEmbedUrl } from "../utils/youtube"

type MaterialDetailPageProps = {
  user: CurrentUser | null
  hasPremiumAccess: boolean
  material: PublicMaterialDetail
}

export function MaterialDetailPage({
  user,
  hasPremiumAccess,
  material,
}: MaterialDetailPageProps) {
  const siteUser = user
    ? ({
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        role: user.role,
      } satisfies NonNullable<SiteUser>)
    : null

  const canAccessContent = material.isFree || hasPremiumAccess
  const hasVideo = Boolean(material.youtubeVideoId)
  const hasText = Boolean(material.content?.trim())
  const embedUrl = getYouTubeEmbedUrl(material.youtubeUrl)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNavbar user={siteUser} />
      <main>
        <section className="relative isolate overflow-hidden border-b bg-background">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_12%,color-mix(in_oklch,var(--primary)_14%,transparent),transparent_42%),linear-gradient(180deg,var(--background)_0%,var(--secondary)_58%,var(--background)_100%)]" />
          <div className="absolute inset-0 -z-10 opacity-[0.34] [background-image:linear-gradient(0deg,color-mix(in_oklch,var(--foreground)_4%,transparent)_1px,transparent_1px)] [background-size:100%_18px]" />
          <div className="absolute inset-x-0 bottom-0 -z-10 h-28 bg-gradient-to-b from-transparent to-background" />
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
            <div className="flex flex-wrap gap-2">
              <Badge className="rounded-full bg-primary/10 text-primary hover:bg-primary/10">
                {material.examTypeName}
              </Badge>
              <Badge variant="outline" className="rounded-full">
                <BookOpenIcon />
                {material.subjectName}
              </Badge>
              {material.topicName ? (
                <Badge variant="outline" className="rounded-full">
                  <FileTextIcon />
                  {material.topicName}
                </Badge>
              ) : null}
              <Badge
                variant={material.isFree ? "secondary" : "destructive"}
                className="rounded-full"
              >
                {material.isFree ? "Gratis" : "Premium"}
              </Badge>
            </div>

            <PageHeader
              className="mb-0"
              title={material.title}
              subtitle={
                material.excerpt ??
                `Materi ${material.subjectName} untuk persiapan ${material.examTypeName}.`
              }
              actions={
                <Button asChild variant="outline" className="w-fit shrink-0">
                  <Link href={`/materials/exam/${material.examTypeSlug}`}>
                    <ArrowLeftIcon data-icon="inline-start" />
                    Kembali Ke Daftar
                  </Link>
                </Button>
              }
            />

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDaysIcon className="size-4" />
                {formatBlogDate(material.publishedAt)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <PlayCircleIcon className="size-4" />
                {material.contentMode === "mixed"
                  ? "Video + Teks"
                  : material.contentMode === "video"
                    ? "Video"
                    : "Teks"}
              </span>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start">
            <div className="min-w-0 space-y-6">
              {canAccessContent ? (
                <>
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
                          Teks
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="video" className="mt-4">
                        <MediaCard title="Video Pembelajaran">
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
                            <EmptyMediaFallback
                              icon={<VideoIcon />}
                              title="URL video belum tersedia"
                              description="Admin belum menambahkan tautan YouTube untuk materi ini."
                            />
                          )}
                        </MediaCard>
                      </TabsContent>
                      <TabsContent value="text" className="mt-4">
                        <TextMaterialCard content={material.content} />
                      </TabsContent>
                    </Tabs>
                  ) : hasVideo ? (
                    <MediaCard title="Video Pembelajaran">
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
                        <EmptyMediaFallback
                          icon={<VideoIcon />}
                          title="URL video belum tersedia"
                          description="Admin belum menambahkan tautan YouTube untuk materi ini."
                        />
                      )}
                    </MediaCard>
                  ) : null}

                  {hasText ? (
                    <TextMaterialCard content={material.content} />
                  ) : null}
                </>
              ) : (
                <Card className="border-border/75 bg-card py-6 shadow-sm">
                  <CardContent className="flex flex-col gap-4 px-5">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                      <LockIcon className="size-5" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-xl font-semibold text-foreground">
                        Materi ini premium
                      </h2>
                      <p className="text-sm leading-6 text-muted-foreground">
                        Konten lengkap video dan teks hanya bisa dibuka untuk paket Pro atau Max
                        pada exam type ini.
                      </p>
                    </div>
                    <Button asChild className="w-fit">
                      <Link href="/pricing">
                        Upgrade Sekarang
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            <aside className="space-y-6">
              <Card className="border-border/75 bg-card py-5 shadow-sm">
                <CardHeader className="gap-2 px-5 pb-0">
                  <CardTitle className="text-base">Ringkasan Materi</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 px-5 pt-4">
                  <DetailMeta label="Jenis Ujian" value={material.examTypeName} />
                  <DetailMeta label="Mata Pelajaran" value={material.subjectName} />
                  <DetailMeta label="Topik" value={material.topicName ?? "-"} />
                  <DetailMeta
                    label="Akses"
                    value={material.isFree ? "Gratis" : "Premium"}
                  />
                </CardContent>
              </Card>

              {material.relatedMaterials.length ? (
                <Card className="border-border/75 bg-card py-5 shadow-sm">
                  <CardHeader className="gap-2 px-5 pb-0">
                    <CardTitle className="text-base">Materi Terkait</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 px-5 pt-4">
                    {material.relatedMaterials.map((relatedMaterial) => (
                      <RelatedMaterialCard
                        key={relatedMaterial.id}
                        material={relatedMaterial}
                      />
                    ))}
                  </CardContent>
                </Card>
              ) : null}
            </aside>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}

function MediaCard({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <Card className="border-border/75 bg-card py-5 shadow-sm">
      <CardHeader className="gap-2 px-5 pb-0">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-5 pt-4">{children}</CardContent>
    </Card>
  )
}

function TextMaterialCard({ content }: { content: string | null }) {
  if (!content?.trim()) {
    return (
      <Card className="border-border/75 bg-card py-5 shadow-sm">
        <CardHeader className="gap-2 px-5 pb-0">
          <CardTitle className="text-base">Teks Materi</CardTitle>
        </CardHeader>
        <CardContent className="px-5 pt-4">
          <EmptyMediaFallback
            icon={<FileTextIcon />}
            title="Konten teks belum tersedia"
            description="Admin belum menambahkan konten Tiptap untuk materi ini."
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/75 bg-card py-5 shadow-sm">
      <CardHeader className="gap-2 px-5 pb-0">
        <CardTitle className="text-base">Teks Materi</CardTitle>
      </CardHeader>
      <CardContent className="px-5 pt-4">
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
      </CardContent>
    </Card>
  )
}

function EmptyMediaFallback({
  icon,
  title,
  description,
}: {
  icon: ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed border-border/70 bg-secondary/20 px-6 py-10 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-background text-primary shadow-sm">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  )
}

function DetailMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/70 pb-3 last:border-b-0 last:pb-0">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-semibold text-foreground">{value}</span>
    </div>
  )
}

function RelatedMaterialCard({ material }: { material: PublicMaterialDetail["relatedMaterials"][number] }) {
  const actionHref = `/materials/${material.slug}`

  return (
    <Link
      href={actionHref}
      className="group block rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Card className="rounded-lg border-border/75 bg-background/60 px-4 py-4 shadow-none transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-primary/25 group-hover:bg-background group-hover:shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-sm font-semibold leading-6 text-foreground">
              {material.title}
            </h3>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
              {material.subjectName}
            </p>
          </div>
          <Badge
            variant={material.isFree ? "secondary" : "destructive"}
            className="shrink-0 rounded-full text-[0.72rem]"
          >
            {material.isFree ? "Gratis" : "Premium"}
          </Badge>
        </div>
      </Card>
    </Link>
  )
}
