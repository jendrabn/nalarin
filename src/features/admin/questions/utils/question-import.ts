import * as XLSX from "xlsx"
import { z } from "zod"

import { questionImportRowSchema, type QuestionImportRowValues } from "../schemas/question"
import { questionTypeValues } from "../constants"

export type QuestionImportRowError = {
  rowNumber: number
  errors: string[]
  values: Partial<QuestionImportRowValues>
}

export type ParsedQuestionImportWorkbook = {
  rows: QuestionImportRowValues[]
  rowErrors: QuestionImportRowError[]
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

function normalizeQuestionType(value: string) {
  const normalized = value.trim().toLowerCase()

  return questionTypeValues.includes(normalized as (typeof questionTypeValues)[number])
    ? normalized
    : ""
}

export async function parseQuestionImportWorkbook(file: File): Promise<ParsedQuestionImportWorkbook> {
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  })

  const parsedRows: QuestionImportRowValues[] = []
  const rowErrors: QuestionImportRowError[] = []

  rows.forEach((row, index) => {
    const rowNumber = index + 2
    const normalized = {
      examTypeSlug: cellValue(row, ["exam_type_slug", "examTypeSlug"]),
      subjectSlug: cellValue(row, ["subject_slug", "subjectSlug"]),
      topicSlug: cellValue(row, ["topic_slug", "topicSlug"]),
      questionType: normalizeQuestionType(cellValue(row, ["question_type", "questionType"])),
      difficulty: cellValue(row, ["difficulty"]),
      questionContent: cellValue(row, ["question_content", "questionContent"]),
      optionA: cellValue(row, ["option_a", "optionA"]),
      optionB: cellValue(row, ["option_b", "optionB"]),
      optionC: cellValue(row, ["option_c", "optionC"]),
      optionD: cellValue(row, ["option_d", "optionD"]),
      optionE: cellValue(row, ["option_e", "optionE"]),
      correctAnswer: cellValue(row, ["correct_answer", "correctAnswer"]),
      scoringRule: cellValue(row, ["scoring_rule", "scoringRule"]),
      explanation: cellValue(row, ["explanation"]),
      year: cellValue(row, ["year"]),
      points: cellValue(row, ["points"]),
    }

    const validated = questionImportRowSchema.safeParse(normalized)

    if (!validated.success) {
      rowErrors.push({
        rowNumber,
        errors: z.prettifyError(validated.error).split("\n").filter(Boolean),
        values: normalized,
      })
      return
    }

    const values = validated.data

    const choiceType = values.questionType === "multiple_choice" || values.questionType === "multiple_answer" || values.questionType === "true_false"

    if (choiceType) {
      const optionValues = [values.optionA, values.optionB, values.optionC, values.optionD, values.optionE]
      const availableOptions = optionValues.filter((item) => item.trim().length > 0)

      if (values.questionType !== "true_false" && availableOptions.length < 2) {
        rowErrors.push({
          rowNumber,
          errors: ["At least two options are required."],
          values,
        })
        return
      }

      if (values.questionType === "true_false") {
        if (values.optionA.trim().length === 0 || values.optionB.trim().length === 0) {
          rowErrors.push({
            rowNumber,
            errors: ["True / False rows require option_a and option_b."],
            values,
          })
          return
        }
      }
    }

    parsedRows.push(values)
  })

  return {
    rows: parsedRows,
    rowErrors,
  }
}
