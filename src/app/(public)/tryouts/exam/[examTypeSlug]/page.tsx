import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { absoluteUrl } from "@/features/blog/utils"
import { getCurrentUser } from "@/features/auth/services/session"
import { getCurrentActiveSubscriptions } from "@/features/premium/queries"
import { TryoutsPage } from "@/features/tryouts/components/tryouts-page"
import { getPublicTryoutDiscoveryData } from "@/features/tryouts/queries"

type TryoutExamPageProps = {
  params: Promise<{ examTypeSlug: string }>
}

export async function generateMetadata({
  params,
}: TryoutExamPageProps): Promise<Metadata> {
  const { examTypeSlug } = await params
  const data = await getPublicTryoutDiscoveryData()
  const examType = data.examTypes.find(
    (item) => item.slug === examTypeSlug,
  )

  if (!examType) {
    return {
      title: "Jenis tryout tidak ditemukan",
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const title = `Tryout ${examType.name}`
  const description =
    examType.description ??
    `Lihat jadwal tryout ${examType.name}, status pengerjaan, durasi, dan akses di Nalarin.id.`

  return {
    title,
    description,
    alternates: {
      canonical: `/tryouts/exam/${examType.slug}`,
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
      url: `/tryouts/exam/${examType.slug}`,
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

export default async function Page({ params }: TryoutExamPageProps) {
  const { examTypeSlug } = await params
  const user = await getCurrentUser()
  const dataPromise = getPublicTryoutDiscoveryData(user?.id)
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
    name: `Tryout ${examType.name}`,
    url: absoluteUrl(`/tryouts/exam/${examType.slug}`),
    description:
      examType.description ??
      `Daftar tryout ${examType.name} yang tersedia di Nalarin.id.`,
    numberOfItems: data.tryouts.filter(
      (tryout) => tryout.examTypeId === examType.id,
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
      <TryoutsPage
        user={
          user
            ? {
                id: user.id,
                name: user.name,
                email: user.email,
                avatarUrl: user.avatarUrl,
                role: user.role,
                isEmailVerified: Boolean(user.emailVerifiedAt),
              }
            : null
        }
        premiumExamTypeIds={premiumExamTypeIds}
        data={data}
        selectedExamTypeSlug={examType.slug}
      />
    </>
  )
}
