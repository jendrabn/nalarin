import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { ExamTypesPage } from "@/features/admin/academics/components/exam-types-page"
import { getExamTypeById, getExamTypes } from "@/features/admin/academics/queries"

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
      description: "Edit a seeded exam type from the admin panel.",
    }
  }

  const examType = await getExamTypeById(id)

  return {
    title: examType ? `Edit ${examType.name}` : "Edit Exam Type",
    description:
      examType?.description ?? "Edit a seeded exam type from the admin panel.",
  }
}

export default async function Page({ params }: EditPageProps) {
  const { examTypeId } = await params
  const id = Number(examTypeId)

  if (!Number.isFinite(id)) {
    notFound()
  }

  const [examTypes, examType] = await Promise.all([
    getExamTypes(),
    getExamTypeById(id),
  ])

  if (!examType) {
    notFound()
  }

  return (
    <ExamTypesPage
      examTypes={examTypes}
      defaultEditExamType={examType}
      closeDestination="/admin/exam-types"
    />
  )
}
