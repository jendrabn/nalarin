import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { VoucherDetailPage } from "@/features/admin/vouchers/components/voucher-detail-page"
import { getAdminVoucherById } from "@/features/admin/vouchers/queries"

type PageProps = {
  params: Promise<{
    voucherId: string
  }>
}

export const metadata: Metadata = {
  title: "Voucher Detail",
  description: "Review this voucher to verify discount rules and redemption history.",
}

export default async function Page({ params }: PageProps) {
  const { voucherId } = await params
  const id = Number(voucherId)

  if (!Number.isInteger(id) || id <= 0) {
    notFound()
  }

  const voucher = await getAdminVoucherById(id)

  if (!voucher) {
    notFound()
  }

  return <VoucherDetailPage voucher={voucher} />
}
