import type { Metadata } from "next"

import { VouchersPage } from "@/features/admin/vouchers/components/vouchers-page"
import { getAdminVouchers } from "@/features/admin/vouchers/queries"

export const metadata: Metadata = {
  title: "Vouchers",
  description: "Manage checkout discount vouchers.",
}

export default async function Page() {
  const vouchers = await getAdminVouchers()

  return <VouchersPage vouchers={vouchers} />
}
