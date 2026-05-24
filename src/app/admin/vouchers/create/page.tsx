import type { Metadata } from "next"

import { VoucherFormPage } from "@/features/admin/vouchers/components/voucher-form-page"

export const metadata: Metadata = {
  title: "Create Voucher",
  description: "Create a checkout discount voucher.",
}

export default function Page() {
  return <VoucherFormPage />
}
