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

import { archiveTryoutAction, publishTryoutAction } from "../actions"
import type { TryoutDetails } from "../queries"
import { previewText } from "../utils/tryout"

type TryoutDetailPageProps = {
  tryout: TryoutDetails
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

export function TryoutDetailPage({ tryout }: TryoutDetailPageProps) {
  const router = useRouter()
  const [dialogType, setDialogType] = useState<DialogType>(null)
  const statusLabel = getModelEnumBadgeMeta("contentStatus", tryout.status).label

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
        subtitle={`${tryout.examTypeName} · ${tryout.slug}`}
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

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>Publication, access, schedule, and scoring summary.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium">{statusLabel}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Access</span>
                <span className="font-medium">{tryout.isFree ? "Free" : "Paid"}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Sections</span>
                <span className="font-medium tabular-nums">{tryout.sectionCount}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Questions</span>
                <span className="font-medium tabular-nums">{tryout.questionCount}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Sessions</span>
                <span className="font-medium tabular-nums">{tryout.sessionCount}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Starts</span>
                <span className="text-right">{formatDateTime(tryout.startsAt)}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Ends</span>
                <span className="text-right">{formatDateTime(tryout.endsAt)}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Published</span>
                <span className="text-right">{formatDateTime(tryout.publishedAt)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Penalty</span>
                <span className="font-medium tabular-nums">{tryout.wrongAnswerPenalty}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Navigation</span>
                <span className="font-medium">{tryout.navigationMode}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sections</CardTitle>
            <CardDescription>Section timing and attached questions.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {tryout.sections.length > 0 ? (
                tryout.sections.map((section) => (
                  <div key={section.id} className="rounded-lg border border-border/60 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h2 className="font-medium text-foreground">{section.title}</h2>
                        <p className="text-sm text-muted-foreground">
                          {section.subjectName} · {section.durationMinutes} minutes
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">{section.questionCount} questions</Badge>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-col gap-2">
                      {section.questions.map((question) => {
                        const typeBadge = getModelEnumBadgeMeta("questionType", question.questionType)
                        const statusBadgeMeta = getModelEnumBadgeMeta("contentStatus", question.questionStatus)

                        return (
                          <div
                            key={question.id}
                            className="flex flex-col gap-2 rounded-lg bg-muted/35 p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="min-w-0">
                              <p className="truncate font-medium text-foreground">
                                {previewText(question.questionTitle ?? question.questionContent)}
                              </p>
                              <p className="text-muted-foreground">
                                #{question.orderIndex} · {question.subjectName}
                              </p>
                            </div>
                            <div className="flex shrink-0 flex-wrap gap-2">
                              <Badge variant="soft" className={typeBadge.className}>
                                {typeBadge.label}
                              </Badge>
                              <Badge variant="soft" className={statusBadgeMeta.className}>
                                {statusBadgeMeta.label}
                              </Badge>
                              <Badge variant="outline">{question.points ?? question.basePoints} pts</Badge>
                            </div>
                          </div>
                        )
                      })}
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
