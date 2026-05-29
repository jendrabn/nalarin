"use client"

import type { ReactNode } from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArchiveIcon, PencilLineIcon, RocketIcon } from "lucide-react"
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

import { archiveTryoutAction, publishTryoutAction } from "../actions"
import { QuestionPreviewCard } from "../../components/question-preview-card"
import type { TryoutDetails } from "../queries"

type TryoutDetailPageProps = {
  tryout: TryoutDetails
}

type DialogType = "publish" | "archive" | null

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

export function TryoutDetailPage({ tryout }: TryoutDetailPageProps) {
  const router = useRouter()
  const [dialogType, setDialogType] = useState<DialogType>(null)
  const statusBadge = getModelEnumBadgeMeta("contentStatus", tryout.status)
  const navigationBadge = getModelEnumBadgeMeta("navigationMode", tryout.navigationMode)

  async function handleConfirm() {
    if (!dialogType) {
      return
    }

    const result =
      dialogType === "publish"
        ? await publishTryoutAction(tryout.id)
        : await archiveTryoutAction(tryout.id)

    if (result.success) {
      toast.success(dialogType === "publish" ? "Tryout published." : "Tryout archived.")
      setDialogType(null)
      router.refresh()
      return
    }

    toast.error(result.message)
    setDialogType(null)
  }

  const dialogCopy =
    dialogType === "publish"
      ? {
          title: "Publish tryout?",
          description:
            "This will publish the draft immediately and set published_at once. After publishing, every tryout field is locked permanently.",
          action: "Publish",
          variant: "default" as const,
        }
      : {
          title: "Archive tryout?",
          description:
            "Archived tryouts are final. Existing user sessions remain available for review.",
          action: "Archive",
          variant: "destructive" as const,
        }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={tryout.title}
        subtitle="Review this tryout to inspect its configuration and section layout."
        actions={
          <div className="flex flex-wrap gap-2">
            {tryout.status === "draft" ? (
              <>
                <Button asChild variant="outline">
                  <Link href={`/admin/tryouts/${tryout.id}/edit`}>
                    <PencilLineIcon data-icon="inline-start" />
                    Edit
                  </Link>
                </Button>
                <Button type="button" onClick={() => setDialogType("publish")}>
                  <RocketIcon data-icon="inline-start" />
                  Publish
                </Button>
              </>
            ) : null}
            {tryout.status === "published" ? (
              <Button type="button" variant="destructive" onClick={() => setDialogType("archive")}>
                <ArchiveIcon data-icon="inline-start" />
                Archive
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>
              Publication, access, schedule, scoring, and configuration summary.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {tryout.description ? (
              <div className="rounded-lg border border-border/60 bg-muted/20 p-4 text-sm leading-7 text-muted-foreground">
                {tryout.description}
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
                value={<Badge variant={tryout.isFree ? "secondary" : "outline"}>{tryout.isFree ? "Free" : "Paid"}</Badge>}
              />
              <DetailItem label="Exam type" value={tryout.examTypeName} />
              <DetailItem label="Sections" value={tryout.sectionCount} />
              <DetailItem label="Questions" value={tryout.questionCount} />
              <DetailItem label="Sessions" value={tryout.sessionCount} />
              <DetailItem label="Starts" value={formatAdminDateTime(tryout.startsAt)} />
              <DetailItem label="Ends" value={formatAdminDateTime(tryout.endsAt)} />
              <DetailItem label="Published" value={formatAdminDateTime(tryout.publishedAt)} />
              <DetailItem
                label="Result release"
                value={tryout.resultReleaseAt ? formatAdminDateTime(tryout.resultReleaseAt) : "-"}
              />
              <DetailItem
                label="Ranking release"
                value={tryout.rankingReleaseAt ? formatAdminDateTime(tryout.rankingReleaseAt) : "-"}
              />
              <DetailItem
                label="Explanation release"
                value={
                  tryout.explanationReleaseAt
                    ? formatAdminDateTime(tryout.explanationReleaseAt)
                    : "-"
                }
              />
              <DetailItem
                label="Review before submit"
                value={tryout.allowReviewBeforeSubmit ? "Enabled" : "Disabled"}
              />
              <DetailItem
                label="Show result"
                value={tryout.showResultAfterSubmit ? "Enabled" : "Disabled"}
              />
              <DetailItem
                label="Show ranking"
                value={tryout.showRankingAfterSubmit ? "Enabled" : "Disabled"}
              />
              <DetailItem
                label="Show explanation"
                value={tryout.showExplanationAfterSubmit ? "Enabled" : "Disabled"}
              />
              <DetailItem
                label="Shuffle questions"
                value={tryout.shuffleQuestions ? "Enabled" : "Disabled"}
              />
              <DetailItem
                label="Shuffle options"
                value={tryout.shuffleOptions ? "Enabled" : "Disabled"}
              />
              <DetailItem
                label="Enforce end time"
                value={tryout.enforceEndTime ? "Enabled" : "Disabled"}
              />
              <DetailItem label="Penalty" value={tryout.wrongAnswerPenalty} />
              <DetailItem
                label="Navigation"
                value={
                  <Badge variant="soft" className={navigationBadge.className}>
                    {navigationBadge.label}
                  </Badge>
                }
              />
              <DetailItem label="Slug" value={<span className="break-all font-mono text-xs">{tryout.slug}</span>} />
              <DetailItem label="Created" value={formatAdminDateTime(tryout.createdAt)} />
              <DetailItem label="Updated" value={formatAdminDateTime(tryout.updatedAt)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sections</CardTitle>
            <CardDescription>Section timing and question previews.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {tryout.sections.length > 0 ? (
                tryout.sections.map((section) => (
                  <div key={section.id} className="rounded-xl border border-border/60 bg-card p-4">
                    <div className="flex flex-col gap-3 border-b border-border/60 pb-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <h2 className="text-base font-semibold text-foreground">{section.title}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {section.subjectName} / {section.durationMinutes} minutes
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">{section.questionCount} questions</Badge>
                        {section.wrongAnswerPenalty !== null ? (
                          <Badge variant="outline">Penalty {section.wrongAnswerPenalty}</Badge>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 xl:grid-cols-2">
                      {section.questions.map((question) => (
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
                            year: null,
                            points: question.points ?? question.basePoints,
                            correctAnswerText: question.correctAnswerText,
                            options: question.options,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                  No sections configured.
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
