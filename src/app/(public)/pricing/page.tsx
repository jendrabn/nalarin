import type { Metadata } from "next"

import { getCurrentUser } from "@/features/auth/services/session"
import { PremiumPage } from "@/features/premium/components/premium-page"

export const metadata: Metadata = {
  title: "Premium",
  description: "Pilih paket Pro atau Max untuk membuka akses belajar premium.",
}

export default async function Page() {
  const user = await getCurrentUser()

  return <PremiumPage user={user} />
}
