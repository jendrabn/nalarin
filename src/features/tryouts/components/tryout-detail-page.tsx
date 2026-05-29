"use client"

import Link from "next/link"
import { useTransition } from "react"
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  LockIcon,
  PlayCircleIcon,
  TimerIcon,
} from "lucide-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/page-header"
import { SiteFooter } from "@/components/site-footer"
import { SiteNavbar, type SiteUser } from "@/components/site-navbar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import type {
  PublicTryoutDetail,
  PublicTryoutSessionSummary,
} from "../queries"
import { startTryoutSessionAction } from "../actions"
import { canAccessTryout } from "../utils/access"
import {
  formatDuration,
  formatLongDateTime,
  isResultReleased,
} from "../utils/status"

type TryoutDetailPageProps = {
  user: {
    id: number
    name: string
    email: string
    avatarUrl: string | null
    role: "user" | "admin"
    isEmailVerified: boolean
  } | null
  hasPremiumAccess: boolean
  tryout: PublicTryoutDetail
  userSession: PublicTryoutSessionSummary | null
  serverNow: string
}

export function TryoutDetailPage({
  user,
  hasPremiumAccess,
  tryout,
  userSession,
  serverNow,
}: TryoutDetailPageProps) {
  const siteUser = user
    ? ({
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        role: user.role,
      } satisfies NonNullable<SiteUser>)
    : null
  const accessAllowed = canAccessTryout({ isFree: tryout.isFree, hasPremiumAccess })
  const resultAvailable =
    userSession?.status === "graded" &&
    isResultReleased(
      {
        showResultAfterSubmit: tryout.showResultAfterSubmit,
        resultReleaseAt: tryout.resultReleaseAt,
      },
      serverNow,
    )
  const cta = getCtaState({
    user,
    tryout,
    userSession,
    accessAllowed,
    resultAvailable,
  })
  const [isPending, startTransition] = useTransition()

  function handleStartTryout() {
    if (cta.disabled) {
      if (cta.disabledMessage) {
        toast.error(cta.disabledMessage)
      }
      return
    }

    startTransition(async () => {
      const result = await startTryoutSessionAction({ tryoutSlug: tryout.slug })

      if (!result.success) {
        toast.error(result.message)
      }
    })
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNavbar user={siteUser} />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader
          title={tryout.title}
          subtitle={
            tryout.description ??
            "Lihat jadwal, komposisi subtes, dan aturan sebelum memulai tryout."
          }
          className="mb-0"
          actions={
            <Button asChild variant="outline">
              <Link href={`/tryouts/exam/${tryout.examTypeSlug}`}>
                <ArrowLeftIcon data-icon="inline-start" />
                Kembali
              </Link>
            </Button>
          }
        /> 

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="flex min-w-0 flex-col gap-6">
            <TryoutInfoCard
              tryout={tryout}
              resultAvailable={resultAvailable}
            />
            <TryoutSectionsCard tryout={tryout} />
            <TryoutRulesCard />
          </div>

          <aside className="flex flex-col gap-6">
            <TryoutAccessCard
              cta={cta}
              isPending={isPending}
              onStart={handleStartTryout}
              stats={[
                { label: "Total Soal", value: `${tryout.questionCount} soal` },
                { label: "Total Subtes", value: `${tryout.sectionCount} subtes` },
                {
                  label: "Penalti Salah",
                  value: tryout.wrongAnswerPenalty < 0 ? String(tryout.wrongAnswerPenalty) : "Tidak Ada",
                },
                {
                  label: "Navigasi",
                  value: tryout.navigationMode === "free" ? "Bebas" : "Berurutan",
                },
                {
                  label: "Hasil",
                  value: tryout.showResultAfterSubmit ? "Setelah Submit" : "Sesuai Jadwal",
                },
              ]}
            />
          </aside>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}

function StatusBadge({
  tryout,
  resultAvailable,
}: {
  tryout: PublicTryoutDetail
  resultAvailable: boolean
}) {
  if (resultAvailable) {
    return (
      <Badge variant="outline" size="default" className="border-chart-4/20 bg-chart-4/10 text-chart-4">
        Hasil Tersedia
      </Badge>
    )
  }

  const meta = {
    ongoing: {
      label: "Aktif",
      className: "border-chart-2/20 bg-chart-2/10 text-chart-2",
    },
    upcoming: {
      label: "Akan Datang",
      className: "border-chart-1/20 bg-chart-1/10 text-chart-1",
    },
    ended: {
      label: "Berakhir",
      className: "border-destructive/20 bg-destructive/10 text-destructive",
    },
  }[tryout.availabilityStatus]

  return (
    <Badge variant="outline" size="default" className={meta.className}>
      {meta.label}
    </Badge>
  )
}

function DetailMetric({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-lg border bg-muted/25 p-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold leading-5">{value}</p>
    </div>
  )
}

function RuleItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-chart-2" />
      <span className="leading-6">{children}</span>
    </li>
  )
}

function TryoutInfoCard({
  tryout,
  resultAvailable,
}: {
  tryout: PublicTryoutDetail
  resultAvailable: boolean
}) {
  const metrics = [
    { label: "Mulai", value: formatLongDateTime(tryout.startsAt) },
    { label: "Selesai", value: formatLongDateTime(tryout.endsAt) },
    { label: "Durasi Total", value: formatDuration(tryout.totalDurationMinutes) },
    {
      label: "Komposisi Soal",
      value: `${tryout.sectionCount} subtes, ${tryout.questionCount} soal`,
    },
  ]

  return (
    <Card className="rounded-lg shadow-sm">
      <CardHeader>
        <CardTitle>Informasi Tryout</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-wrap gap-2">
          <StatusBadge tryout={tryout} resultAvailable={resultAvailable} />
          {tryout.isFree ? (
            <Badge variant="soft" size="default">Gratis</Badge>
          ) : (
            <Badge variant="destructive" size="default">
              <LockIcon data-icon="inline-start" />
              Premium
            </Badge>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <DetailMetric key={metric.label} label={metric.label} value={metric.value} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function TryoutSectionsCard({
  tryout,
}: {
  tryout: PublicTryoutDetail
}) {
  return (
    <Card className="rounded-lg shadow-sm">
      <CardHeader>
        <CardTitle>Daftar Subtes</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {tryout.sections.map((section) => (
          <TryoutSectionRow key={section.id} section={section} />
        ))}
        <div className="mt-1 flex items-center justify-between gap-3 rounded-lg bg-muted/30 px-4 py-3 text-sm font-medium">
          <span>Total Durasi</span>
          <span>{formatDuration(tryout.totalDurationMinutes)}</span>
        </div>
      </CardContent>
    </Card>
  )
}

function TryoutSectionRow({
  section,
}: {
  section: PublicTryoutDetail["sections"][number]
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border bg-background px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-md bg-secondary text-sm font-semibold text-secondary-foreground">
          {section.orderIndex}
        </span>
        <div className="min-w-0">
          <p className="line-clamp-1 font-medium leading-6">{section.title}</p>
          <p className="line-clamp-1 text-sm text-muted-foreground">
            {section.subjectName} - {section.questionCount} soal
          </p>
        </div>
      </div>
      <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-muted-foreground">
        <TimerIcon className="size-4" />
        {section.durationMinutes} menit
      </span>
    </div>
  )
}

function TryoutRulesCard() {
  const rules = [
    "Kerjakan tryout sesuai urutan subtes yang tersedia.",
    "Setiap subtes memiliki timer sendiri dan akan dikunci setelah selesai.",
    "Jawaban pada subtes yang sudah selesai tidak dapat diubah kembali.",
    "Satu akun hanya boleh memiliki satu sesi untuk tryout ini.",
    "Tidak ada percobaan ulang untuk tryout yang sama.",
    "Hasil, ranking, dan pembahasan mengikuti jadwal rilis serta akses paket.",
  ]

  return (
    <Card className="rounded-lg shadow-sm">
      <CardHeader>
        <CardTitle>Petunjuk & Aturan</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-3 text-sm leading-6 text-muted-foreground sm:grid-cols-2">
          {rules.map((rule) => (
            <RuleItem key={rule}>{rule}</RuleItem>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

function TryoutAccessCard({
  cta,
  stats,
  isPending,
  onStart,
}: {
  cta: { description: string; disabled: boolean; disabledMessage?: string; locked: boolean }
  stats: Array<{ label: string; value: string }>
  isPending: boolean
  onStart: () => void
}) {
  return (
    <Card className="rounded-lg shadow-sm">
      <CardHeader>
        <CardTitle>Mulai Tryout</CardTitle>
        <CardDescription>Sesi baru hanya dibuat setelah kamu menekan tombol mulai.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm leading-6 text-muted-foreground">{cta.description}</p>
        <div className="flex flex-col gap-3 text-sm">
          {stats.map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-medium">{item.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="border-t pt-4">
        <Button
          type="button"
          size="lg"
          className="h-11 w-full justify-center gap-2 text-base"
          disabled={isPending}
          aria-disabled={cta.disabled || isPending}
          onClick={onStart}
        >
          {cta.locked ? <LockIcon data-icon="inline-start" /> : <PlayCircleIcon data-icon="inline-start" />}
          {isPending ? "Memproses..." : "Mulai Tryout"}
        </Button>
      </CardFooter>
    </Card>
  )
}

function getCtaState({
  user,
  tryout,
  userSession,
  accessAllowed,
  resultAvailable,
}: {
  user: TryoutDetailPageProps["user"]
  tryout: PublicTryoutDetail
  userSession: PublicTryoutSessionSummary | null
  accessAllowed: boolean
  resultAvailable: boolean
}) {
  if (!user) {
    return {
      description: "Kamu bisa membaca detail tryout sekarang. Login diperlukan saat mulai.",
      disabled: false,
      locked: false,
    }
  }

  if (!user.isEmailVerified) {
    return {
      description: "Verifikasi email diperlukan sebelum mengikuti tryout.",
      disabled: true,
      disabledMessage: "Verifikasi email dulu sebelum mulai tryout.",
      locked: true,
    }
  }

  if (userSession?.status === "in_progress") {
    return {
      description: "Kamu sudah punya sesi berjalan. Sistem akan melanjutkan sesi yang sama.",
      disabled: false,
      locked: false,
    }
  }

  if (resultAvailable) {
    return {
      description: "Tryout sudah selesai dan hasilnya tersedia untuk dilihat.",
      disabled: false,
      locked: false,
    }
  }

  if (userSession?.status === "graded") {
    return {
      description: "Tryout sudah selesai, tetapi hasil belum masuk jadwal rilis.",
      disabled: true,
      disabledMessage: "Hasil tryout belum tersedia.",
      locked: false,
    }
  }

  if (userSession) {
    return {
      description: "Akun ini sudah pernah memulai tryout dan tidak bisa membuat percobaan ulang.",
      disabled: true,
      disabledMessage: "Tidak ada percobaan ulang untuk tryout yang sama.",
      locked: true,
    }
  }

  if (!accessAllowed) {
    return {
      description: `Tryout premium tersedia untuk paket ${tryout.examTypeName}.`,
      disabled: true,
      disabledMessage: `Tryout premium tersedia untuk paket ${tryout.examTypeName}.`,
      locked: true,
    }
  }

  if (tryout.availabilityStatus === "upcoming") {
    return {
      description: "Tryout belum memasuki jadwal mulai.",
      disabled: true,
      disabledMessage: "Tryout belum dimulai.",
      locked: false,
    }
  }

  if (tryout.availabilityStatus === "ended") {
    return {
      description: "Tryout sudah melewati waktu selesai dan tidak bisa dimulai.",
      disabled: true,
      disabledMessage: "Tryout sudah berakhir.",
      locked: false,
    }
  }

  return {
    description: "Pastikan koneksi stabil. Setelah dimulai, sesi tryout tidak bisa diulang.",
    disabled: false,
    locked: false,
  }
}
