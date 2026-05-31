import * as XLSX from "xlsx"
import { z } from "zod"

import {
  grammarQuestionStatusValues,
  grammarQuestionDifficultyValues,
  grammarQuestionImportTemplateFileName,
  grammarQuestionLanguageValues,
} from "../constants"
import {
  grammarQuestionImportRowSchema,
  type GrammarQuestionImportRowValues,
} from "../schemas"

export type GrammarQuestionImportRowError = {
  rowNumber: number
  errors: string[]
  values: Partial<GrammarQuestionImportRowValues>
}

export type ParsedGrammarQuestionImportWorkbook = {
  rows: GrammarQuestionImportRowValues[]
  rowErrors: GrammarQuestionImportRowError[]
  previewRows: GrammarQuestionImportPreviewRow[]
}

export type GrammarQuestionImportPreviewRow = {
  rowNumber: number
  values: Partial<GrammarQuestionImportRowValues>
  errors: string[]
  isValid: boolean
}

export const grammarQuestionImportTemplateHeaders = [
  "sentence_template",
  "answer_1",
  "answer_2",
  "answer_3",
  "answer_4",
  "answer_5",
  "language",
  "difficulty",
  "category",
  "distractor_1",
  "distractor_2",
  "distractor_3",
  "status",
] as const

export function createGrammarQuestionImportTemplateWorkbook() {
  const workbook = XLSX.utils.book_new()
  const questionSheet = XLSX.utils.aoa_to_sheet([[...grammarQuestionImportTemplateHeaders]])
  questionSheet["!cols"] = grammarQuestionImportTemplateHeaders.map((header) => ({
    wch: Math.max(header.length, 16),
  }))

  const instructionsSheet = XLSX.utils.aoa_to_sheet([
    ["Field", "Guidance"],
    [
      "sentence_template",
      "Write the sentence with placeholders like {{ 1 }}, {{ 2 }}, up to {{ 5 }}.",
    ],
    [
      "answer_1 to answer_5",
      "Fill the answer that matches each placeholder order. Leave unused cells blank.",
    ],
    [
      "language",
      "Use id or en.",
    ],
    [
      "difficulty",
      "Use easy, medium, or hard.",
    ],
    [
      "category",
      "Optional free-text category such as Simple Present or Past Tense.",
    ],
    [
      "distractor_1 to distractor_3",
      "Add at least one wrong option.",
    ],
    [
      "status",
      `Use one of: ${grammarQuestionStatusValues.join(", ")}.`,
    ],
  ])
  instructionsSheet["!cols"] = [{ wch: 28 }, { wch: 96 }]

  XLSX.utils.book_append_sheet(workbook, questionSheet, "Grammar Questions")
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, "Instructions")

  return workbook
}

export function downloadGrammarQuestionImportTemplate() {
  const workbook = createGrammarQuestionImportTemplateWorkbook()
  const data = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
  const blob = new Blob([data], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")

  link.href = url
  link.download = grammarQuestionImportTemplateFileName
  link.click()

  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

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

function normalizeLanguage(value: string) {
  const normalized = value.trim().toLowerCase()

  return grammarQuestionLanguageValues.includes(
    normalized as (typeof grammarQuestionLanguageValues)[number],
  )
    ? normalized
    : ""
}

function normalizeDifficulty(value: string) {
  const normalized = value.trim().toLowerCase()

  return grammarQuestionDifficultyValues.includes(
    normalized as (typeof grammarQuestionDifficultyValues)[number],
  )
    ? normalized
    : ""
}

function normalizeStatus(value: string) {
  const normalized = value.trim().toLowerCase()

  return grammarQuestionStatusValues.includes(
    normalized as (typeof grammarQuestionStatusValues)[number],
  )
    ? normalized
    : ""
}

function validateGrammarImportRowBusinessRules(values: GrammarQuestionImportRowValues) {
  const errors: string[] = []
  const answers = [
    values.answer1,
    values.answer2,
    values.answer3,
    values.answer4,
    values.answer5,
  ].filter((answer) => answer.trim().length > 0)
  const distractors = [values.distractor1, values.distractor2, values.distractor3].filter(
    (distractor) => distractor.trim().length > 0,
  )

  if (answers.length < 1) {
    errors.push("At least one answer is required.")
  }

  if (distractors.length < 1) {
    errors.push("At least one distractor is required.")
  }

  const normalizedAnswers = answers.map((answer) => answer.trim().toLowerCase())
  const normalizedDistractors = distractors.map((distractor) => distractor.trim().toLowerCase())
  const duplicateAnswer = normalizedAnswers.find((answer) => normalizedDistractors.includes(answer))

  if (duplicateAnswer) {
    errors.push("Answers cannot appear in distractors.")
  }

  if (!values.status.trim()) {
    errors.push("A valid status is required.")
  }

  return errors
}

export async function parseGrammarQuestionImportWorkbook(
  file: File,
): Promise<ParsedGrammarQuestionImportWorkbook> {
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  })

  const parsedRows: GrammarQuestionImportRowValues[] = []
  const rowErrors: GrammarQuestionImportRowError[] = []
  const previewRows: GrammarQuestionImportPreviewRow[] = []

  rows.forEach((row, index) => {
    const rowNumber = index + 2
    const normalized = {
      sentenceTemplate: cellValue(row, ["sentence_template", "sentenceTemplate"]),
      answer1: cellValue(row, ["answer_1", "answer1"]),
      answer2: cellValue(row, ["answer_2", "answer2"]),
      answer3: cellValue(row, ["answer_3", "answer3"]),
      answer4: cellValue(row, ["answer_4", "answer4"]),
      answer5: cellValue(row, ["answer_5", "answer5"]),
      language: normalizeLanguage(cellValue(row, ["language"])),
      difficulty: normalizeDifficulty(cellValue(row, ["difficulty"])),
      category: cellValue(row, ["category"]),
      distractor1: cellValue(row, ["distractor_1", "distractor1"]),
      distractor2: cellValue(row, ["distractor_2", "distractor2"]),
      distractor3: cellValue(row, ["distractor_3", "distractor3"]),
      status: normalizeStatus(cellValue(row, ["status"])),
    }

    const validated = grammarQuestionImportRowSchema.safeParse(normalized)

    if (!validated.success) {
      const values = normalized as Partial<GrammarQuestionImportRowValues>
      rowErrors.push({
        rowNumber,
        errors: z.prettifyError(validated.error).split("\n").filter(Boolean),
        values,
      })
      previewRows.push({
        rowNumber,
        values,
        errors: z.prettifyError(validated.error).split("\n").filter(Boolean),
        isValid: false,
      })
      return
    }

    const businessRuleErrors = validateGrammarImportRowBusinessRules(validated.data)

    if (businessRuleErrors.length > 0) {
      rowErrors.push({
        rowNumber,
        errors: businessRuleErrors,
        values: validated.data,
      })
      previewRows.push({
        rowNumber,
        values: validated.data,
        errors: businessRuleErrors,
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
