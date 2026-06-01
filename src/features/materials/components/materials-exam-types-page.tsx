import { LayoutListIcon } from "lucide-react"

import { ExamTypeCard } from "@/components/exam-type-card"
import { SiteFooter } from "@/components/site-footer"
import { SiteNavbar, type SiteUser } from "@/components/site-navbar"
import { PageHeader } from "@/components/page-header"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

import type { CurrentUser } from "@/features/auth/services/session"

import type { PublicMaterialDiscoveryData } from "../queries"

type MaterialsExamTypesPageProps = {
  user: CurrentUser | null
  data: PublicMaterialDiscoveryData
}

export function MaterialsExamTypesPage({
  user,
  data,
}: MaterialsExamTypesPageProps) {
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
            title="Materi Pelajaran"
            subtitle="Pilih jenis ujian untuk membuka daftar materi video atau teks yang disusun per mata pelajaran."
          />
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
                  Materi pelajaran akan tampil setelah data exam type tersedia.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {data.examTypes.map((examType) => (
                <ExamTypeCard
                  key={examType.id}
                  href={`/materials/exam/${examType.slug}`}
                  logoUrl={examType.logoUrl}
                  name={examType.name}
                  description={examType.description}
                  descriptionFallback={`Materi video dan teks untuk persiapan ${examType.name}.`}
                  count={
                    data.materials.filter((material) => material.examTypeId === examType.id)
                      .length
                  }
                  countLabel="Materi"
                  actionLabel="Lihat Materi"
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
