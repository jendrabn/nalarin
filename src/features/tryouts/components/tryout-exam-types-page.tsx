import Link from "next/link"
import Image from "next/image"
import {
  ArrowRightIcon,
  GraduationCapIcon,
  LayoutListIcon,
} from "lucide-react"

import { SiteFooter } from "@/components/site-footer"
import { SiteNavbar, type SiteUser } from "@/components/site-navbar"
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
  PublicTryoutDiscoveryData,
  PublicTryoutExamType,
  PublicTryoutSummary,
} from "../queries"

type TryoutExamTypesPageProps = {
  user: {
    id: number
    name: string
    email: string
    avatarUrl: string | null
    role: "user" | "admin"
    isEmailVerified: boolean
  } | null
  data: PublicTryoutDiscoveryData
}

export function TryoutExamTypesPage({ user, data }: TryoutExamTypesPageProps) {
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
              Tryout
            </h1>
            <p className="max-w-xl text-[0.925rem] leading-6 text-muted-foreground">
              Simulasi ujian berdasarkan jalur pilihanmu.
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
                  tryouts={data.tryouts.filter((tryout) => tryout.examTypeId === examType.id)}
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
  tryouts,
}: {
  examType: PublicTryoutExamType
  tryouts: PublicTryoutSummary[]
}) {
  const totalTryouts = tryouts.length

  return (
    <Link
      href={`/tryouts/exam/${examType.slug}`}
      className="group h-full rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Card className="h-full rounded-lg border-border/75 bg-card py-5 shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-primary/25 group-hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
        <CardHeader className="gap-4 px-5 pb-0">
          <div className="flex items-start justify-between gap-4">
            <ExamTypeLogo src={examType.logoUrl} name={examType.name} />
            <span
              className={cn(
                "inline-flex h-7 shrink-0 items-center rounded-full border px-3 text-xs font-semibold tabular-nums",
                totalTryouts > 0
                  ? "border-primary/20 bg-primary/8 text-primary"
                  : "border-border bg-secondary/70 text-muted-foreground",
              )}
            >
              {totalTryouts} Tryout
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            <CardTitle className="line-clamp-2 text-[1.125rem] font-semibold leading-6 text-foreground">
              {examType.name}
            </CardTitle>
            <p className="line-clamp-3 min-h-[4.5rem] text-[0.925rem] leading-6 text-muted-foreground">
              {examType.description ??
                `Tryout dan simulasi ujian untuk persiapan ${examType.name}.`}
            </p>
          </div>
        </CardHeader>
        <CardContent className="mt-auto flex flex-1 flex-col px-5 pt-1">
          <span
            className={cn(
              "mt-auto inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold shadow-sm transition-colors [&_svg]:size-4",
              totalTryouts > 0
                ? "border-primary/25 bg-primary text-primary-foreground group-hover:bg-primary/90"
                : "border-border bg-secondary text-muted-foreground shadow-none group-hover:bg-secondary/80",
            )}
          >
            Lihat Tryout
            <ArrowRightIcon aria-hidden="true" />
          </span>
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
