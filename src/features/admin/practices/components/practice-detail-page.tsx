"use client"

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
import { Separator } from "@/components/ui/separator"
import { getModelEnumBadgeMeta } from "@/lib/model-enums"

import { archivePracticeAction, publishPracticeAction } from "../actions"
import type { PracticeDetails } from "../queries"
import { previewText } from "../utils/practice"

type PracticeDetailPageProps = {
  practice: PracticeDetails
}

type DialogType = "publish" | "archive" | null

function formatDateTime(value: Date | null) {
  if (!value) {
    return "-"
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value)
}

function formatModes(practice: PracticeDetails) {
  return [
    practice.hasPracticeMode ? "Practice" : null,
    practice.hasQuizMode ? "Quiz" : null,
  ]
    .filter(Boolean)
    .join(" + ") || "-"
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
        : await archivePracticeAction(practice.id)

    if (result.success) {
      toast.success(dialogType === "publish" ? "Practice published." : "Practice archived.")
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
          title: "Publish practice?",
          description:
            "This will publish the draft immediately. After publishing, practice settings and questions can no longer be edited.",
          action: "Publish",
          variant: "default" as const,
        }
      : {
          title: "Archive practice?",
          description:
            "Archived practices are final. Existing sessions remain available for review.",
          action: "Archive",
          variant: "destructive" as const,
        }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={practice.title}
        subtitle={`${practice.examTypeName} / ${practice.subjectName}`}
        actions={
          <div className="flex flex-wrap gap-2">
            {practice.status === "draft" ? (
              <>
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
              </>
            ) : null}
            {practice.status === "published" ? (
              <Button type="button" variant="destructive" onClick={() => setDialogType("archive")}>
                <ArchiveIcon data-icon="inline-start" />
                Archive
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>Publication, access, mode, and quiz timing.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="soft" className={statusBadge.className}>
                  {statusBadge.label}
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Access</span>
                <Badge variant={practice.isFree ? "secondary" : "outline"}>
                  {practice.isFree ? "Free" : "Paid"}
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Modes</span>
                <span className="font-medium">{formatModes(practice)}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Quiz duration</span>
                <span className="font-medium tabular-nums">
                  {practice.quizDurationMinutes ? `${practice.quizDurationMinutes} minutes` : "-"}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Exam type</span>
                <span className="text-right font-medium">{practice.examTypeName}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Subject</span>
                <span className="text-right font-medium">{practice.subjectName}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Topic</span>
                <span className="text-right font-medium">{practice.topicName ?? "-"}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Questions</span>
                <span className="font-medium tabular-nums">{practice.questionCount}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Sessions</span>
                <span className="font-medium tabular-nums">{practice.sessionCount}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Published</span>
                <span className="text-right">{formatDateTime(practice.publishedAt)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Questions</CardTitle>
            <CardDescription>Objective-only questions attached to this practice.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {practice.questions.length > 0 ? (
                practice.questions.map((question) => {
                  const typeBadge = getModelEnumBadgeMeta("questionType", question.questionType)
                  const statusBadgeMeta = getModelEnumBadgeMeta(
                    "contentStatus",
                    question.questionStatus,
                  )

                  return (
                    <div
                      key={question.id}
                      className="flex flex-col gap-3 rounded-lg border border-border/60 p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="line-clamp-1 font-medium text-foreground">
                          {previewText(question.questionTitle ?? question.questionContent)}
                        </p>
                        <p className="line-clamp-2 text-muted-foreground">
                          {previewText(question.questionContent)}
                        </p>
                        <p className="mt-1 text-muted-foreground">
                          #{question.orderIndex} / {question.subjectName} /{" "}
                          {question.topicName ?? "No topic"}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <Badge variant="soft" className={typeBadge.className}>
                          {typeBadge.label}
                        </Badge>
                        <Badge variant="soft" className={statusBadgeMeta.className}>
                          {statusBadgeMeta.label}
                        </Badge>
                        <Badge variant="outline">
                          {question.points ?? question.basePoints} pts
                        </Badge>
                        <Badge variant="outline">{question.year ?? "No year"}</Badge>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="rounded-lg border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                  No objective questions configured.
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
