import type { Metadata } from "next"

import { PracticesPage } from "@/features/admin/practices/components/practices-page"
import { getPractices } from "@/features/admin/practices/queries"

export const metadata: Metadata = {
  title: "Practices",
  description: "Manage practices and quizzes from the admin panel.",
}

export default async function Page() {
  const practices = await getPractices()

  return <PracticesPage practices={practices} />
}
