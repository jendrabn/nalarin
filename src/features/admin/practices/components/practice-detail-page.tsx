"use client"

import type { ReactNode } from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArchiveIcon, PencilLineIcon, RocketIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/page-header"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getModelEnumBadgeMeta } from "@/lib/model-enums"
import { formatAdminDateTime } from "@/lib/format"

import { archivePracticeAction, deletePracticeAction, publishPracticeAction } from "../actions"
import { QuestionPreviewCard } from "../../components/question-preview-card"
import type { PracticeDetails } from "../queries"

type PracticeDetailPageProps = {
  practice: PracticeDetails
}

type DialogType = "publish" | "archive" | "delete" | null

function DetailItem({
  label,
  value,
}: {
  label: string
  value: ReactNode
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-sm font-medium text-foreground">{value}</div>
    </div>
  )
}

export function PracticeDetailPage({ practice }: PracticeDetailPageProps) {
  const router = useRouter()
  const [dialogType, setDialogType] = useState<DialogType>(null)
  const statusBadge = getModelEnumBadgeMeta("contentStatus", practice.status)

  async function handleConfirm() {
    if (!dialogType) {
      return
    }

    const result =
      dialogType === "publish"
        ? await publishPracticeAction(practice.id)
        : dialogType === "archive"
          ? await archivePracticeAction(practice.id)
          : await deletePracticeAction(practice.id)

    if (result.success) {
      toast.success(
        dialogType === "publish"
          ? "Practice published."
          : dialogType === "archive"
            ? "Practice archived."
            : "Practice deleted.",
      )
      setDialogType(null)
      if (dialogType === "delete") {
        router.push("/admin/practices")
        router.refresh()
        return
      }
      router.refresh()
      return
    }

    toast.error(result.message)
    setDialogType(null)
  }

  const dialogCopy =
    dialogType === "publish"
      ? {
          title: "Publish practice?",
          description:
            "This will publish the practice immediately using the current data.",
          action: "Publish",
          variant: "default" as const,
        }
      : dialogType === "archive"
        ? {
          title: "Archive practice?",
          description:
            "Archived practices are final. Existing sessions remain available for review.",
          action: "Archive",
          variant: "destructive" as const,
        }
        : {
          title: "Delete practice?",
          description:
            "This action cannot be undone. Practices with sessions cannot be deleted.",
          action: "Delete",
          variant: "destructive" as const,
        }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={practice.title}
        subtitle="Review this practice to inspect its configuration and content."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href={`/admin/practices/${practice.id}/edit`}>
                <PencilLineIcon data-icon="inline-start" />
                Edit
              </Link>
            </Button>
            <Button type="button" onClick={() => setDialogType("publish")}>
              <RocketIcon data-icon="inline-start" />
              Publish
            </Button>
            <Button type="button" variant="destructive" onClick={() => setDialogType("archive")}>
              <ArchiveIcon data-icon="inline-start" />
              Archive
            </Button>
            <Button type="button" variant="destructive" onClick={() => setDialogType("delete")}>
              <Trash2Icon data-icon="inline-start" />
              Delete
            </Button>
          </div>
        }
      />

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>Publication, access, timing, and content summary.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {practice.description ? (
              <div className="rounded-lg border border-border/60 bg-muted/20 p-4 text-sm leading-7 text-muted-foreground">
                {practice.description}
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <DetailItem
                label="Status"
                value={
                  <Badge variant="soft" className={statusBadge.className}>
                    {statusBadge.label}
                  </Badge>
                }
              />
              <DetailItem
                label="Access"
                value={<Badge variant={practice.isFree ? "secondary" : "outline"}>{practice.isFree ? "Free" : "Paid"}</Badge>}
              />
              <DetailItem
                label="Quiz duration"
                value={practice.quizDurationMinutes ? `${practice.quizDurationMinutes} minutes` : "-"}
              />
              <DetailItem label="Exam type" value={practice.examTypeName} />
              <DetailItem label="Subject" value={practice.subjectName} />
              <DetailItem label="Topic" value={practice.topicName ?? "-"} />
              <DetailItem label="Questions" value={practice.questionCount} />
              <DetailItem label="Sessions" value={practice.sessionCount} />
              <DetailItem label="Published" value={formatAdminDateTime(practice.publishedAt)} />
              <DetailItem label="Slug" value={<span className="break-all font-mono text-xs">{practice.slug}</span>} />
              <DetailItem label="Created" value={formatAdminDateTime(practice.createdAt)} />
              <DetailItem label="Updated" value={formatAdminDateTime(practice.updatedAt)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Questions</CardTitle>
            <CardDescription>Preview of each question with answer highlighting.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 xl:grid-cols-2">
              {practice.questions.length > 0 ? (
                practice.questions.map((question) => (
                  <QuestionPreviewCard
                    key={question.id}
                    question={{
                      id: question.id,
                      orderLabel: `Soal ${question.orderIndex}`,
                      title: question.questionTitle,
                      content: question.questionContent,
                      imageUrl: question.questionImageUrl,
                      explanation: question.explanation,
                      type: question.questionType,
                      status: question.questionStatus,
                      subjectName: question.subjectName,
                      topicName: question.topicName,
                      year: question.year,
                      points: question.points ?? question.basePoints,
                      correctAnswerText: question.correctAnswerText,
                      options: question.options,
                    }}
                  />
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                  No questions configured.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog
        open={Boolean(dialogType)}
        onOpenChange={(open) => {
          if (!open) {
            setDialogType(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogCopy.title}</AlertDialogTitle>
            <AlertDialogDescription>{dialogCopy.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                type="button"
                variant={dialogCopy.variant === "destructive" ? "destructive-solid" : "default"}
                onClick={() => void handleConfirm()}
              >
                {dialogCopy.action}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
