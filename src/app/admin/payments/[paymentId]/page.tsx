import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PaymentDetailPage } from "@/features/admin/payments/components/payment-detail-page"
import { getAdminPaymentById } from "@/features/admin/payments/queries"

type PaymentDetailPageProps = {
  params: Promise<{
    paymentId: string
  }>
}

export async function generateMetadata({
  params,
}: PaymentDetailPageProps): Promise<Metadata> {
  const { paymentId } = await params
  const id = Number(paymentId)

  if (!Number.isFinite(id)) {
    return {
      title: "Payment Details",
      description: "View payment details from the admin panel.",
    }
  }

  const payment = await getAdminPaymentById(id)

  return {
    title: payment ? `Payment #${payment.id}` : "Payment Details",
    description: payment
      ? `View payment, user, and subscription details for payment #${payment.id}.`
      : "View payment details from the admin panel.",
  }
}

export default async function Page({ params }: PaymentDetailPageProps) {
  const { paymentId } = await params
  const id = Number(paymentId)

  if (!Number.isFinite(id)) {
    notFound()
  }

  const payment = await getAdminPaymentById(id)

  if (!payment) {
    notFound()
  }

  return <PaymentDetailPage payment={payment} backHref="/admin/payments" />
}
