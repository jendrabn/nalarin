import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { SubjectsPage } from "@/features/admin/subjects/components/subjects-page"
import { getSubjectById, getSubjects } from "@/features/admin/subjects/queries"
import { getExamTypeLookups } from "@/features/admin/exam-types/queries"

type EditPageProps = {
  params: Promise<{
    subjectId: string
  }>
}

export async function generateMetadata({
  params,
}: EditPageProps): Promise<Metadata> {
  const { subjectId } = await params
  const id = Number(subjectId)

  if (!Number.isFinite(id)) {
    return {
      title: "Edit Subject",
      description: "Edit a subject from the admin panel.",
    }
  }

  const subject = await getSubjectById(id)

  return {
    title: subject ? `Edit ${subject.name}` : "Edit Subject",
    description:
      subject?.description ?? "Edit a subject from the admin panel.",
  }
}

export default async function Page({ params }: EditPageProps) {
  const { subjectId } = await params
  const id = Number(subjectId)

  if (!Number.isFinite(id)) {
    notFound()
  }

  const [subjects, examTypes, subject] = await Promise.all([
    getSubjects(),
    getExamTypeLookups(),
    getSubjectById(id),
  ])

  if (!subject) {
    notFound()
  }

  return (
    <SubjectsPage
      subjects={subjects}
      examTypes={examTypes}
      defaultEditSubject={subject}
      closeDestination="/admin/subjects"
    />
  )
}
