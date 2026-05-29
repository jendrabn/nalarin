"use client"

import Image from "next/image"
import Link from "next/link"
import type { ReactNode } from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeftIcon, PencilLineIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/page-header"
import { TaxonomyLogo } from "@/components/taxonomy-logo"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { formatAdminDateTime, formatCurrencyIDR } from "@/lib/format"
import { getPackageFinalPrice } from "@/lib/billing"

import { deleteExamTypeAction } from "../actions"
import type { ExamTypeRow } from "../queries"

type ExamTypeDetailPageProps = {
  examType: ExamTypeRow
  backHref: string
}

function DetailItem({
  label,
  value,
}: {
  label: string
  value: ReactNode
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <div className="text-sm font-medium text-foreground">{value}</div>
    </div>
  )
}

function BoolBadge({ value }: { value: boolean }) {
  return <Badge variant="soft">{value ? "Aktif" : "Nonaktif"}</Badge>
}

export function ExamTypeDetailPage({ examType, backHref }: ExamTypeDetailPageProps) {
  const router = useRouter()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteConfirmName, setDeleteConfirmName] = useState("")
  const finalPrice = getPackageFinalPrice(examType.packagePrice, examType.packageDiscountPercent)
  const deleteDisabled =
    deleteConfirmName.trim().toLowerCase() !== examType.name.trim().toLowerCase()

  async function handleDelete() {
    setIsDeleting(true)

    try {
      const result = await deleteExamTypeAction(examType.id)

      if (!result.success) {
        toast.error(result.message)
        return
      }

      toast.success("Exam type deleted.")
      router.push(backHref)
    } finally {
      setIsDeleting(false)
      setDeleteOpen(false)
      setDeleteConfirmName("")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={examType.name}
        subtitle={examType.description ?? "Exam type details and package configuration."}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline">
              <Link href={backHref}>
                <ArrowLeftIcon data-icon="inline-start" />
                Back
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/admin/exam-types/${examType.id}/edit`}>
                <PencilLineIcon data-icon="inline-start" />
                Edit
              </Link>
            </Button>
            <Button type="button" variant="destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2Icon data-icon="inline-start" />
              Delete
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>Identity, visuals, and public information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="overflow-hidden rounded-xl border border-border/60 bg-secondary/20">
              <div className="relative aspect-[16/7]">
                {examType.coverUrl ? (
                  <Image
                    src={examType.coverUrl}
                    alt={examType.name}
                    fill
                    unoptimized
                    sizes="(max-width: 1280px) 100vw, 50vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-muted/30 text-sm text-muted-foreground">
                    No cover selected.
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <TaxonomyLogo src={examType.logoUrl} alt={examType.name} />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{examType.name}</p>
                <p className="truncate text-sm text-muted-foreground">/{examType.slug}</p>
              </div>
            </div>

            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailItem label="Exam Type ID" value={examType.id} />
              <DetailItem label="Slug" value={examType.slug} />
              <DetailItem label="Subjects" value={examType.subjectCount.toLocaleString("id-ID")} />
              <DetailItem label="Topics" value={examType.topicCount.toLocaleString("id-ID")} />
              <DetailItem
                label="Questions"
                value={examType.questionCount.toLocaleString("id-ID")}
              />
              <DetailItem label="Created At" value={formatAdminDateTime(examType.createdAt)} />
              <DetailItem label="Updated At" value={formatAdminDateTime(examType.updatedAt)} />
            </dl>

            {examType.informationContent ? (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    Information Content
                  </p>
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-4 text-sm leading-6 text-foreground">
                    {examType.informationContent}
                  </div>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Package</CardTitle>
            <CardDescription>Price, duration, quota, and access settings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap gap-2">
              <BoolBadge value={examType.packageIsActive} />
              <Badge variant="soft">
                {examType.packageDurationMonths.toLocaleString("id-ID")} bulan
              </Badge>
              {examType.packageDiscountPercent > 0 ? (
                <Badge variant="soft">Diskon {examType.packageDiscountPercent}%</Badge>
              ) : null}
            </div>

            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailItem label="Package ID" value={examType.packageId ?? "-"} />
              <DetailItem label="Price ID" value={examType.packagePriceId ?? "-"} />
              <DetailItem label="Original Price" value={formatCurrencyIDR(examType.packagePrice)} />
              <DetailItem label="Final Price" value={formatCurrencyIDR(finalPrice)} />
              <DetailItem
                label="Practice Quota / Month"
                value={formatQuota(examType.practiceQuotaPerMonth)}
              />
              <DetailItem
                label="Quiz Quota / Month"
                value={formatQuota(examType.quizQuotaPerMonth)}
              />
              <DetailItem
                label="Tryout Quota / Month"
                value={formatQuota(examType.tryoutQuotaPerMonth)}
              />
              <DetailItem
                label="AI Explanation / Month"
                value={formatQuota(examType.aiExplanationQuotaPerMonth)}
              />
            </dl>

            <div className="grid gap-3 sm:grid-cols-3">
              <SettingCard label="Premium Practices" value={examType.premiumPracticesEnabled} />
              <SettingCard label="Premium Tryouts" value={examType.premiumTryoutsEnabled} />
              <SettingCard label="Ranking" value={examType.rankingEnabled} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Schedule</CardTitle>
          <CardDescription>Registration and exam timing configuration.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <DetailItem label="Countdown Title" value={examType.countdownTitle ?? "-"} />
            <DetailItem
              label="Countdown Target"
              value={formatAdminDateTime(examType.countdownTargetAt)}
            />
            <DetailItem
              label="Registration Start"
              value={formatAdminDateTime(examType.registrationStartAt)}
            />
            <DetailItem
              label="Registration End"
              value={formatAdminDateTime(examType.registrationEndAt)}
            />
            <DetailItem label="Exam Start" value={formatAdminDateTime(examType.examStartAt)} />
            <DetailItem label="Exam End" value={formatAdminDateTime(examType.examEndAt)} />
            <DetailItem
              label="Announcement"
              value={formatAdminDateTime(examType.announcementAt)}
            />
          </dl>
        </CardContent>
      </Card>

      <AlertDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteOpen(false)
            setDeleteConfirmName("")
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this exam type?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Related package rows will also be removed when they
              are not referenced by other records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Type <span className="font-medium text-foreground">{examType.name}</span> to confirm
              deletion.
            </p>
            <Input
              value={deleteConfirmName}
              onChange={(event) => setDeleteConfirmName(event.target.value)}
              placeholder={examType.name}
              aria-label="Confirm exam type name"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button type="button" variant="outline" disabled={isDeleting}>
                Cancel
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                type="button"
                variant="destructive"
                disabled={isDeleting || deleteDisabled}
                onClick={(event) => {
                  event.preventDefault()
                  void handleDelete()
                }}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function formatQuota(value: number) {
  if (value < 0) {
    return "Tidak terbatas"
  }

  return value.toLocaleString("id-ID")
}

function SettingCard({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="rounded-xl border border-border/60 bg-secondary/20 p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-medium text-foreground">{value ? "Aktif" : "Nonaktif"}</p>
    </div>
  )
}
