import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { ExamTypeFormPage } from "@/features/admin/exam-types/components/exam-type-form-page"
import { getExamTypeById } from "@/features/admin/exam-types/queries"

type EditPageProps = {
  params: Promise<{
    examTypeId: string
  }>
}

export async function generateMetadata({
  params,
}: EditPageProps): Promise<Metadata> {
  const { examTypeId } = await params
  const id = Number(examTypeId)

  if (!Number.isFinite(id)) {
    return {
      title: "Edit Exam Type",
      description: "Update this exam type to refine branding, schedules, and package settings.",
    }
  }

  const examType = await getExamTypeById(id)

  return {
    title: examType ? `Edit ${examType.name}` : "Edit Exam Type",
    description: "Update this exam type to refine branding, schedules, and package settings.",
  }
}

export default async function Page({ params }: EditPageProps) {
  const { examTypeId } = await params
  const id = Number(examTypeId)

  if (!Number.isFinite(id)) {
    notFound()
  }

  const examType = await getExamTypeById(id)

  if (!examType) {
    notFound()
  }

  return (
    <ExamTypeFormPage
      mode="edit"
      examTypeId={id}
      title={`Edit ${examType.name}`}
      subtitle="Update this exam type to refine branding, schedules, and package settings."
      submitLabel="Save changes"
      backHref={`/admin/exam-types/${id}`}
      backLabel="Back to Exam Type"
      initialValues={examType}
    />
  )
}

