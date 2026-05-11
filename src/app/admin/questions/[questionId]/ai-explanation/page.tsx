import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { questionTypeLabels } from "@/features/admin/questions/constants"
import { getQuestionById } from "@/features/admin/questions/queries"
import { previewQuestionContent, stripHtml } from "@/features/admin/questions/utils/question"

type AiExplanationPageProps = {
  params: Promise<{
    questionId: string
  }>
}

export async function generateMetadata({
  params,
}: AiExplanationPageProps): Promise<Metadata> {
  const { questionId } = await params
  const id = Number(questionId)

  if (!Number.isFinite(id)) {
    return {
      title: "AI Explanation",
      description: "Review the AI explanation for a question.",
    }
  }

  const question = await getQuestionById(id)

  return {
    title: question ? `AI Explanation - ${question.title || `Question ${question.id}`}` : "AI Explanation",
    description:
      "Review the AI explanation stored for this question and open the editor if needed.",
  }
}

export default async function Page({ params }: AiExplanationPageProps) {
  const { questionId } = await params
  const id = Number(questionId)

  if (!Number.isFinite(id)) {
    notFound()
  }

  const question = await getQuestionById(id)

  if (!question) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="AI Explanation"
        subtitle="Review the stored explanation metadata for this question."
        actions={
          <Button asChild variant="outline">
            <Link href={`/admin/questions/${question.id}/edit`}>Back to Edit</Link>
          </Button>
        }
      />

      <Card>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2">
              {question.title || `Question ${question.id}`}
              <Badge variant="outline">{questionTypeLabels[question.type]}</Badge>
            </CardTitle>
          <CardDescription>{previewQuestionContent(stripHtml(question.content), 180)}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-border/60 p-4">
            <p className="text-sm font-medium text-foreground">AI Explanation</p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
              {question.aiExplanation ?? "No AI explanation stored for this question."}
            </p>
          </div>
          <div className="rounded-xl border border-border/60 p-4">
            <p className="text-sm font-medium text-foreground">Manual Explanation</p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
              {question.manualExplanation ?? "No manual explanation stored for this question."}
            </p>
          </div>
          <div className="rounded-xl border border-border/60 p-4 md:col-span-2">
            <p className="text-sm font-medium text-foreground">Grading Rubric</p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
              {question.gradingRubric ?? "No grading rubric stored for this question."}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
