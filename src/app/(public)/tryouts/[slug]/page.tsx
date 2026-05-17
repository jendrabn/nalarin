import type { Metadata } from "next"
import { notFound } from "next/navigation"

import type { PlanCode } from "@/config/plans"
import { getCurrentUser } from "@/features/auth/services/session"
import { getCurrentActiveSubscription } from "@/features/premium/queries"
import { TryoutDetailPage } from "@/features/tryouts/components/tryout-detail-page"
import {
  getPublicTryoutBySlug,
  getUserTryoutSessionForTryout,
} from "@/features/tryouts/queries"

type TryoutPageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: TryoutPageProps): Promise<Metadata> {
  const { slug } = await params
  const tryout = await getPublicTryoutBySlug(slug)

  if (!tryout) {
    return {
      title: "Tryout tidak ditemukan",
    }
  }

  const description =
    tryout.description ??
    `Detail tryout ${tryout.examTypeName} dengan ${tryout.sectionCount} subtes dan ${tryout.questionCount} soal.`

  return {
    title: tryout.title,
    description,
    alternates: {
      canonical: `/tryouts/${tryout.slug}`,
    },
    openGraph: {
      title: tryout.title,
      description,
      url: `/tryouts/${tryout.slug}`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: tryout.title,
      description,
    },
  }
}

export default async function Page({ params }: TryoutPageProps) {
  const { slug } = await params
  const tryout = await getPublicTryoutBySlug(slug)

  if (!tryout) {
    notFound()
  }

  const user = await getCurrentUser()
  const subscriptionPromise = user
    ? getCurrentActiveSubscription(user.id)
    : Promise.resolve(null)
  const userSessionPromise = user
    ? getUserTryoutSessionForTryout(user.id, tryout.id)
    : Promise.resolve(null)
  const [currentSubscription, userSession] = await Promise.all([
    subscriptionPromise,
    userSessionPromise,
  ])
  const currentPlanCode: PlanCode = currentSubscription?.planCode ?? "free"
  const serverNow = new Date().toISOString()
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: tryout.title,
    description: tryout.description,
    provider: {
      "@type": "Organization",
      name: "Nalarin.id",
      sameAs: "https://nalarin.id",
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <TryoutDetailPage
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
        currentPlanCode={currentPlanCode}
        tryout={tryout}
        userSession={userSession}
        serverNow={serverNow}
      />
    </>
  )
}
