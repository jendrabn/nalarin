import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PracticeFormPage } from "@/features/admin/practices/components/practice-form-page"
import {
  getAdminPracticeLookups,
  getPracticeById,
} from "@/features/admin/practices/queries"

type EditPracticePageProps = {
  params: Promise<{
    practiceId: string
  }>
}

export async function generateMetadata({
  params,
}: EditPracticePageProps): Promise<Metadata> {
  const { practiceId } = await params
  const id = Number(practiceId)

  if (!Number.isFinite(id)) {
    return {
      title: "Edit Practice",
      description: "Update this practice to adjust its draft configuration.",
    }
  }

  const practice = await getPracticeById(id)

  return {
    title: practice ? `Edit ${practice.title}` : "Edit Practice",
    description: "Update this practice to adjust its draft configuration.",
  }
}

export default async function Page({ params }: EditPracticePageProps) {
  const { practiceId } = await params
  const id = Number(practiceId)

  if (!Number.isFinite(id)) {
    notFound()
  }

  const [lookups, practice] = await Promise.all([
    getAdminPracticeLookups(),
    getPracticeById(id),
  ])

  if (!practice) {
    notFound()
  }

  return (
    <PracticeFormPage
      mode="edit"
      practiceId={id}
      title={`Edit ${practice.title}`}
      description="Update this practice to adjust its draft configuration."
      backHref="/admin/practices"
      lookups={lookups}
      initialValues={practice}
    />
  )
}

