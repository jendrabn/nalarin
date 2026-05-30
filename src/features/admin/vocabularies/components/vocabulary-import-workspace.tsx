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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { importVocabularyRowsAction } from "../actions"
import {
  vocabularyDifficultyLabels,
  vocabularyDifficultyValues,
  vocabularyLanguageLabels,
  vocabularyLanguageValues,
  vocabularyStatusLabels,
  vocabularyStatusValues,
  vocabularyTypeLabels,
  vocabularyTypeValues,
} from "../constants"
import type { VocabularyImportRowValues } from "../schemas"
import {
  downloadVocabularyImportTemplate,
  parseVocabularyImportWorkbook,
  type ParsedVocabularyImportWorkbook,
} from "../utils/vocabulary-import"
import { formatVocabularyWrongOptions, previewVocabularyText } from "../utils/vocabulary"

const STORAGE_KEY = "nalarin-admin-vocabulary-import"

type VocabularyImportWorkspaceProps = {
  mode: "upload" | "preview"
}

type StoredImportPayload = ParsedVocabularyImportWorkbook & {
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

function AvailableValuesReference() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Rules & Allowed Values</CardTitle>
        <CardDescription>
          Use these lowercase values exactly as shown in the workbook.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">language</p>
            <div className="flex flex-wrap gap-2">
              {vocabularyLanguageValues.map((value) => (
                <CopyableBadge key={value} value={value} />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">difficulty</p>
            <div className="flex flex-wrap gap-2">
              {vocabularyDifficultyValues.map((value) => (
                <CopyableBadge key={value} value={value} />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">type</p>
            <div className="flex flex-wrap gap-2">
              {vocabularyTypeValues.map((value) => (
                <CopyableBadge key={value} value={value} />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">status</p>
            <div className="flex flex-wrap gap-2">
              {vocabularyStatusValues.map((value) => (
                <CopyableBadge
                  key={value}
                  value={value}
                  variant={value === "published" ? "default" : "outline"}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-3 rounded-xl border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground md:grid-cols-2">
          <p>
            <span className="font-medium text-foreground">wrong_option_1</span> is required.
          </p>
          <p>
            <span className="font-medium text-foreground">wrong_option_2</span> and{" "}
            <span className="font-medium text-foreground">wrong_option_3</span> are optional.
          </p>
          <p>
            <span className="font-medium text-foreground">status</span> is required and must be one of{" "}
            <span className="font-medium text-foreground">{vocabularyStatusValues.join(", ")}</span>.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function ImportSummary({ payload }: { payload: StoredImportPayload }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Preview</CardTitle>
        <CardDescription>
          Review the parsed rows before importing them into the vocabulary bank.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              File
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {payload.fileName ?? "Uploaded workbook"}
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Valid rows
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">{payload.rows.length}</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Invalid rows
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {payload.rowErrors.length}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ValidRowsTable({ rows }: { rows: VocabularyImportRowValues[] }) {
  if (rows.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Valid Rows</CardTitle>
          <CardDescription>No valid rows were parsed from the workbook.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Valid Rows</CardTitle>
        <CardDescription>
          These rows will be imported using the status specified in the workbook.
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Word</TableHead>
              <TableHead>Language</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Wrong Options</TableHead>
              <TableHead>Example Sentence</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={`${row.word}-${index}`}>
                <TableCell className="font-medium text-foreground">{row.word}</TableCell>
                <TableCell>{vocabularyLanguageLabels[row.language]}</TableCell>
                <TableCell>{vocabularyDifficultyLabels[row.difficulty]}</TableCell>
                <TableCell>{vocabularyTypeLabels[row.type]}</TableCell>
                <TableCell>
                  <pre className="whitespace-pre-wrap text-sm leading-6 text-foreground">
                    {formatVocabularyWrongOptions(
                      [row.wrongOption1, row.wrongOption2, row.wrongOption3].filter(
                        (option) => option.trim().length > 0,
                      ),
                    )}
                  </pre>
                </TableCell>
                <TableCell className="max-w-[22rem] whitespace-normal text-sm text-muted-foreground">
                  {previewVocabularyText(row.exampleSentence, 120) || "-"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={row.status === "published" ? "default" : "outline"}
                    className="rounded-full"
                  >
                    {vocabularyStatusLabels[row.status]}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function InvalidRowsTable({ rows }: { rows: StoredImportPayload["rowErrors"] }) {
  if (rows.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invalid Rows</CardTitle>
        <CardDescription>
          Fix these rows in the workbook or exclude them from import.
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Row</TableHead>
              <TableHead>Word</TableHead>
              <TableHead>Errors</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.rowNumber}>
                <TableCell className="tabular-nums">{row.rowNumber}</TableCell>
                <TableCell className="font-medium text-foreground">
                  {row.values.word || "-"}
                </TableCell>
                <TableCell className="whitespace-normal text-sm text-destructive">
                  {row.errors.join(" ")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export function VocabularyImportWorkspace({ mode }: VocabularyImportWorkspaceProps) {
  const router = useRouter()
  const [payload] = useState<StoredImportPayload | null>(() => {
    if (typeof window === "undefined" || mode !== "preview") {
      return null
    }

    return loadFromStorage()
  })
  const [isImporting, setIsImporting] = useState(false)

  const validRows = useMemo(() => payload?.rows ?? [], [payload?.rows])
  const invalidRows = useMemo(() => payload?.rowErrors ?? [], [payload?.rowErrors])

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""

    if (!file) {
      return
    }

    try {
      const parsed = await parseVocabularyImportWorkbook(file)
      saveToStorage({
        ...parsed,
        fileName: file.name,
      })
      router.push("/admin/vocabularies/import/preview")
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
      const result = await importVocabularyRowsAction(validRows)

      if (!result.success) {
        toast.error(result.message)
        return
      }

      toast.success(`Imported ${result.data.importedCount} vocabularies.`)
      sessionStorage.removeItem(STORAGE_KEY)
      router.replace("/admin/vocabularies")
      router.refresh()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to import vocabularies."
      toast.error(message)
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={mode === "upload" ? "Import Vocabulary" : "Import Preview"}
        subtitle={
          mode === "upload"
            ? "Upload an Excel workbook to validate vocabulary rows before saving them."
            : "Review the parsed workbook and import only the valid rows into the free vocabulary bank."
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" onClick={() => downloadVocabularyImportTemplate()}>
              <FileDownIcon data-icon="inline-start" />
              Download Template
            </Button>
            <Button asChild variant="ghost">
              <Link href="/admin/vocabularies">Back to Vocabulary</Link>
            </Button>
          </div>
        }
      />

      {mode === "upload" ? (
        <>
          <AvailableValuesReference />
          <Card>
            <CardHeader>
              <CardTitle>Upload Workbook</CardTitle>
              <CardDescription>
                Choose the template file after filling in your vocabulary rows.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <input
                id="vocabulary-import-file"
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(event) => void handleFileChange(event)}
              />
              <div className="flex flex-wrap gap-2">
                <Button asChild>
                  <label htmlFor="vocabulary-import-file" className="cursor-pointer">
                    <UploadIcon data-icon="inline-start" />
                    Choose File
                  </label>
                </Button>
                <Button type="button" variant="outline" onClick={() => downloadVocabularyImportTemplate()}>
                  <FileDownIcon data-icon="inline-start" />
                  Download Template Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      ) : payload ? (
        <>
          <ImportSummary payload={payload} />
          <ValidRowsTable rows={validRows} />
          <InvalidRowsTable rows={invalidRows} />

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button asChild variant="outline">
              <Link href="/admin/vocabularies/import">Change File</Link>
            </Button>
            <Button
              type="button"
              onClick={() => void handleImport()}
              disabled={isImporting || validRows.length === 0}
            >
              {isImporting ? "Importing..." : `Import ${validRows.length} Rows`}
            </Button>
          </div>
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No preview data</CardTitle>
            <CardDescription>
              Upload a workbook first to generate a preview.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/admin/vocabularies/import">Go to Import</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
