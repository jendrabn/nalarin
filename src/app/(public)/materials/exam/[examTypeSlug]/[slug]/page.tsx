import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { stripHtml, truncateText } from "@/features/blog/utils"
import { getCurrentUser } from "@/features/auth/services/session"
import { getCurrentActiveSubscription } from "@/features/premium/queries"
import { MaterialDetailPage } from "@/features/materials/components/material-detail-page"
import { getPublishedMaterialByExamTypeAndSlug } from "@/features/materials/queries"

type MaterialDetailPageProps = {
  params: Promise<{ examTypeSlug: string; slug: string }>
}

export async function generateMetadata({
  params,
}: MaterialDetailPageProps): Promise<Metadata> {
  const { examTypeSlug, slug } = await params
  const material = await getPublishedMaterialByExamTypeAndSlug(examTypeSlug, slug)

  if (!material) {
    return {
      title: "Materi tidak ditemukan",
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const description = getMaterialDescription(material.excerpt, material.content, material.title)

  return {
    title: material.title,
    description,
    alternates: {
      canonical: `/materials/exam/${material.examTypeSlug}/${material.slug}`,
    },
    openGraph: {
      title: material.title,
      description,
      url: `/materials/exam/${material.examTypeSlug}/${material.slug}`,
      siteName: "Nalarin.id",
      type: "article",
      locale: "id_ID",
    },
    twitter: {
      card: "summary_large_image",
      title: material.title,
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

export default async function Page({ params }: MaterialDetailPageProps) {
  const { examTypeSlug, slug } = await params
  const material = await getPublishedMaterialByExamTypeAndSlug(examTypeSlug, slug)

  if (!material) {
    notFound()
  }

  const user = await getCurrentUser()
  const currentSubscription = user
    ? await getCurrentActiveSubscription(user.id, material.examTypeId)
    : null

  return (
    <MaterialDetailPage
      user={user}
      hasPremiumAccess={Boolean(currentSubscription)}
      material={material}
    />
  )
}

function getMaterialDescription(
  excerpt: string | null,
  content: string | null,
  title: string,
) {
  const excerptText = excerpt?.trim()

  if (excerptText && excerptText !== title && excerptText.length >= 80) {
    return excerptText
  }

  const contentText = content ? truncateText(stripHtml(content), 155) : ""

  if (contentText && contentText !== title && contentText.length >= 80) {
    return contentText
  }

  return `Materi ${title} di Nalarin.id untuk belajar yang lebih terarah dan fleksibel.`
}

