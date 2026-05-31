"use client"

import type { ChangeEvent, ComponentPropsWithoutRef } from "react"
import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CheckIcon, CopyIcon, FileDownIcon, UploadIcon } from "lucide-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { importGrammarQuestionRowsAction } from "../actions"
import {
  grammarQuestionDifficultyLabels,
  grammarQuestionDifficultyValues,
  grammarQuestionLanguageLabels,
  grammarQuestionLanguageValues,
  grammarQuestionStatusLabels,
  grammarQuestionStatusValues,
} from "../constants"
import {
  downloadGrammarQuestionImportTemplate,
  parseGrammarQuestionImportWorkbook,
  type GrammarQuestionImportPreviewRow,
  type ParsedGrammarQuestionImportWorkbook,
} from "../utils/grammar-import"

const STORAGE_KEY = "nalarin-admin-grammar-import"

type GrammarQuestionImportWorkspaceProps = {
  mode: "upload" | "preview"
}

type StoredImportPayload = ParsedGrammarQuestionImportWorkbook & {
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
      setCopied(true)
      toast.success(`Copied ${value}`)
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

function displayGrammarLabel(labels: Record<string, string>, value?: string | null) {
  if (!value) {
    return "-"
  }

  return labels[value] ?? value
}

function AvailableValuesReference() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Rules & Allowed Values</CardTitle>
        <CardDescription>
          Use these exact lowercase values when filling the workbook.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">language</p>
            <div className="flex flex-wrap gap-2">
              {grammarQuestionLanguageValues.map((value) => (
                <CopyableBadge key={value} value={value} />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">difficulty</p>
            <div className="flex flex-wrap gap-2">
              {grammarQuestionDifficultyValues.map((value) => (
                <CopyableBadge key={value} value={value} />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">status</p>
            <div className="flex flex-wrap gap-2">
              {grammarQuestionStatusValues.map((value) => (
                <CopyableBadge key={value} value={value} />
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-3 rounded-2xl border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground md:grid-cols-2">
          <p>
            <span className="font-medium text-foreground">sentence_template</span> must include at
            least one placeholder like <span className="font-medium text-foreground">{"{{ 1 }}"}</span>.
          </p>
          <p>
            Maximum <span className="font-medium text-foreground">5 blanks</span> are allowed and
            they must stay sequential.
          </p>
          <p>
            <span className="font-medium text-foreground">answer_1</span> to{" "}
            <span className="font-medium text-foreground">answer_5</span> follow the placeholder
            order.
          </p>
          <p>
            <span className="font-medium text-foreground">distractor_1</span> is required, while{" "}
            <span className="font-medium text-foreground">distractor_2</span> and{" "}
            <span className="font-medium text-foreground">distractor_3</span> are optional.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function PreviewRowsTable({ rows }: { rows: GrammarQuestionImportPreviewRow[] }) {
  if (rows.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Preview Rows</CardTitle>
          <CardDescription>No rows were parsed from the workbook.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60">
          <Table className="text-sm">
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">ROW</TableHead>
            <TableHead>SENTENCE TEMPLATE</TableHead>
            <TableHead>LANGUAGE</TableHead>
            <TableHead>DIFFICULTY</TableHead>
            <TableHead>CATEGORY</TableHead>
            <TableHead>STATUS</TableHead>
            <TableHead>ERRORS</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.rowNumber}>
              <TableCell className="font-medium tabular-nums">{row.rowNumber}</TableCell>
              <TableCell className="max-w-[24rem] whitespace-normal">
                {row.values.sentenceTemplate || "-"}
              </TableCell>
              <TableCell>{displayGrammarLabel(grammarQuestionLanguageLabels, row.values.language)}</TableCell>
              <TableCell>{displayGrammarLabel(grammarQuestionDifficultyLabels, row.values.difficulty)}</TableCell>
              <TableCell>{row.values.category || "-"}</TableCell>
              <TableCell>{displayGrammarLabel(grammarQuestionStatusLabels, row.values.status)}</TableCell>
              <TableCell className="max-w-[24rem] whitespace-normal text-sm text-destructive">
                {row.errors.length > 0 ? row.errors.join(" ") : "OK"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function GrammarQuestionImportWorkspace({ mode }: GrammarQuestionImportWorkspaceProps) {
  const router = useRouter()
  const [payload] = useState<StoredImportPayload | null>(() => {
    if (typeof window === "undefined" || mode !== "preview") {
      return null
    }

    return loadFromStorage()
  })
  const [isImporting, setIsImporting] = useState(false)

  const validRows = useMemo(() => payload?.rows ?? [], [payload?.rows])
  const previewRows = useMemo(() => payload?.previewRows ?? [], [payload?.previewRows])

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""

    if (!file) {
      return
    }

    try {
      const parsed = await parseGrammarQuestionImportWorkbook(file)
      saveToStorage({
        ...parsed,
        fileName: file.name,
      })
      router.push("/admin/grammar/import/preview")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to parse the workbook."
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
      const result = await importGrammarQuestionRowsAction(validRows)

      if (!result.success) {
        toast.error(result.message)
        return
      }

      toast.success(
        `Imported ${result.data.importedCount} grammar questions${payload.rowErrors.length > 0 ? `, skipped ${payload.rowErrors.length}` : ""}.`,
      )
      sessionStorage.removeItem(STORAGE_KEY)
      router.replace("/admin/grammar")
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to import grammar questions."
      toast.error(message)
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={mode === "upload" ? "Import Grammar" : "Import Preview"}
        subtitle={
          mode === "upload"
            ? "Upload an Excel workbook to validate grammar rows before importing them."
            : "Review the parsed workbook and import only the valid rows into the grammar bank."
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => downloadGrammarQuestionImportTemplate()}
            >
              <FileDownIcon data-icon="inline-start" />
              Download Template
            </Button>
            <Button asChild variant="ghost">
              <Link href="/admin/grammar">Back to Grammar</Link>
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>{mode === "upload" ? "Upload Workbook" : "Preview Import"}</CardTitle>
          <CardDescription>
            This template includes the following fields: sentence_template, answer_1, answer_2,
            answer_3, answer_4, answer_5, language, difficulty, category, distractor_1,
            distractor_2, distractor_3, and status.
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
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={(event) => void handleFileChange(event)}
                />
              </label>

              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" className="w-fit">
                  <Link href="/admin/grammar/import/preview">
                    <FileDownIcon data-icon="inline-start" />
                    Open preview
                  </Link>
                </Button>
              </div>
            </div>
          ) : payload ? (
            <div className="flex flex-col gap-4">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-border/60 p-4">
                  <p className="text-sm text-muted-foreground">Valid rows</p>
                  <p className="mt-2 text-2xl font-semibold">{payload.rows.length}</p>
                </div>
                <div className="rounded-xl border border-border/60 p-4">
                  <p className="text-sm text-muted-foreground">Invalid rows</p>
                  <p className="mt-2 text-2xl font-semibold">{payload.rowErrors.length}</p>
                </div>
                <div className="rounded-xl border border-border/60 p-4">
                  <p className="text-sm text-muted-foreground">File</p>
                  <p className="mt-2 break-words text-sm font-medium text-foreground">
                    {payload.fileName ?? "Unknown workbook"}
                  </p>
                </div>
              </div>

              <PreviewRowsTable rows={previewRows} />

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={() => router.push("/admin/grammar/import")}>
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={() => void handleImport()}
                  disabled={isImporting || validRows.length === 0}
                >
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

      <AvailableValuesReference />
    </div>
  )
}
