import type { Metadata } from "next"

import { getCurrentUser } from "@/features/auth/services/session"
import { MaterialsExamTypesPage } from "@/features/materials/components/materials-exam-types-page"
import { getPublicMaterialDiscoveryData } from "@/features/materials/queries"

export const metadata: Metadata = {
  title: "Materi Pelajaran",
  description:
    "Pilih jenis ujian untuk membuka materi video dan teks yang tersusun per mata pelajaran di Nalarin.id.",
  alternates: {
    canonical: "/materials",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
}

export default async function Page() {
  const [user, data] = await Promise.all([
    getCurrentUser(),
    getPublicMaterialDiscoveryData(),
  ])

  return <MaterialsExamTypesPage user={user} data={data} />
}
