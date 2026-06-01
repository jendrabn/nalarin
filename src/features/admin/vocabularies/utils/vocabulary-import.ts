import * as XLSX from "xlsx"

import {
  vocabularyDifficultyLabels,
  vocabularyDifficultyValues,
  vocabularyImportTemplateFileName,
  vocabularyLanguageLabels,
  vocabularyLanguageValues,
  vocabularyStatusLabels,
  vocabularyStatusValues,
  vocabularyTypeLabels,
  vocabularyTypeValues,
} from "../constants"
import {
  vocabularyImportRowSchema,
  type VocabularyImportRowValues,
} from "../schemas"

export type VocabularyImportRowError = {
  rowNumber: number
  errors: string[]
  values: Partial<VocabularyImportRowValues>
}

export type ParsedVocabularyImportWorkbook = {
  rows: VocabularyImportRowValues[]
  rowErrors: VocabularyImportRowError[]
  previewRows: VocabularyImportPreviewRow[]
}

export type VocabularyImportPreviewRow = {
  rowNumber: number
  values: Partial<VocabularyImportRowValues>
  errors: string[]
  isValid: boolean
}

export const vocabularyImportHeaders = [
  "word",
  "language",
  "difficulty",
  "type",
  "correct_meaning",
  "wrong_option",
  "example_sentence",
  "status",
] as const

function cellValue(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = row[key]

    if (typeof value === "string") {
      return value.trim()
    }

    if (typeof value === "number") {
      return String(value)
    }
  }

  return ""
}

function normalizeValue<T extends readonly string[]>(
  value: string,
  allowedValues: T,
) {
  const normalized = value.trim().toLowerCase()

  return allowedValues.includes(normalized as T[number]) ? normalized : ""
}

export function createVocabularyImportTemplateWorkbook() {
  const workbook = XLSX.utils.book_new()
  const sheet = XLSX.utils.aoa_to_sheet([[...vocabularyImportHeaders]])
  sheet["!cols"] = vocabularyImportHeaders.map((header) => ({
    wch: Math.max(header.length, 16),
  }))

  const instructionsSheet = XLSX.utils.aoa_to_sheet([
    ["Field", "Guidance"],
    [
      "word",
      "Word shown in the vocabulary card. Use a concise form that is easy to review.",
    ],
    [
      "language",
      `Use one of: ${vocabularyLanguageValues.join(", ")}.`,
    ],
    [
      "difficulty",
      `Use one of: ${vocabularyDifficultyValues.join(", ")}.`,
    ],
    [
      "type",
      `Use one of: ${vocabularyTypeValues.join(", ")}.`,
    ],
    [
      "wrong_option",
      "Required. This is the single wrong answer shown in the game.",
    ],
    [
      "example_sentence",
      "Optional example sentence. Leave blank if not needed.",
    ],
    [
      "status",
      `Use one of: ${vocabularyStatusValues.join(", ")}.`,
    ],
  ])

  sheet["!cols"] = vocabularyImportHeaders.map((header) => ({
    wch: Math.max(header.length, 16),
  }))
  instructionsSheet["!cols"] = [{ wch: 24 }, { wch: 96 }]

  XLSX.utils.book_append_sheet(workbook, sheet, "Vocabulary")
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, "Instructions")

  return workbook
}

export function downloadVocabularyImportTemplate() {
  const workbook = createVocabularyImportTemplateWorkbook()
  const data = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
  const blob = new Blob([data], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")

  link.href = url
  link.download = vocabularyImportTemplateFileName
  link.click()

  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

export async function parseVocabularyImportWorkbook(
  file: File,
): Promise<ParsedVocabularyImportWorkbook> {
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  })

  const parsedRows: VocabularyImportRowValues[] = []
  const rowErrors: VocabularyImportRowError[] = []
  const previewRows: VocabularyImportPreviewRow[] = []

  rows.forEach((row, index) => {
    const rowNumber = index + 2
    const normalized = {
      word: cellValue(row, ["word"]),
      language: normalizeValue(
        cellValue(row, ["language"]),
        vocabularyLanguageValues,
      ),
      difficulty: normalizeValue(
        cellValue(row, ["difficulty"]),
        vocabularyDifficultyValues,
      ),
      type: normalizeValue(cellValue(row, ["type"]), vocabularyTypeValues),
      correctMeaning: cellValue(row, ["correct_meaning", "correctMeaning"]),
      wrongOption: cellValue(row, [
        "wrong_option",
        "wrongOption",
        "wrong_option_1",
        "wrongOption1",
      ]),
      exampleSentence: cellValue(row, ["example_sentence", "exampleSentence"]),
      status: normalizeValue(cellValue(row, ["status"]), vocabularyStatusValues),
    }

    const validated = vocabularyImportRowSchema.safeParse(normalized)

    if (!validated.success) {
      const values = normalized as Partial<VocabularyImportRowValues>

      rowErrors.push({
        rowNumber,
        errors: validated.error.issues.map((issue) => issue.message),
        values,
      })
      previewRows.push({
        rowNumber,
        values,
        errors: validated.error.issues.map((issue) => issue.message),
        isValid: false,
      })
      return
    }

    parsedRows.push(validated.data)
    previewRows.push({
      rowNumber,
      values: validated.data,
      errors: [],
      isValid: true,
    })
  })

  return {
    rows: parsedRows,
    rowErrors,
    previewRows,
  }
}

export function vocabularyImportSummary(rows: VocabularyImportRowValues[]) {
  return rows.map((row, index) => ({
    rowNumber: index + 2,
    values: row,
  }))
}

export function formatVocabularyImportCellLabel(value: string) {
  const label =
    vocabularyLanguageLabels[value as keyof typeof vocabularyLanguageLabels] ||
    vocabularyDifficultyLabels[value as keyof typeof vocabularyDifficultyLabels] ||
    vocabularyTypeLabels[value as keyof typeof vocabularyTypeLabels] ||
    vocabularyStatusLabels[value as keyof typeof vocabularyStatusLabels] ||
    value

  return label
}
