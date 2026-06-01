"use client"

import Image from "next/image"
import Link from "next/link"
import { useMemo, useState, type ReactNode } from "react"
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BookOpenIcon,
  LayoutListIcon,
  LockIcon,
  VideoIcon,
} from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { PremiumBadge } from "@/components/premium-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { cn } from "@/lib/utils"

import type { PublicMaterialDiscoveryData, PublicMaterialSummary } from "../queries"
import { canAccessMaterial } from "../utils/access"

type MaterialsExplorerProps = {
  data: PublicMaterialDiscoveryData
  premiumExamTypeIds: number[]
  selectedExamTypeSlug?: string
}

export function MaterialsExplorer({
  data,
  premiumExamTypeIds,
  selectedExamTypeSlug,
}: MaterialsExplorerProps) {
  const selectedExamType = selectedExamTypeSlug
    ? data.examTypes.find((examType) => examType.slug === selectedExamTypeSlug)
    : null
  const [activeExamTypeId, setActiveExamTypeId] = useState(
    selectedExamType?.id ?? data.examTypes[0]?.id ?? null,
  )
  const [activeSubjectId, setActiveSubjectId] = useState(() => {
    const firstExamTypeId = selectedExamType?.id ?? data.examTypes[0]?.id

    return data.subjects.find((subject) => subject.examTypeId === firstExamTypeId)?.id ?? null
  })
  const isExamTypeLocked = Boolean(selectedExamTypeSlug)

  const activeExamType = useMemo(
    () => data.examTypes.find((examType) => examType.id === activeExamTypeId) ?? null,
    [activeExamTypeId, data.examTypes],
  )

  const visibleSubjects = useMemo(
    () => data.subjects.filter((subject) => subject.examTypeId === activeExamTypeId),
    [activeExamTypeId, data.subjects],
  )

  const activeSubject = useMemo(
    () => visibleSubjects.find((subject) => subject.id === activeSubjectId) ?? null,
    [activeSubjectId, visibleSubjects],
  )

  const visibleMaterials = useMemo(
    () =>
      data.materials.filter(
        (material) =>
          material.examTypeId === activeExamType?.id &&
          material.subjectId === activeSubject?.id,
      ),
    [activeExamType?.id, activeSubject?.id, data.materials],
  )

  const pageTitle = activeExamType ? `Materi ${activeExamType.name}` : "Materi Pelajaran"
  const pageSubtitle = activeExamType
    ? `Pilih mata pelajaran ${activeExamType.name} untuk melihat materi video atau teks yang relevan.`
    : "Pilih jenis ujian dan mata pelajaran untuk membuka daftar materi yang tersedia."

  function handleExamTypeChange(value: string) {
    const examTypeId = Number(value)
    const firstSubjectId =
      data.subjects.find((subject) => subject.examTypeId === examTypeId)?.id ?? null

    setActiveExamTypeId(examTypeId)
    setActiveSubjectId(firstSubjectId)
  }

  if (data.examTypes.length === 0) {
    return (
      <main className="mx-auto flex min-h-[62vh] w-full max-w-7xl items-center px-4 py-16 sm:px-6 lg:px-8">
        <Empty className="border bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BookOpenIcon />
            </EmptyMedia>
            <EmptyTitle>Belum ada jenis ujian</EmptyTitle>
            <EmptyDescription>
              Materi akan muncul setelah exam type dan data materi dipublikasikan.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </main>
    )
  }

  return (
    <>
      <main className="flex flex-col">
        <section className="mx-auto w-full max-w-7xl px-4 pt-6 pb-1 sm:px-6 lg:px-8">
          <PageHeader
            className="mb-0"
            title={pageTitle}
            subtitle={pageSubtitle}
            actions={
              isExamTypeLocked ? (
                <Button asChild variant="outline" className="w-fit shrink-0">
                  <Link href="/materials">
                    <ArrowLeftIcon data-icon="inline-start" />
                    Kembali Ke Materi
                  </Link>
                </Button>
              ) : null
            }
          />
        </section>

        <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pt-4 pb-8 sm:px-6 lg:px-8">
          {!isExamTypeLocked ? (
            <ExamTypeTabs
              examTypes={data.examTypes}
              activeExamTypeId={activeExamTypeId}
              onExamTypeChange={handleExamTypeChange}
            />
          ) : null}

          <div className="grid gap-6 lg:grid-cols-[19rem_minmax(0,1fr)] lg:items-start">
            <SubjectTabs
              subjects={visibleSubjects}
              activeSubjectId={activeSubjectId}
              onSubjectChange={setActiveSubjectId}
            />

            <div className="min-w-0">
              {visibleSubjects.length === 0 ? (
                <Empty className="min-h-72 border bg-card">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <LayoutListIcon />
                    </EmptyMedia>
                    <EmptyTitle>Belum Ada Mata Pelajaran</EmptyTitle>
                    <EmptyDescription>
                      {activeExamType?.name
                        ? `${activeExamType.name} belum memiliki mata pelajaran yang tersedia.`
                        : "Tipe ujian ini belum memiliki mata pelajaran."}
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <MaterialList
                  materials={visibleMaterials}
                  premiumExamTypeIds={premiumExamTypeIds}
                />
              )}
            </div>
          </div>
        </section>
      </main>
    </>
  )
}

function ExamTypeTabs({
  examTypes,
  activeExamTypeId,
  onExamTypeChange,
}: {
  examTypes: PublicMaterialDiscoveryData["examTypes"]
  activeExamTypeId: number | null
  onExamTypeChange: (value: string) => void
}) {
  return (
    <div
      role="tablist"
      aria-label="Pilih Tipe Ujian"
      className="flex w-full flex-wrap gap-2 pb-1"
    >
      {examTypes.map((examType) => {
        const active = examType.id === activeExamTypeId

        return (
          <Button
            key={examType.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onExamTypeChange(String(examType.id))}
            variant={active ? "default" : "outline"}
            className={cn(
              "shrink-0 rounded-full px-4 font-semibold tracking-normal shadow-sm",
              !active && "text-muted-foreground hover:border-primary/30 hover:text-foreground",
            )}
          >
            {examType.name}
          </Button>
        )
      })}
    </div>
  )
}

function SubjectTabs({
  subjects,
  activeSubjectId,
  onSubjectChange,
}: {
  subjects: PublicMaterialDiscoveryData["subjects"]
  activeSubjectId: number | null
  onSubjectChange: (subjectId: number) => void
}) {
  return (
    <aside
      role="tablist"
      aria-label="Pilih Mata Pelajaran"
      className="flex w-full flex-col gap-1 rounded-2xl border border-border/70 bg-card/75 p-1.5 shadow-xs lg:sticky lg:top-24"
    >
      {subjects.map((subject) => {
        const active = subject.id === activeSubjectId

        return (
          <Button
            key={subject.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSubjectChange(subject.id)}
            variant="ghost"
            size="xl"
            className={cn(
              "relative h-auto min-h-11 w-full min-w-0 justify-start gap-3 overflow-hidden rounded-xl border px-4 py-3 text-left font-medium tracking-normal transition-all duration-200 before:absolute before:left-2 before:top-1/2 before:h-5 before:w-1 before:-translate-y-1/2 before:rounded-full",
              active
                ? "border-primary/30 bg-primary/10 pl-5 text-primary shadow-sm shadow-primary/10 before:bg-primary hover:bg-primary/15 hover:text-primary"
                : "border-transparent bg-muted/25 text-muted-foreground before:bg-transparent hover:border-border hover:bg-muted/70 hover:text-foreground",
            )}
          >
            <span className="min-w-0 truncate text-left leading-5">{subject.name}</span>
            <Badge
              variant="outline"
              size="sm"
              className={cn(
                "ml-auto rounded-full border-transparent tabular-nums transition-colors",
                active
                  ? "bg-primary/15 text-primary"
                  : "bg-muted/70 text-muted-foreground",
              )}
            >
              {subject.materialCount}
            </Badge>
          </Button>
        )
      })}
    </aside>
  )
}

function MaterialList({
  materials,
  premiumExamTypeIds,
}: {
  materials: PublicMaterialSummary[]
  premiumExamTypeIds: number[]
}) {
  return (
    <section>
      {materials.length === 0 ? (
        <Empty className="min-h-72 border bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <LayoutListIcon />
            </EmptyMedia>
            <EmptyTitle>Belum ada materi</EmptyTitle>
            <EmptyDescription>
              Coba pilih mata pelajaran lain atau cek kembali setelah admin menambahkan materi.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 2xl:grid-cols-3">
          {materials.map((material, index) => (
            <MaterialCard
              key={material.id}
              material={material}
              eagerImage={index === 0}
              premiumExamTypeIds={premiumExamTypeIds}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function MaterialCard({
  material,
  eagerImage,
  premiumExamTypeIds,
}: {
  material: PublicMaterialSummary
  eagerImage: boolean
  premiumExamTypeIds: number[]
}) {
  const accessAllowed = canAccessMaterial({
    isFree: material.isFree,
    hasPremiumAccess: premiumExamTypeIds.includes(material.examTypeId),
  })
  const actionLabel = accessAllowed ? "Lihat Materi" : "Upgrade Untuk Akses"
  const actionHref = accessAllowed
    ? `/materials/exam/${material.examTypeSlug}/${material.slug}`
    : "/pricing"
  const hasVideo = material.contentMode === "video" || material.contentMode === "mixed"

  return (
    <Card className="group flex h-full gap-0 overflow-hidden rounded-xl border border-border bg-card py-0 shadow-md shadow-foreground/5 ring-1 ring-border/50 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lg hover:shadow-primary/10 hover:ring-primary/15">
      <div className="relative aspect-[16/9] overflow-hidden border-b border-border/60 bg-muted/35 sm:aspect-[16/8.75]">
        {material.thumbnailUrl ? (
          <>
            <Image
              src={material.thumbnailUrl}
              alt=""
              fill
              loading={eagerImage ? "eager" : "lazy"}
              sizes="(max-width: 768px) 100vw, (max-width: 1536px) 50vw, 33vw"
              unoptimized
              className="scale-110 object-cover opacity-35 blur-md transition duration-500 group-hover:scale-[1.13] group-hover:opacity-45"
            />
            <Image
              src={material.thumbnailUrl}
              alt={material.title}
              fill
              loading={eagerImage ? "eager" : "lazy"}
              sizes="(max-width: 768px) 100vw, (max-width: 1536px) 50vw, 33vw"
              unoptimized
              className="object-contain transition duration-500 group-hover:scale-[1.015] group-hover:saturate-110"
            />
          </>
        ) : (
          <div className="relative flex size-full items-center justify-center overflow-hidden bg-secondary/70">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:22px_22px] opacity-30" />
            <div className="absolute -right-10 -top-10 size-32 rounded-full bg-primary/12 blur-2xl" />
            <div className="absolute -bottom-12 left-6 size-32 rounded-full bg-chart-1/12 blur-2xl" />
            <div className="relative flex max-w-[78%] flex-col items-center gap-2 text-center">
              <span className="grid size-10 place-items-center rounded-lg border border-primary/15 bg-background/85 text-primary shadow-sm [&_svg]:size-5">
                <BookOpenIcon />
              </span>
              <span className="line-clamp-2 text-sm font-semibold leading-5 text-foreground/75">
                {material.subjectName}
              </span>
            </div>
          </div>
        )}
        {hasVideo || !material.isFree ? (
          <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-3 sm:inset-x-4 sm:top-4">
            {hasVideo ? (
              <Badge
                variant="outline"
                size="sm"
                className="shrink-0 rounded-full border-chart-1/20 bg-chart-1/10 font-semibold text-chart-1"
              >
                <VideoIcon />
                Video
              </Badge>
            ) : (
              <span aria-hidden="true" />
            )}
            {material.isFree ? null : (
              <PremiumBadge showIcon />
            )}
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3.5 px-4 pt-3.5 pb-4 sm:gap-4 sm:px-5 sm:pt-4 sm:pb-5">
        <CardHeader className="gap-2 px-0 pt-0 pb-0">
          <div className="flex flex-col gap-1.5">
            <CardTitle className="line-clamp-2 text-[1rem] font-semibold leading-[1.45] text-foreground sm:text-[1.04rem]">
              {material.title}
            </CardTitle>
            <p className="line-clamp-3 text-[0.86rem] font-normal leading-[1.55] text-muted-foreground sm:text-[0.9rem]">
              {material.excerpt ?? "Materi pembelajaran terkurasi untuk memperkuat pemahaman kamu."}
            </p>
          </div>
        </CardHeader>

        <CardContent className="mt-auto flex flex-col gap-3.5 px-0 pt-0 pb-0 sm:gap-4">
          {material.topicName ? (
            <div className="flex items-center gap-3">
              <MaterialMetaItem>
                <BookOpenIcon />
                {material.topicName}
              </MaterialMetaItem>
            </div>
          ) : null}

          <Button
            asChild
            variant={accessAllowed ? "default" : "outline"}
            size="lg"
            className={cn(
              "w-full font-semibold shadow-sm transition-all duration-200 group-hover:shadow-md",
              !accessAllowed && "border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary",
            )}
            >
              <Link href={actionHref}>
                {!accessAllowed ? <LockIcon data-icon="inline-start" /> : null}
                {actionLabel}
                {accessAllowed ? <ArrowRightIcon data-icon="inline-end" /> : null}
              </Link>
            </Button>
        </CardContent>
      </div>
    </Card>
  )
}

function MaterialMetaItem({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[0.8rem] font-medium leading-none text-muted-foreground [&_svg]:size-3.5">
      {children}
    </span>
  )
}
