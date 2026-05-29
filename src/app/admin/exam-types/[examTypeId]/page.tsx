import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { ExamTypeDetailPage } from "@/features/admin/exam-types/components/exam-type-detail-page"
import { getExamTypeById } from "@/features/admin/exam-types/queries"

type ExamTypeDetailPageProps = {
  params: Promise<{
    examTypeId: string
  }>
}

export async function generateMetadata({
  params,
}: ExamTypeDetailPageProps): Promise<Metadata> {
  const { examTypeId } = await params
  const id = Number(examTypeId)

  if (!Number.isFinite(id)) {
    return {
      title: "Exam Type Details",
      description: "Review exam type details to audit package settings and public information.",
    }
  }

  const examType = await getExamTypeById(id)

  return {
    title: examType ? `${examType.name} - Exam Type Details` : "Exam Type Details",
    description: "Review exam type details to audit package settings and public information.",
  }
}

export default async function Page({ params }: ExamTypeDetailPageProps) {
  const { examTypeId } = await params
  const id = Number(examTypeId)

  if (!Number.isFinite(id)) {
    notFound()
  }

  const examType = await getExamTypeById(id)

  if (!examType) {
    notFound()
  }

  return <ExamTypeDetailPage examType={examType} backHref="/admin/exam-types" />
}

