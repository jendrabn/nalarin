import type { Metadata } from "next"

import { PaymentsPage } from "@/features/admin/payments/components/payments-page"
import { getAdminPayments } from "@/features/admin/payments/queries"

export const metadata: Metadata = {
  title: "Payments",
  description: "Review payments to approve pending transactions and track billing status.",
}

export default async function Page() {
  const payments = await getAdminPayments()

  return <PaymentsPage payments={payments} />
}
