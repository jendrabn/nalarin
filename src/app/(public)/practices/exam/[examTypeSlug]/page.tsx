import type { Metadata } from "next"
import { notFound } from "next/navigation"

import type { PlanCode } from "@/config/plans"
import { getCurrentUser } from "@/features/auth/services/session"
import { getCurrentActiveSubscription } from "@/features/premium/queries"
import { PracticesPage } from "@/features/practices/components/practices-page"
import { getPracticeDiscoveryData } from "@/features/practices/queries"

type PracticeExamPageProps = {
  params: Promise<{ examTypeSlug: string }>
}

export async function generateMetadata({
  params,
}: PracticeExamPageProps): Promise<Metadata> {
  const { examTypeSlug } = await params
  const data = await getPracticeDiscoveryData()
  const examType = data.examTypes.find(
    (item) => item.slug === examTypeSlug,
  )

  if (!examType) {
    return {
      title: "Jenis latihan tidak ditemukan",
    }
  }

  const title = `Latihan Soal ${examType.name}`
  const description =
    examType.description ??
    `Latihan soal ${examType.name} berdasarkan mata pelajaran, topik, dan mode belajar di Nalarin.`

  return {
    title,
    description,
    alternates: {
      canonical: `/practices/exam/${examType.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `/practices/exam/${examType.slug}`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  }
}

export default async function Page({ params }: PracticeExamPageProps) {
  const { examTypeSlug } = await params
  const user = await getCurrentUser()
  const dataPromise = getPracticeDiscoveryData()
  const subscriptionPromise = user
    ? getCurrentActiveSubscription(user.id)
    : Promise.resolve(null)
  const [data, currentSubscription] = await Promise.all([
    dataPromise,
    subscriptionPromise,
  ])
  const examType = data.examTypes.find(
    (item) => item.slug === examTypeSlug,
  )

  if (!examType) {
    notFound()
  }

  const currentPlanCode: PlanCode = currentSubscription?.planCode ?? "free"
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Latihan Soal ${examType.name}`,
    url: `https://nalarin.id/practices/exam/${examType.slug}`,
    description:
      examType.description ??
      `Daftar latihan soal ${examType.name} yang tersedia di Nalarin.`,
    numberOfItems: data.practices.filter(
      (practice) => practice.examTypeId === examType.id,
    ).length,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <PracticesPage
        user={user}
        currentPlanCode={currentPlanCode}
        data={data}
        selectedExamTypeSlug={examType.slug}
      />
    </>
  )
}
