import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { absoluteUrl } from "@/features/blog/utils"
import { getCurrentUser } from "@/features/auth/services/session"
import { getCurrentActiveSubscriptions } from "@/features/premium/queries"
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
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const title = `Latihan Soal ${examType.name}`
  const description =
    examType.description ??
    `Latihan soal ${examType.name} berdasarkan mata pelajaran, topik, dan Mode Latihan atau Mode Quiz di Nalarin.id.`

  return {
    title,
    description,
    alternates: {
      canonical: `/practices/exam/${examType.slug}`,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      title,
      description,
      url: `/practices/exam/${examType.slug}`,
      siteName: "Nalarin.id",
      type: "website",
      locale: "id_ID",
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
    ? getCurrentActiveSubscriptions(user.id)
    : Promise.resolve([])
  const [data, currentSubscriptions] = await Promise.all([
    dataPromise,
    subscriptionPromise,
  ])
  const examType = data.examTypes.find(
    (item) => item.slug === examTypeSlug,
  )

  if (!examType) {
    notFound()
  }

  const premiumExamTypeIds = currentSubscriptions.map(
    (subscription) => subscription.examTypeId,
  )
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Latihan Soal ${examType.name}`,
    url: absoluteUrl(`/practices/exam/${examType.slug}`),
    description:
      examType.description ??
      `Daftar latihan soal ${examType.name} yang tersedia di Nalarin.id.`,
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
        premiumExamTypeIds={premiumExamTypeIds}
        data={data}
        selectedExamTypeSlug={examType.slug}
      />
    </>
  )
}
