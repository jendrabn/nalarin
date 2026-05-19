import Link from "next/link"
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  CircleSlashIcon,
  ClockIcon,
  FileTextIcon,
  LockIcon,
  XCircleIcon,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"
import { Checkbox } from "@/components/ui/checkbox"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { cn } from "@/lib/utils"

import type { TryoutReviewData, TryoutReviewQuestion } from "../types"

export function TryoutReviewPage({ data }: { data: TryoutReviewData }) {
  const explanationsAvailable =
    data.explanationRelease.available && data.explanationRelease.allowedByPlan

  return (
    <main className="min-h-svh bg-muted/35 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <PageHeader
          className="mb-0"
          title={`Review Jawaban ${data.session.title}`}
          subtitle="Telaah jawaban, status benar-salah, dan pembahasan tiap soal."
          actions={
            <Button asChild variant="outline">
              <Link href={`/tryout-sessions/${data.session.id}/result`}>
                <ArrowLeftIcon data-icon="inline-start" />
                Kembali ke Hasil
              </Link>
            </Button>
          }
        />

        {!data.resultRelease.available ? (
          <Empty className="min-h-[24rem] border bg-card">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ClockIcon />
              </EmptyMedia>
              <EmptyTitle>Review Belum Tersedia</EmptyTitle>
              <EmptyDescription>
                Review jawaban mengikuti jadwal rilis hasil tryout.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            {!explanationsAvailable ? (
              <ExplanationNotice data={data} />
            ) : null}

            {data.sections.map((section) => (
              <Card key={section.id} className="shadow-sm">
                <CardHeader className="border-b bg-background">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <CardTitle>{section.title}</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">{section.subjectName}</p>
                    </div>
                    <Badge variant="outline">
                      {formatNumber(section.score)} / {formatNumber(section.maxScore)} Poin
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 p-4 sm:p-5">
                  {section.questions.map((question) => (
                    <ReviewQuestionCard
                      key={question.id}
                      question={question}
                      explanationsAvailable={explanationsAvailable}
                    />
                  ))}
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>
    </main>
  )
}

function ExplanationNotice({ data }: { data: TryoutReviewData }) {
  if (!data.explanationRelease.allowedByPlan) {
    return (
      <Alert>
        <LockIcon />
        <AlertTitle>Pembahasan Lengkap Termasuk Fitur Premium</AlertTitle>
        <AlertDescription>
          Kamu tetap bisa melihat status jawaban dan kunci jawaban. Pembahasan lengkap mengikuti
          akses paket aktif.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert>
      <ClockIcon />
      <AlertTitle>Pembahasan Belum Dirilis</AlertTitle>
      <AlertDescription>
        Pembahasan akan ditampilkan sesuai jadwal rilis yang ditentukan admin.
      </AlertDescription>
    </Alert>
  )
}

function ReviewQuestionCard({
  question,
  explanationsAvailable,
}: {
  question: TryoutReviewQuestion
  explanationsAvailable: boolean
}) {
  const statusMeta = getStatusMeta(question.status)

  return (
    <article className="rounded-xl border bg-card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Soal {question.displayOrder}</Badge>
          <Badge variant="outline" className={statusMeta.className}>
            {statusMeta.icon}
            {statusMeta.label}
          </Badge>
          <Badge variant="outline">{formatNumber(question.points)} Poin</Badge>
        </div>
        {question.answer?.isMarkedForReview ? (
          <Badge variant="outline" className="bg-muted text-muted-foreground">
            Ditandai
          </Badge>
        ) : null}
      </div>

      {question.question.title ? (
        <h2 className="mt-4 text-base font-semibold text-foreground">
          {question.question.title}
        </h2>
      ) : null}

      <div
        className="mt-4 text-sm leading-7 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5"
        dangerouslySetInnerHTML={{ __html: question.question.content }}
      />

      {question.options.length > 0 ? (
        <div className="mt-4 grid gap-2">
          {question.options.map((option) => {
            const selected = question.answer?.selectedOptionKeys.includes(option.label) ?? false
            const correct = question.correctAnswer.optionKeys.includes(option.label)

            return (
              <div
                key={`${question.id}-${option.label}`}
                className={cn(
                  "flex items-center gap-3 rounded-lg border bg-background p-3 text-sm",
                  selected && question.status === "correct" && "border-chart-2/35 bg-chart-2/10",
                  selected && question.status === "wrong" && "border-destructive/35 bg-destructive/10",
                  correct && "border-primary/35 bg-primary/10",
                )}
              >
                {question.question.type === "multiple_answer" ? (
                  <Checkbox checked={selected} disabled aria-label={`Opsi ${option.label}`} />
                ) : (
                  <span className="grid size-6 shrink-0 place-items-center rounded-full border text-xs font-semibold">
                    {option.label}
                  </span>
                )}
                <span
                  className="leading-6 [&_p]:mb-2"
                  dangerouslySetInnerHTML={{ __html: option.content }}
                />
              </div>
            )
          })}
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <AnswerBox label="Jawaban Kamu" value={getUserAnswerLabel(question)} muted={question.status === "unanswered"} />
        <AnswerBox label="Jawaban Benar" value={getCorrectAnswerLabel(question)} />
      </div>

      <div className="mt-5">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
          <FileTextIcon className="size-4 text-primary" />
          Pembahasan
        </h3>
        {explanationsAvailable && hasExplanationContent(question) ? (
          <ReviewExplanation question={question} />
        ) : (
          <Empty className="border bg-muted/20 py-7">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileTextIcon />
              </EmptyMedia>
              <EmptyTitle>
                {explanationsAvailable ? "Pembahasan Belum Tersedia" : "Pembahasan Terkunci"}
              </EmptyTitle>
              <EmptyDescription>
                {explanationsAvailable
                  ? "Admin belum menambahkan pembahasan untuk soal ini."
                  : "Pembahasan mengikuti jadwal rilis dan akses paket aktif."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>
    </article>
  )
}

function ReviewExplanation({ question }: { question: TryoutReviewQuestion }) {
  return (
    <div className="flex flex-col gap-3">
      {getExplanationItems(question).map((item) => (
        <section key={item.label} className="rounded-lg border bg-muted/25 p-4">
          <h4 className="mb-2 text-sm font-semibold">{item.label}</h4>
          <div
            className="text-sm leading-7 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5"
            dangerouslySetInnerHTML={{ __html: item.content }}
          />
        </section>
      ))}
    </div>
  )
}

function AnswerBox({
  label,
  value,
  muted,
}: {
  label: string
  value: string
  muted?: boolean
}) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-sm font-medium", muted && "text-muted-foreground")}>
        {value}
      </p>
    </div>
  )
}

function hasExplanationContent(question: TryoutReviewQuestion) {
  return getExplanationItems(question).length > 0
}

function getExplanationItems(question: TryoutReviewQuestion) {
  const items: Array<{ label: string; content: string }> = []

  if (question.question.manualExplanation) {
    items.push({
      label: "Pembahasan",
      content: question.question.manualExplanation,
    })
  }

  if (items.length === 0 && question.question.explanation) {
    items.push({ label: "Pembahasan", content: question.question.explanation })
  }

  if (items.length === 0 && question.question.aiExplanation) {
    items.push({
      label: "Pembahasan",
      content: question.question.aiExplanation,
    })
  }

  return items
}

function getUserAnswerLabel(question: TryoutReviewQuestion) {
  if (!question.answer) {
    return "Kosong"
  }

  if (question.answer.selectedOptionKeys.length > 0) {
    return question.answer.selectedOptionKeys.join(", ")
  }

  return question.answer.answerText.trim() || "Kosong"
}

function getCorrectAnswerLabel(question: TryoutReviewQuestion) {
  if (question.correctAnswer.optionKeys.length > 0) {
    return question.correctAnswer.optionKeys.join(", ")
  }

  return question.correctAnswer.answerText?.trim() || "-"
}

function getStatusMeta(status: TryoutReviewQuestion["status"]) {
  if (status === "correct") {
    return {
      label: "Benar",
      className: "border-chart-2/35 bg-chart-2/10 text-chart-2",
      icon: <CheckCircle2Icon />,
    }
  }

  if (status === "wrong") {
    return {
      label: "Salah",
      className: "border-destructive/35 bg-destructive/10 text-destructive",
      icon: <XCircleIcon />,
    }
  }

  if (status === "pending") {
    return {
      label: "Diproses",
      className: "border-chart-3/35 bg-chart-3/10 text-chart-3",
      icon: <ClockIcon />,
    }
  }

  return {
    label: "Kosong",
    className: "bg-muted text-muted-foreground",
    icon: <CircleSlashIcon />,
  }
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 2,
  }).format(value)
}
