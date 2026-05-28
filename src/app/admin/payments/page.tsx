import type { Metadata } from "next"

import { PaymentsPage } from "@/features/admin/payments/components/payments-page"
import { getAdminPayments } from "@/features/admin/payments/queries"

export const metadata: Metadata = {
  title: "Payments",
  description: "Review Midtrans and manual payments.",
}

export default async function Page() {
  const payments = await getAdminPayments()

  return <PaymentsPage payments={payments} />
}
