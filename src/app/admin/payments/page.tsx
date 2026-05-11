import type { Metadata } from "next"

import { PaymentsPage } from "@/features/admin/payments/components/payments-page"
import { getAdminPayments } from "@/features/admin/payments/queries"
import { getAdminUsers } from "@/features/admin/users/queries"

export const metadata: Metadata = {
  title: "Payments",
  description: "Review Midtrans and manual payments.",
}

export default async function Page() {
  const [payments, users] = await Promise.all([
    getAdminPayments(),
    getAdminUsers(),
  ])

  return (
    <PaymentsPage
      payments={payments}
      users={users.map(({ id, name, email, activePlanCode }) => ({
        id,
        name,
        email,
        activePlanCode,
      }))}
    />
  )
}
