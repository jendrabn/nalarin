import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { SubscriberDetailPage } from "@/features/admin/subscribers/components/subscriber-detail-page"
import { getAdminSubscriptionById } from "@/features/admin/subscribers/queries"

type SubscriberDetailPageProps = {
  params: Promise<{
    subscriptionId: string
  }>
}

export async function generateMetadata({
  params,
}: SubscriberDetailPageProps): Promise<Metadata> {
  const { subscriptionId } = await params
  const id = Number(subscriptionId)

  if (!Number.isFinite(id)) {
    return {
      title: "Subscriber Details",
      description: "View subscription details from the admin panel.",
    }
  }

  const subscription = await getAdminSubscriptionById(id)

  return {
    title: subscription ? `${subscription.userName} - Subscriber Details` : "Subscriber Details",
    description: subscription
      ? `View the subscription, payment, and cancellation details for ${subscription.userName}.`
      : "View subscription details from the admin panel.",
  }
}

export default async function Page({ params }: SubscriberDetailPageProps) {
  const { subscriptionId } = await params
  const id = Number(subscriptionId)

  if (!Number.isFinite(id)) {
    notFound()
  }

  const subscription = await getAdminSubscriptionById(id)

  if (!subscription) {
    notFound()
  }

  return <SubscriberDetailPage subscription={subscription} backHref="/admin/subscribers" />
}
