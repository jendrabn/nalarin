import type { Metadata } from "next"

import { getCurrentUser } from "@/features/auth/services/session"
import { PremiumPage } from "@/features/premium/components/premium-page"
import { buildSeoMetadata } from "@/lib/seo"

export const metadata: Metadata = buildSeoMetadata({
  title: "Paket Premium Belajar",
  description:
    "Bandingkan Free, Pro, dan Max untuk membuka latihan lebih luas, tryout, ranking, pembahasan, dan progress tracking di Nalarin.id.",
  path: "/pricing",
  keywords: [
    "paket premium",
    "Pro",
    "Max",
    "latihan soal",
    "tryout",
    "pembahasan",
    "progress tracking",
    "Nalarin.id",
  ],
});

export default async function Page() {
  const user = await getCurrentUser()

  return <PremiumPage user={user} />
}
