import type { Metadata } from "next"

import { VouchersPage } from "@/features/admin/vouchers/components/vouchers-page"
import { getAdminVouchers } from "@/features/admin/vouchers/queries"

export const metadata: Metadata = {
  title: "Vouchers",
  description: "Manage vouchers to control checkout discounts and redemption rules.",
}

export default async function Page() {
  const vouchers = await getAdminVouchers()

  return <VouchersPage vouchers={vouchers} />
}
