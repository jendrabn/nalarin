import { EmptyState } from "@/components/empty-state"
import { ExamTypeCard } from "@/components/exam-type-card"
import { SiteFooter } from "@/components/site-footer"
import { SiteNavbar, type SiteUser } from "@/components/site-navbar"
import { PageHeader } from "@/components/page-header"

import type { PublicTryoutDiscoveryData } from "../queries"

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
        <section className="mx-auto w-full max-w-7xl px-4 pt-6 pb-1 sm:px-6 lg:px-8">
          <PageHeader
            className="mb-0"
            title="Tryout"
            subtitle="Pilih tipe ujian untuk melihat daftar tryout, jadwal, dan hasil yang tersedia."
          />
        </section>

        <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pt-4 pb-8 sm:px-6 lg:px-8">
          {data.examTypes.length === 0 ? (
            <EmptyState title="Belum Ada Jenis Ujian" className="min-h-80" />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {data.examTypes.map((examType) => (
                <ExamTypeCard
                  key={examType.id}
                  href={`/tryouts/exam/${examType.slug}`}
                  logoUrl={examType.logoUrl}
                  name={examType.name}
                  description={examType.description}
                  descriptionFallback={`Tryout dan simulasi ujian untuk persiapan ${examType.name}.`}
                  count={data.tryouts.filter((tryout) => tryout.examTypeId === examType.id).length}
                  countLabel="Tryout"
                  actionLabel="Lihat Tryout"
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
