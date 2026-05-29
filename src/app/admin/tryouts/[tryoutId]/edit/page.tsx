import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { TryoutFormPage } from "@/features/admin/tryouts/components/tryout-form-page"
import { getAdminTryoutLookups, getTryoutById } from "@/features/admin/tryouts/queries"

type EditTryoutPageProps = {
  params: Promise<{
    tryoutId: string
  }>
}

export async function generateMetadata({
  params,
}: EditTryoutPageProps): Promise<Metadata> {
  const { tryoutId } = await params
  const id = Number(tryoutId)

  if (!Number.isFinite(id)) {
    return {
      title: "Edit Tryout",
      description: "Edit a tryout from the admin panel.",
    }
  }

  const tryout = await getTryoutById(id)

  return {
    title: tryout ? `Edit ${tryout.title}` : "Edit Tryout",
    description: tryout?.description ?? "Edit a tryout from the admin panel.",
  }
}

export default async function Page({ params }: EditTryoutPageProps) {
  const { tryoutId } = await params
  const id = Number(tryoutId)

  if (!Number.isFinite(id)) {
    notFound()
  }

  const [lookups, tryout] = await Promise.all([
    getAdminTryoutLookups(),
    getTryoutById(id),
  ])

  if (!tryout) {
    notFound()
  }

  return (
    <TryoutFormPage
      mode="edit"
      tryoutId={id}
      title={`Edit ${tryout.title}`}
      description="Update this tryout to refine the draft schedule and section setup."
      backHref="/admin/tryouts"
      lookups={lookups}
      initialValues={tryout}
    />
  )
}
