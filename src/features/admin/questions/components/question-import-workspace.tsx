"use client"

import { type ChangeEvent, type ComponentPropsWithoutRef, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CheckIcon, CopyIcon, FileDownIcon, UploadIcon } from "lucide-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import type { QuestionImportRowValues } from "../schemas"
import { importQuestionRowsAction } from "../actions"
import type {
  QuestionLookupOption,
  SubjectLookupOption,
  TopicLookupOption,
} from "../queries"
import {
  downloadQuestionImportTemplate,
  parseQuestionImportWorkbook,
  type ParsedQuestionImportWorkbook,
} from "../utils/question-import"
import {
  questionDifficultyLabels,
  questionDifficultyValues,
  questionStatusValues,
  questionTypeLabels,
  questionTypeValues,
} from "../constants"

const STORAGE_KEY = "nalarin-admin-question-import"

type QuestionImportWorkspaceProps = {
  mode: "upload" | "preview"
  lookups: {
    examTypes: QuestionLookupOption[]
    subjects: SubjectLookupOption[]
    topics: TopicLookupOption[]
  }
}

type StoredImportPayload = ParsedQuestionImportWorkbook & {
  fileName?: string
}

function saveToStorage(payload: StoredImportPayload) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

function loadFromStorage() {
  const raw = sessionStorage.getItem(STORAGE_KEY)

  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as StoredImportPayload
  } catch {
    return null
  }
}

function AvailableValuesReference({
  lookups,
}: {
  lookups: QuestionImportWorkspaceProps["lookups"]
}) {
  const slugHierarchy = useMemo(
    () =>
      lookups.examTypes.map((examType) => ({
        ...examType,
        subjects: lookups.subjects
          .filter((subject) => subject.examTypeId === examType.id)
          .map((subject) => ({
            ...subject,
            topics: lookups.topics.filter((topic) => topic.subjectId === subject.id),
          })),
      })),
    [lookups.examTypes, lookups.subjects, lookups.topics],
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rules & Slugs</CardTitle>
        <CardDescription>
          Use the exact lowercase values shown below when filling the workbook.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">question_type</p>
            <div className="flex flex-wrap gap-2">
              {questionTypeValues.map((value) => (
                <CopyableBadge key={value} value={value} />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">difficulty</p>
            <div className="flex flex-wrap gap-2">
              {questionDifficultyValues.map((value) => (
                <CopyableBadge key={value} value={value} />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">scoring_rule</p>
            <div className="flex flex-wrap gap-2">
              <CopyableBadge value="all_or_nothing" />
              <CopyableBadge value="partial" />
              <CopyableBadge value="blank" variant="secondary" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">status</p>
            <div className="flex flex-wrap gap-2">
              {questionStatusValues.map((value) => (
                <CopyableBadge key={value} value={value} />
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-3 rounded-xl border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground md:grid-cols-2 xl:grid-cols-3">
          <p>
            <span className="font-medium text-foreground">scoring_rule</span> is only used for <span className="font-medium text-foreground">multiple_answer</span>.
          </p>
          <p>
            Valid <span className="font-medium text-foreground">scoring_rule</span> values are <span className="font-medium text-foreground">all_or_nothing</span>, <span className="font-medium text-foreground">partial</span>, or blank.
          </p>
          <p>
            <span className="font-medium text-foreground">correct_answer</span> uses option letters like <span className="font-medium text-foreground">A</span> or <span className="font-medium text-foreground">A,C</span>.
          </p>
          <p>
            <span className="font-medium text-foreground">topic_slug</span> is optional and must belong to the selected <span className="font-medium text-foreground">subject_slug</span>.
          </p>
          <p>
            <span className="font-medium text-foreground">subject_slug</span> must belong to the selected <span className="font-medium text-foreground">exam_type_slug</span>.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {slugHierarchy.map((examType) => (
            <div key={examType.id} className="rounded-2xl border border-border/60 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium text-foreground">{examType.name}</p>
                  <p className="text-xs text-muted-foreground">exam_type_slug</p>
                </div>
                <CopyableBadge value={examType.slug} />
              </div>

              <div className="mt-4 flex flex-col gap-3 border-l border-border/60 pl-4">
                {examType.subjects.length > 0 ? (
                  examType.subjects.map((subject) => (
                    <div key={subject.id} className="rounded-xl border border-border/60 p-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex flex-col gap-1">
                          <p className="text-sm font-medium text-foreground">{subject.name}</p>
                          <p className="text-xs text-muted-foreground">subject_slug</p>
                        </div>
                        <CopyableBadge value={subject.slug} />
                      </div>

                      <div className="mt-3 flex flex-col gap-2">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          topic_slug
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {subject.topics.length > 0 ? (
                            subject.topics.map((topic) => (
                              <CopyableBadge key={topic.id} value={topic.slug} />
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              No topics in this subject.
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No subjects in this exam type.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function CopyableBadge({
  value,
  variant = "outline",
}: {
  value: string
  variant?: ComponentPropsWithoutRef<typeof Badge>["variant"]
}) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value)
      toast.success(`Copied ${value}`)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1200)
    } catch {
      toast.error(`Failed to copy ${value}`)
    }
  }

  return (
    <Badge variant={variant} className="gap-1.5 pr-1.5">
      <span className="whitespace-normal break-words">{value}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => void handleCopy()}
        className="size-5 shrink-0 rounded-full text-muted-foreground hover:bg-transparent hover:text-foreground"
        aria-label={`Copy ${value}`}
      >
        {copied ? <CheckIcon data-icon="inline-start" /> : <CopyIcon data-icon="inline-start" />}
      </Button>
    </Badge>
  )
}

export function QuestionImportWorkspace({ mode, lookups }: QuestionImportWorkspaceProps) {
  const router = useRouter()
  const [payload] = useState<StoredImportPayload | null>(() => {
    if (typeof window === "undefined" || mode !== "preview") {
      return null
    }

    return loadFromStorage()
  })
  const [isImporting, setIsImporting] = useState(false)

  const validRows = useMemo(
    () => payload?.rows ?? [],
    [payload?.rows],
  )

  const invalidRows = useMemo(
    () => payload?.rowErrors ?? [],
    [payload?.rowErrors],
  )

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""

    if (!file) {
      return
    }

    try {
      const parsed = await parseQuestionImportWorkbook(file, lookups)
      saveToStorage({
        ...parsed,
        fileName: file.name,
      })
      router.push("/admin/questions/import/preview")
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to parse the workbook."
      toast.error(message)
    }
  }

  async function handleImport() {
    if (!payload || validRows.length === 0) {
      toast.error("No valid rows to import.")
      return
    }

    setIsImporting(true)

    try {
      const result = await importQuestionRowsAction(validRows as QuestionImportRowValues[])

      if (!result.success) {
        toast.error(result.message)
        return
      }

      toast.success(
        `Imported ${result.data.importedCount} questions${result.data.skippedCount > 0 ? `, skipped ${result.data.skippedCount}` : ""}.`,
      )
      sessionStorage.removeItem(STORAGE_KEY)
      router.replace("/admin/questions")
      router.refresh()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to import questions."
      toast.error(message)
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Import Questions"
        subtitle="Import questions to validate workbook rows before saving them."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" onClick={() => downloadQuestionImportTemplate()}>
              <FileDownIcon data-icon="inline-start" />
              Download template
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/questions">Back to Questions</Link>
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>{mode === "upload" ? "Upload Workbook" : "Preview Import"}</CardTitle>
          <CardDescription>
            This template includes the following fields: exam_type_slug, subject_slug, topic_slug, question_type, difficulty, title, question_content, image_url, option_a to option_j, correct_answer, correct_answer_text, scoring_rule, grading_rubric, explanation, year, points, and status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mode === "upload" ? (
            <div className="flex flex-col gap-4">
              <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/60 bg-muted/20 px-6 py-12 text-center">
                <UploadIcon />
                <div>
                  <p className="text-sm font-medium text-foreground">Choose Excel file</p>
                  <p className="text-sm text-muted-foreground">
                    Upload .xlsx file to continue to preview.
                  </p>
                </div>
                <Input
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={(event) => void handleFileChange(event)}
                />
              </label>

              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" className="w-fit">
                  <Link href="/admin/questions/import/preview">
                    <FileDownIcon data-icon="inline-start" />
                    Open preview
                  </Link>
                </Button>
              </div>
            </div>
          ) : payload ? (
            <div className="flex flex-col gap-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-border/60 p-4">
                  <p className="text-sm text-muted-foreground">Valid rows</p>
                  <p className="mt-2 text-2xl font-semibold">{validRows.length}</p>
                </div>
                <div className="rounded-xl border border-border/60 p-4">
                  <p className="text-sm text-muted-foreground">Invalid rows</p>
                  <p className="mt-2 text-2xl font-semibold">{invalidRows.length}</p>
                </div>
                <div className="rounded-xl border border-border/60 p-4">
                  <p className="text-sm text-muted-foreground">File</p>
                  <p className="mt-2 break-words text-sm font-medium text-foreground">
                    {payload.fileName ?? "Unknown workbook"}
                  </p>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-border/60">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">ROW</TableHead>
                      <TableHead>QUESTION TYPE</TableHead>
                      <TableHead>DIFFICULTY</TableHead>
                      <TableHead>QUESTION</TableHead>
                      <TableHead>ERRORS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payload.rows.length > 0 ? (
                      payload.rows.map((row, index) => {
                        const rowNumber = index + 2
                        const rowError = payload.rowErrors.find((item) => item.rowNumber === rowNumber)

                        return (
                          <TableRow key={`${rowNumber}-${row.questionContent.slice(0, 12)}`}>
                            <TableCell className="font-medium tabular-nums">{rowNumber}</TableCell>
                            <TableCell>{questionTypeLabels[row.questionType]}</TableCell>
                            <TableCell>{questionDifficultyLabels[row.difficulty]}</TableCell>
                            <TableCell className="max-w-[28rem]">
                              <p className="line-clamp-2 whitespace-normal text-sm">
                                {row.questionContent}
                              </p>
                            </TableCell>
                            <TableCell className="max-w-[24rem] whitespace-normal text-sm text-destructive">
                              {rowError ? rowError.errors.join(" ") : "OK"}
                            </TableCell>
                          </TableRow>
                        )
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-sm text-muted-foreground">
                          No rows parsed.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={() => router.push("/admin/questions/import")}>
                  Back
                </Button>
                <Button type="button" onClick={() => void handleImport()} disabled={isImporting || validRows.length === 0}>
                  {isImporting ? "Importing..." : "Import Valid Rows"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
              No uploaded workbook found. Go back to upload a file first.
            </div>
          )}
        </CardContent>
      </Card>

      <AvailableValuesReference lookups={lookups} />
    </div>
  )
}
