import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { getCurrentUser } from "@/features/auth/services/session"
import { getCurrentActiveSubscriptions } from "@/features/premium/queries"
import { MaterialsPage } from "@/features/materials/components/materials-page"
import { getPublicMaterialDiscoveryData } from "@/features/materials/queries"

type MaterialExamPageProps = {
  params: Promise<{ examTypeSlug: string }>
}

export async function generateMetadata({
  params,
}: MaterialExamPageProps): Promise<Metadata> {
  const { examTypeSlug } = await params
  const data = await getPublicMaterialDiscoveryData()
  const examType = data.examTypes.find((item) => item.slug === examTypeSlug)

  if (!examType) {
    return {
      title: "Jenis materi tidak ditemukan",
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const title = `Materi ${examType.name}`
  const description =
    examType.description ??
    `Daftar materi video dan teks ${examType.name} berdasarkan mata pelajaran di Nalarin.id.`

  return {
    title,
    description,
    alternates: {
      canonical: `/materials/exam/${examType.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `/materials/exam/${examType.slug}`,
      siteName: "Nalarin.id",
      type: "website",
      locale: "id_ID",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
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
  }
}

export default async function Page({ params }: MaterialExamPageProps) {
  const { examTypeSlug } = await params
  const user = await getCurrentUser()
  const [data, currentSubscriptions] = await Promise.all([
    getPublicMaterialDiscoveryData(),
    user ? getCurrentActiveSubscriptions(user.id) : Promise.resolve([]),
  ])
  const examType = data.examTypes.find((item) => item.slug === examTypeSlug)

  if (!examType) {
    notFound()
  }

  const premiumExamTypeIds = currentSubscriptions.map(
    (subscription) => subscription.examTypeId,
  )

  return (
    <MaterialsPage
      user={user}
      premiumExamTypeIds={premiumExamTypeIds}
      data={data}
      selectedExamTypeSlug={examType.slug}
    />
  )
}
