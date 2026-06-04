import { EmptyState } from "@/components/empty-state"
import { ExamTypeCard } from "@/components/exam-type-card"
import { SiteFooter } from "@/components/site-footer"
import { SiteNavbar, type SiteUser } from "@/components/site-navbar"
import { PageHeader } from "@/components/page-header"
import type { CurrentUser } from "@/features/auth/services/session"

import type { PracticeDiscoveryData } from "../queries"

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
        <section className="mx-auto w-full max-w-7xl px-4 pt-6 pb-1 sm:px-6 lg:px-8">
          <PageHeader
            className="mb-0"
            title="Latihan Soal"
            subtitle="Pilih jenis ujian, mata pelajaran, dan topik untuk memulai latihan yang lebih terarah."
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
                  href={`/practices/exam/${examType.slug}`}
                  logoUrl={examType.logoUrl}
                  name={examType.name}
                  description={examType.description}
                  descriptionFallback={`Latihan soal dan mata pelajaran untuk persiapan ${examType.name}.`}
                  count={
                    data.practices.filter((practice) => practice.examTypeId === examType.id)
                      .length
                  }
                  countLabel="Latihan"
                  actionLabel="Lihat Latihan"
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
