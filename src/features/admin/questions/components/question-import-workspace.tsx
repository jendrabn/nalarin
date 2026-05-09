"use client"

import { type ChangeEvent, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { FileDownIcon, UploadIcon } from "lucide-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import type { QuestionImportRowValues } from "../schemas/question"
import { importQuestionRowsAction } from "../actions/questions"
import {
  parseQuestionImportWorkbook,
  type ParsedQuestionImportWorkbook,
} from "../utils/question-import"
import { questionDifficultyLabels, questionTypeLabels } from "../constants"

const STORAGE_KEY = "nalarin-admin-question-import"

type QuestionImportWorkspaceProps = {
  mode: "upload" | "preview"
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

export function QuestionImportWorkspace({ mode }: QuestionImportWorkspaceProps) {
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
      const parsed = await parseQuestionImportWorkbook(file)
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
        subtitle="Upload an Excel workbook, review validation issues, and import only the valid rows."
        actions={
          <Button asChild variant="outline">
            <Link href="/admin/questions">
              Back to Questions
            </Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>{mode === "upload" ? "Upload Workbook" : "Preview Import"}</CardTitle>
          <CardDescription>
            Use the official template columns from the PRD: exam_type_slug, subject_slug, topic_slug, question_type, difficulty, question_content, option_a to option_e, correct_answer, scoring_rule, explanation, year, and points.
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

              <Button asChild variant="outline" className="w-fit">
                <Link href="/admin/questions/import/preview">
                  <FileDownIcon data-icon="inline-start" />
                  Open preview
                </Link>
              </Button>
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
    </div>
  )
}
