import Link from "next/link"
import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { ArrowLeftIcon, CheckCircle2Icon, CircleSlashIcon, FileTextIcon, XCircleIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
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
import { PracticeSessionPageShell } from "@/features/practices/components/practice-session-page-shell"
import { getPracticeSessionSummary } from "@/features/practices/queries/session"
import type { PracticeSessionReviewQuestion } from "@/features/practices/types"
import { cn } from "@/lib/utils"
import type { SiteUser } from "@/components/site-navbar"

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

  const siteUser: NonNullable<SiteUser> = {
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    role: user.role,
  }

  return (
    <PracticeSessionPageShell user={siteUser}>
      <main className="min-h-svh bg-muted/35 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
          <PageHeader
            className="mb-0"
            title={`Pembahasan ${summary.title}`}
            subtitle="Tinjau jawaban, status benar-salah, dan pembahasan untuk setiap soal."
            actions={
              <Button variant="outline" asChild>
                <Link href={`/practice-sessions/${summary.id}/result`}>
                  <ArrowLeftIcon data-icon="inline-start" />
                  Kembali ke Hasil
                </Link>
              </Button>
            }
          />

          <div className="flex flex-col gap-4">
            {summary.questions.map((question) => (
              <ReviewQuestionCard key={question.id} question={question} />
            ))}
          </div>
        </div>
      </main>
    </PracticeSessionPageShell>
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
          {hasExplanationContent(question) ? (
            <ReviewExplanation question={question} />
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

function ReviewExplanation({ question }: { question: PracticeSessionReviewQuestion }) {
  const explanations = getExplanationItems(question)

  return (
    <div className="flex flex-col gap-3">
      {explanations.map((item) => (
        <section key={item.label} className="rounded-lg border bg-muted/25 p-4">
          <h3 className="mb-2 text-sm font-semibold">{item.label}</h3>
          <div
            className="text-sm leading-7 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5"
            dangerouslySetInnerHTML={{ __html: item.content }}
          />
        </section>
      ))}
    </div>
  )
}

function hasExplanationContent(question: PracticeSessionReviewQuestion) {
  return getExplanationItems(question).length > 0
}

function getExplanationItems(question: PracticeSessionReviewQuestion) {
  const items: Array<{ label: string; content: string }> = []

  if (question.question.explanation) {
    items.push({ label: "Pembahasan", content: question.question.explanation })
  }

  return items
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
