import Link from "next/link"
import Image from "next/image"
import {
  ArrowRightIcon,
  GraduationCapIcon,
  LayoutListIcon,
} from "lucide-react"

import { SiteFooter } from "@/components/site-footer"
import { SiteNavbar, type SiteUser } from "@/components/site-navbar"
import type { CurrentUser } from "@/features/auth/services/session"
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

import type {
  PracticeDiscoveryData,
  PracticeDiscoveryExamType,
  PracticeDiscoveryPractice,
} from "../queries"

type PracticeExamTypesPageProps = {
  user: CurrentUser | null
  data: PracticeDiscoveryData
}

export function PracticeExamTypesPage({
  user,
  data,
}: PracticeExamTypesPageProps) {
  const siteUser = user
    ? ({
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        role: user.role,
      } satisfies NonNullable<SiteUser>)
    : null

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNavbar user={siteUser} />
      <main className="flex flex-col">
        <section className="mx-auto flex w-full max-w-7xl items-end justify-between gap-4 px-4 pt-6 pb-1 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-1.5">
            <h1 className="font-heading text-[1.7rem] font-semibold leading-tight tracking-normal text-foreground/95 sm:text-[2rem]">
              Latihan Soal
            </h1>
            <p className="max-w-xl text-[0.925rem] leading-6 text-muted-foreground">
              Pilih ujian untuk membuka kumpulan latihan yang tersedia.
            </p>
          </div>
        </section>

        <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pt-4 pb-8 sm:px-6 lg:px-8">
          {data.examTypes.length === 0 ? (
            <Empty className="min-h-80 border bg-card">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <LayoutListIcon />
                </EmptyMedia>
                <EmptyTitle>Belum Ada Jenis Ujian</EmptyTitle>
                <EmptyDescription>
                  Jenis ujian akan tampil setelah data tersedia.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {data.examTypes.map((examType) => (
                <ExamTypeCard
                  key={examType.id}
                  examType={examType}
                  practices={data.practices.filter(
                    (practice) => practice.examTypeId === examType.id,
                  )}
                />
              ))}
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}

function ExamTypeCard({
  examType,
  practices,
}: {
  examType: PracticeDiscoveryExamType
  practices: PracticeDiscoveryPractice[]
}) {
  const totalPractices = practices.length

  return (
    <Link
      href={`/practices/exam/${examType.slug}`}
      className="group h-full rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Card className="flex h-full flex-col rounded-lg border-border/75 bg-card py-5 shadow-sm transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-primary/25 group-hover:shadow-lg">
        <CardHeader className="gap-4 px-5 pb-0">
          <div className="flex items-start justify-between gap-4">
            <ExamTypeLogo src={examType.logoUrl} name={examType.name} />
            <Badge
              variant="outline"
              size="sm"
              className={cn(
                "rounded-full font-semibold tabular-nums",
                totalPractices > 0
                  ? "border-primary/20 bg-primary/8 text-primary"
                  : "border-border bg-secondary/70 text-muted-foreground",
              )}
            >
              {totalPractices} Latihan
            </Badge>
          </div>

          <div className="flex flex-col gap-2.5">
            <CardTitle className="line-clamp-2 text-[1.125rem] font-semibold leading-6 text-foreground">
              {examType.name}
            </CardTitle>
            <p className="line-clamp-3 min-h-[4.5rem] text-[0.925rem] leading-6 text-muted-foreground">
              {examType.description ??
                `Latihan soal dan mata pelajaran untuk persiapan ${examType.name}.`}
            </p>
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col px-5 pt-1">
          <Button
            asChild
            variant={totalPractices > 0 ? "default" : "secondary"}
            size="xl"
            className={cn(
              "mt-auto w-full font-semibold",
              totalPractices > 0 && "group-hover:bg-primary/90",
              totalPractices === 0 && "text-muted-foreground group-hover:bg-secondary/80",
            )}
          >
            <span>
              Lihat Latihan
              <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
            </span>
          </Button>
        </CardContent>
      </Card>
    </Link>
  )
}

function ExamTypeLogo({ src, name }: { src: string | null; name: string }) {
  return src ? (
    <Image
      src={src}
      alt={`${name} logo`}
      width={64}
      height={64}
      unoptimized
      className="h-11 max-h-11 w-auto max-w-14 object-contain"
    />
  ) : (
    <GraduationCapIcon
      aria-hidden="true"
      className="size-11 max-h-11 max-w-14 text-primary/70"
      strokeWidth={1.75}
    />
  )
}
