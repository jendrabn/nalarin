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
  PlayCircleIcon,
  VideoIcon,
} from "lucide-react"

import { PageHeader } from "@/components/page-header"
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

          <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start">
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
      className="flex w-full flex-col gap-2 lg:sticky lg:top-24"
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
            variant={active ? "default" : "outline"}
            size="xl"
            className={cn(
              "w-full min-w-0 justify-start rounded-full font-semibold tracking-normal shadow-sm",
              !active && "text-muted-foreground hover:border-primary/30 hover:text-foreground",
            )}
          >
            <span className="flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-sm [&_svg]:size-4">
              {subject.logoUrl ? (
                <Image
                  src={subject.logoUrl}
                  alt=""
                  width={20}
                  height={20}
                  unoptimized
                  className="size-full object-contain"
                />
              ) : (
                <BookOpenIcon />
              )}
            </span>
            <span className="min-w-0 truncate text-left">{subject.name}</span>
            <Badge
              variant={active ? "secondary" : "outline"}
              size="sm"
              className="ml-auto rounded-full tabular-nums"
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
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {materials.map((material) => (
            <MaterialCard
              key={material.id}
              material={material}
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
  premiumExamTypeIds,
}: {
  material: PublicMaterialSummary
  premiumExamTypeIds: number[]
}) {
  const accessAllowed = canAccessMaterial({
    isFree: material.isFree,
    hasPremiumAccess: premiumExamTypeIds.includes(material.examTypeId),
  })
  const actionLabel = accessAllowed ? "Buka Materi" : "Upgrade Untuk Akses"
  const actionHref = accessAllowed
    ? `/materials/exam/${material.examTypeSlug}/${material.slug}`
    : "/pricing"

  return (
    <Card className="group flex h-full flex-col rounded-lg border-border/75 bg-card py-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lg">
      <CardHeader className="gap-2.5 px-5 pb-0">
        <div className="flex items-start justify-between gap-3">
          <Badge
            variant="outline"
            size="sm"
            className={cn(
              "shrink-0 rounded-full font-semibold",
              material.contentMode === "mixed"
                ? "border-chart-2/20 bg-chart-2/10 text-chart-2"
                : material.contentMode === "video"
                  ? "border-chart-1/20 bg-chart-1/10 text-chart-1"
                  : "border-chart-3/20 bg-chart-3/10 text-chart-3",
            )}
          >
            {material.contentMode === "mixed"
              ? "Video + Teks"
              : material.contentMode === "video"
                ? "Video"
                : "Teks"}
          </Badge>
          {material.isFree ? (
            <Badge variant="secondary" size="sm" className="shrink-0 rounded-full font-semibold">
              Gratis
            </Badge>
          ) : (
            <Badge variant="destructive" size="sm" className="shrink-0 rounded-full font-semibold">
              <LockIcon data-icon="inline-start" />
              Premium
            </Badge>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <CardTitle className="line-clamp-2 text-[1.05rem] font-semibold leading-6 text-foreground sm:text-[1.08rem]">
            {material.title}
          </CardTitle>
          <p className="line-clamp-3 text-[0.9rem] font-normal leading-6 text-muted-foreground sm:text-[0.925rem]">
            {material.excerpt ?? "Materi pembelajaran terkurasi untuk memperkuat pemahaman kamu."}
          </p>
        </div>
      </CardHeader>

      <CardContent className="mt-auto flex flex-col gap-3.5 px-5 pt-3.5">
        <div className="flex items-center justify-between gap-3">
          <MaterialMetaItem>
            {material.contentMode === "video" ? <VideoIcon /> : <PlayCircleIcon />}
            {material.contentMode === "mixed" ? "Video + Teks" : material.contentMode === "video" ? "Video" : "Teks"}
          </MaterialMetaItem>
          <MaterialMetaItem>
            <BookOpenIcon />
            {material.subjectName}
          </MaterialMetaItem>
        </div>

        <Button
          asChild
          variant={accessAllowed ? "default" : "secondary"}
          size="lg"
          className="w-full"
        >
          <Link href={actionHref}>
            {!accessAllowed ? <LockIcon data-icon="inline-start" /> : null}
            {actionLabel}
            {accessAllowed ? <ArrowRightIcon data-icon="inline-end" /> : null}
          </Link>
        </Button>
      </CardContent>
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
