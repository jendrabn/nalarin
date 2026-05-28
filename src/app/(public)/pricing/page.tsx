import type { Metadata } from "next"

import { getCurrentUser } from "@/features/auth/services/session"
import { PremiumPage } from "@/features/premium/components/premium-page"
import { buildSeoMetadata } from "@/lib/seo"

export const metadata: Metadata = buildSeoMetadata({
  title: "Paket Belajar Per Tipe Ujian",
  description:
    "Pilih paket premium berdasarkan tipe ujian untuk membuka latihan, tryout, ranking, dan pembahasan AI sesuai fokus belajarmu di Nalarin.id.",
  path: "/pricing",
  keywords: [
    "paket CPNS",
    "paket UTBK",
    "paket SIMAK UI",
    "paket UTUL UGM",
    "latihan soal",
    "tryout",
    "pembahasan",
    "Nalarin.id",
  ],
});

export default async function Page() {
  const user = await getCurrentUser()

  return <PremiumPage user={user} />
}
