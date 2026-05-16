import Link from "next/link"
import {
  ArrowLeftIcon,
  BookOpenCheckIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  ClockIcon,
  FileTextIcon,
  GraduationCapIcon,
  LockIcon,
  MedalIcon,
  RouteIcon,
  ShieldCheckIcon,
} from "lucide-react"

import type { PlanCode } from "@/config/plans"
import { SiteFooter } from "@/components/site-footer"
import { SiteNavbar, type SiteUser } from "@/components/site-navbar"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import type {
  PublicTryoutDetail,
  PublicTryoutSessionSummary,
} from "../queries"
import { canAccessTryout } from "../utils/access"
import {
  formatDuration,
  formatLongDateTime,
  isResultReleased,
} from "../utils/status"
import { StartTryoutButton } from "./start-tryout-button"

type TryoutDetailPageProps = {
  user: {
    id: number
    name: string
    email: string
    avatarUrl: string | null
    role: "user" | "admin"
    isEmailVerified: boolean
  } | null
  currentPlanCode: PlanCode
  tryout: PublicTryoutDetail
  userSession: PublicTryoutSessionSummary | null
  serverNow: string
}

export function TryoutDetailPage({
  user,
  currentPlanCode,
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
  const accessAllowed = canAccessTryout({ isFree: tryout.isFree, planCode: currentPlanCode })
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNavbar user={siteUser} />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/tryouts"
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon />
          Kembali ke Daftar Tryout
        </Link>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <Card className="rounded-xl shadow-sm">
            <CardHeader className="gap-5 p-6">
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-primary text-primary-foreground">
                  <GraduationCapIcon data-icon="inline-start" />
                  {tryout.examTypeName}
                </Badge>
                <StatusBadge tryout={tryout} resultAvailable={resultAvailable} />
                {tryout.isFree ? (
                  <Badge variant="soft">Gratis</Badge>
                ) : (
                  <Badge variant="outline" className="border-primary/20 bg-primary/10 text-primary">
                    <LockIcon data-icon="inline-start" />
                    Premium
                  </Badge>
                )}
              </div>
              <div className="flex flex-col gap-3">
                <CardTitle className="font-heading text-[2rem] font-semibold leading-tight tracking-normal text-balance sm:text-[2.55rem]">
                  {tryout.title}
                </CardTitle>
                <CardDescription className="max-w-3xl text-base leading-7">
                  {tryout.description ??
                    "Simulasi tryout multi-section dengan timer per subtest dan hasil sesuai jadwal rilis."}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 px-6 pb-6 sm:grid-cols-2 xl:grid-cols-4">
              <MetaTile icon={<CalendarDaysIcon />} label="Mulai" value={formatLongDateTime(tryout.startsAt)} />
              <MetaTile icon={<CalendarDaysIcon />} label="Selesai" value={formatLongDateTime(tryout.endsAt)} />
              <MetaTile icon={<ClockIcon />} label="Durasi total" value={formatDuration(tryout.totalDurationMinutes)} />
              <MetaTile icon={<BookOpenCheckIcon />} label="Komposisi" value={`${tryout.sectionCount} section, ${tryout.questionCount} soal`} />
            </CardContent>
          </Card>

          <Card className="h-fit rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheckIcon />
                Akses tryout
              </CardTitle>
              <CardDescription>
                Session hanya dibuat setelah tombol mulai ditekan.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="rounded-lg border bg-muted/35 p-4 text-sm leading-6 text-muted-foreground">
                {cta.description}
              </div>
              <StartTryoutButton
                tryoutSlug={tryout.slug}
                label={cta.label}
                disabled={cta.disabled}
                disabledMessage={cta.disabledMessage}
                locked={cta.locked}
              />
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <Card className="rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2">
                <RouteIcon />
                {tryout.sections.length} Kategori
                <Badge variant="soft">{tryout.examTypeName}</Badge>
              </CardTitle>
              <CardDescription>
                Section dikerjakan satu per satu dengan durasi masing-masing.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {tryout.sections.map((section) => (
                <div
                  key={section.id}
                  className="flex items-center justify-between gap-4 rounded-lg border bg-background/70 p-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                      {section.orderIndex}
                    </span>
                    <div className="min-w-0">
                      <p className="line-clamp-1 font-medium">{section.title}</p>
                      <p className="line-clamp-1 text-xs text-muted-foreground">
                        {section.subjectName} - {section.questionCount} soal
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="shrink-0 bg-muted/35">
                    <ClockIcon data-icon="inline-start" />
                    {section.durationMinutes} menit
                  </Badge>
                </div>
              ))}
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-secondary/60 px-4 py-3 text-sm font-medium">
                <span>Total durasi</span>
                <span>{formatDuration(tryout.totalDurationMinutes)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MedalIcon />
                Scoring
              </CardTitle>
              <CardDescription>
                Aturan nilai mengikuti konfigurasi tryout yang dipublikasikan.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <InfoRow label="Total soal" value={`${tryout.questionCount} soal`} />
              <InfoRow label="Total section" value={`${tryout.sectionCount} section`} />
              <InfoRow
                label="Penalti salah"
                value={tryout.wrongAnswerPenalty < 0 ? String(tryout.wrongAnswerPenalty) : "Tidak ada"}
              />
              <InfoRow
                label="Navigasi"
                value={tryout.navigationMode === "free" ? "Bebas" : "Berurutan"}
              />
            </CardContent>
          </Card>
        </section>

        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileTextIcon />
              Petunjuk & Aturan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-3 text-sm leading-6 text-muted-foreground sm:grid-cols-2">
              <RuleItem>Kerjakan tryout sesuai urutan section yang tersedia.</RuleItem>
              <RuleItem>Setiap section memiliki timer sendiri dan akan dikunci setelah selesai.</RuleItem>
              <RuleItem>Jawaban pada section yang sudah selesai tidak dapat diubah kembali.</RuleItem>
              <RuleItem>Satu akun hanya boleh memiliki satu session untuk tryout ini.</RuleItem>
              <RuleItem>Tidak ada re-attempt untuk tryout yang sama.</RuleItem>
              <RuleItem>
                Hasil, ranking, dan pembahasan mengikuti jadwal rilis serta akses plan.
              </RuleItem>
            </ul>
          </CardContent>
        </Card>
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
      <Badge variant="outline" className="border-chart-4/20 bg-chart-4/10 text-chart-4">
        <MedalIcon data-icon="inline-start" />
        Hasil Tersedia
      </Badge>
    )
  }

  const meta = {
    ongoing: {
      label: "Aktif",
      icon: <ClockIcon data-icon="inline-start" />,
      className: "border-chart-2/20 bg-chart-2/10 text-chart-2",
    },
    upcoming: {
      label: "Akan Datang",
      icon: <CalendarDaysIcon data-icon="inline-start" />,
      className: "border-chart-1/20 bg-chart-1/10 text-chart-1",
    },
    ended: {
      label: "Berakhir",
      icon: <CheckCircle2Icon data-icon="inline-start" />,
      className: "border-destructive/20 bg-destructive/10 text-destructive",
    },
  }[tryout.availabilityStatus]

  return (
    <Badge variant="outline" className={meta.className}>
      {meta.icon}
      {meta.label}
    </Badge>
  )
}

function MetaTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex min-h-24 flex-col gap-2 rounded-lg border bg-muted/30 p-3">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground [&_svg]:size-4">
        {icon}
        {label}
      </div>
      <p className="text-sm font-semibold leading-5">{value}</p>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/25 px-3 py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  )
}

function RuleItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3 rounded-lg border bg-muted/25 p-3">
      <CheckCircle2Icon className="mt-0.5 shrink-0 text-chart-2" />
      <span>{children}</span>
    </li>
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
      label: "Masuk untuk Mulai",
      description: "Kamu bisa membaca detail tryout sekarang. Login diperlukan saat mulai.",
      disabled: false,
      locked: false,
    }
  }

  if (!user.isEmailVerified) {
    return {
      label: "Verifikasi Email",
      description: "Verifikasi email diperlukan sebelum mengikuti tryout.",
      disabled: true,
      disabledMessage: "Verifikasi email dulu sebelum mulai tryout.",
      locked: true,
    }
  }

  if (userSession?.status === "in_progress") {
    return {
      label: "Lanjutkan Tryout",
      description: "Kamu sudah punya session berjalan. Sistem akan melanjutkan session yang sama.",
      disabled: false,
      locked: false,
    }
  }

  if (resultAvailable) {
    return {
      label: "Lihat Hasil",
      description: "Tryout sudah selesai dan hasilnya tersedia untuk dilihat.",
      disabled: false,
      locked: false,
    }
  }

  if (userSession?.status === "graded") {
    return {
      label: "Hasil Belum Rilis",
      description: "Tryout sudah selesai, tetapi hasil belum masuk jadwal rilis.",
      disabled: true,
      disabledMessage: "Hasil tryout belum tersedia.",
      locked: false,
    }
  }

  if (userSession) {
    return {
      label: "Session Sudah Ada",
      description: "Akun ini sudah pernah memulai tryout dan tidak bisa membuat re-attempt.",
      disabled: true,
      disabledMessage: "Tidak ada re-attempt untuk tryout yang sama.",
      locked: true,
    }
  }

  if (!accessAllowed) {
    return {
      label: "Upgrade untuk Akses",
      description: "Tryout premium tersedia untuk pengguna paket Pro atau Max.",
      disabled: true,
      disabledMessage: "Tryout premium tersedia untuk pengguna paket Pro atau Max.",
      locked: true,
    }
  }

  if (tryout.availabilityStatus === "upcoming") {
    return {
      label: "Belum Dimulai",
      description: "Tryout belum memasuki jadwal mulai.",
      disabled: true,
      disabledMessage: "Tryout belum dimulai.",
      locked: false,
    }
  }

  if (tryout.availabilityStatus === "ended") {
    return {
      label: "Tryout Berakhir",
      description: "Tryout sudah melewati waktu selesai dan tidak bisa dimulai.",
      disabled: true,
      disabledMessage: "Tryout sudah berakhir.",
      locked: false,
    }
  }

  return {
    label: "Mulai Tryout",
    description: "Pastikan koneksi stabil. Setelah dimulai, session tryout tidak bisa diulang.",
    disabled: false,
    locked: false,
  }
}
