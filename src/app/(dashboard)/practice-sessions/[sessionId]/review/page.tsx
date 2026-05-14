import Link from "next/link"
import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { ArrowLeftIcon, CheckCircle2Icon, CircleSlashIcon, FileTextIcon, XCircleIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { requireUser } from "@/features/auth/services/session"
import { getPracticeSessionSummary } from "@/features/practices/queries/session"
import type { PracticeSessionReviewQuestion } from "@/features/practices/types"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Pembahasan Latihan",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function Page({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const [{ sessionId }, user] = await Promise.all([params, requireUser()])
  const id = Number(sessionId)

  if (!Number.isInteger(id) || id <= 0) {
    notFound()
  }

  const summary = await getPracticeSessionSummary(id, user.id)

  if (!summary) {
    notFound()
  }

  if (summary.status === "in_progress") {
    redirect(`/practice-sessions/${summary.id}`)
  }

  return (
    <main className="min-h-svh bg-muted/35 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">
                {summary.mode === "practice" ? "Mode Latihan" : "Mode Quiz"}
              </Badge>
              <Badge variant="secondary">{summary.totalQuestions} soal</Badge>
            </div>
            <h1 className="mt-2 font-heading text-2xl font-semibold tracking-normal">
              Pembahasan {summary.title}
            </h1>
          </div>
          <Button variant="outline" asChild>
            <Link href={`/practice-sessions/${summary.id}/result`}>
              <ArrowLeftIcon data-icon="inline-start" />
              Kembali ke Hasil
            </Link>
          </Button>
        </div>

        <div className="flex flex-col gap-4">
          {summary.questions.map((question) => (
            <ReviewQuestionCard key={question.id} question={question} />
          ))}
        </div>
      </div>
    </main>
  )
}

function ReviewQuestionCard({ question }: { question: PracticeSessionReviewQuestion }) {
  const selectedAnswer = getUserAnswerLabel(question)
  const correctAnswer = getCorrectAnswerLabel(question)
  const statusMeta = getStatusMeta(question.status)

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-background">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Soal {question.orderIndex}</Badge>
              <Badge variant="outline" className={statusMeta.className}>
                {statusMeta.icon}
                {statusMeta.label}
              </Badge>
              <Badge variant="outline">{question.points} Poin</Badge>
            </div>
            {question.question.title ? (
              <CardTitle className="text-base">{question.question.title}</CardTitle>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-5 p-4 sm:p-5">
        <div
          className="text-sm leading-7 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5"
          dangerouslySetInnerHTML={{ __html: question.question.content }}
        />

        <div className="grid gap-3 md:grid-cols-2">
          <AnswerBox label="Jawaban kamu" value={selectedAnswer} muted={question.status === "unanswered"} />
          <AnswerBox label="Jawaban benar" value={correctAnswer} />
        </div>

        {question.options.length > 0 ? (
          <div className="grid gap-2">
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
                  <span className="leading-6 [&_p]:mb-2" dangerouslySetInnerHTML={{ __html: option.content }} />
                </div>
              )
            })}
          </div>
        ) : null}

        <div>
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <FileTextIcon className="size-4 text-primary" />
            Pembahasan
          </h2>
          {question.question.explanation ? (
            <div
              className="rounded-lg border bg-muted/25 p-4 text-sm leading-7 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5"
              dangerouslySetInnerHTML={{ __html: question.question.explanation }}
            />
          ) : (
            <Empty className="border bg-muted/25 py-8">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FileTextIcon />
                </EmptyMedia>
                <EmptyTitle>Pembahasan belum tersedia</EmptyTitle>
                <EmptyDescription>
                  Admin belum menambahkan pembahasan untuk soal ini.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </div>
      </CardContent>
    </Card>
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
    <div className="rounded-lg border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-sm font-medium", muted && "text-muted-foreground")}>{value}</p>
    </div>
  )
}

function getUserAnswerLabel(question: PracticeSessionReviewQuestion) {
  if (!question.answer) {
    return "Kosong"
  }

  if (question.answer.selectedOptionKeys.length > 0) {
    return question.answer.selectedOptionKeys.join(", ")
  }

  return question.answer.answerText.trim() || "Kosong"
}

function getCorrectAnswerLabel(question: PracticeSessionReviewQuestion) {
  if (question.correctAnswer.optionKeys.length > 0) {
    return question.correctAnswer.optionKeys.join(", ")
  }

  return question.correctAnswer.answerText?.trim() || "-"
}

function getStatusMeta(status: PracticeSessionReviewQuestion["status"]) {
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

  return {
    label: "Kosong",
    className: "bg-muted text-muted-foreground",
    icon: <CircleSlashIcon />,
  }
}
