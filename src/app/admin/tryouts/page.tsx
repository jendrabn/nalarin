import type { Metadata } from "next"

import { TryoutsPage } from "@/features/admin/tryouts/components/tryouts-page"
import { getTryouts } from "@/features/admin/tryouts/queries"

export const metadata: Metadata = {
  title: "Tryouts",
  description: "Manage tryouts to control schedules, access, scoring, and publication.",
}

export default async function Page() {
  const tryouts = await getTryouts()

  return <TryoutsPage tryouts={tryouts} />
}

