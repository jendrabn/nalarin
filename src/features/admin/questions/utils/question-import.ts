import * as XLSX from "xlsx"
import { z } from "zod"

import {
  questionOptionLabelValues,
  questionScoringRuleValues,
  questionTrueFalseLabels,
} from "../constants"
import { questionImportRowSchema, type QuestionImportRowValues } from "../schemas"
import { questionTypeValues } from "../constants"
import type {
  QuestionLookupOption,
  SubjectLookupOption,
  TopicLookupOption,
} from "../queries"

export type QuestionImportRowError = {
  rowNumber: number
  errors: string[]
  values: Partial<QuestionImportRowValues>
}

export type ParsedQuestionImportWorkbook = {
  rows: QuestionImportRowValues[]
  rowErrors: QuestionImportRowError[]
}

export type QuestionImportLookupValues = {
  examTypes: QuestionLookupOption[]
  subjects: SubjectLookupOption[]
  topics: TopicLookupOption[]
}

type QuestionOptionLabel = (typeof questionOptionLabelValues)[number]

export const questionImportTemplateFileName = "question-import-template.xlsx"

export const questionImportTemplateHeaders = [
  "exam_type_slug",
  "subject_slug",
  "topic_slug",
  "question_type",
  "difficulty",
  "title",
  "question_content",
  "image_url",
  ...questionOptionLabelValues.map((label) => `option_${label.toLowerCase()}`),
  "correct_answer",
  "correct_answer_text",
  "scoring_rule",
  "grading_rubric",
  "explanation",
  "year",
  "points",
  "status",
] as const

function getQuestionImportOptionValues(values: QuestionImportRowValues) {
  return questionOptionLabelValues.map((label) => {
    const key = `option${label}` as keyof QuestionImportRowValues

    return values[key]
  })
}

export function createQuestionImportTemplateWorkbook() {
  const workbook = XLSX.utils.book_new()
  const questionSheet = XLSX.utils.aoa_to_sheet([[...questionImportTemplateHeaders]])
  questionSheet["!cols"] = questionImportTemplateHeaders.map((header) => ({
    wch: Math.max(header.length, 14),
  }))

  const instructionsSheet = XLSX.utils.aoa_to_sheet([
    ["Field", "Guidance"],
    [
      "title, question_content, image_url, grading_rubric, explanation, year, points, status",
      "Use the same values you would enter in the create/edit form. Status accepts draft, published, or archived.",
    ],
    [
      "option_a to option_j",
      "Use up to 10 options for multiple_choice and multiple_answer. Leave unused cells blank.",
    ],
    [
      "correct_answer",
      "Use for multiple_choice and multiple_answer. Enter one letter such as A, or multiple letters separated by commas such as A,C,J.",
    ],
    [
      "correct_answer_text",
      `Use for true_false and short_answer. For true_false, enter true or false. Fill option_a as ${questionTrueFalseLabels[0]} and option_b as ${questionTrueFalseLabels[1]}.`,
    ],
  ])
  instructionsSheet["!cols"] = [{ wch: 28 }, { wch: 96 }]

  XLSX.utils.book_append_sheet(workbook, questionSheet, "Questions")
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, "Instructions")

  return workbook
}

export function downloadQuestionImportTemplate() {
  const workbook = createQuestionImportTemplateWorkbook()
  const data = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
  const blob = new Blob([data], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")

  link.href = url
  link.download = questionImportTemplateFileName
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

function normalizeQuestionType(value: string) {
  const normalized = value.trim().toLowerCase()

  return questionTypeValues.includes(normalized as (typeof questionTypeValues)[number])
    ? normalized
    : ""
}

function validateImportRowAgainstLookups(
  values: QuestionImportRowValues,
  lookups?: QuestionImportLookupValues,
) {
  if (!lookups) {
    return []
  }

  const errors: string[] = []
  const examType = lookups.examTypes.find(
    (item) => item.slug === values.examTypeSlug,
  )

  if (!examType) {
    errors.push(`Unknown exam_type_slug: ${values.examTypeSlug}.`)
    return errors
  }

  const subject = lookups.subjects.find(
    (item) =>
      item.slug === values.subjectSlug &&
      item.examTypeId === examType.id,
  )

  if (!subject) {
    errors.push(
      `Unknown subject_slug for ${values.examTypeSlug}: ${values.subjectSlug}.`,
    )
    return errors
  }

  if (values.topicSlug.trim().length > 0) {
    const topic = lookups.topics.find(
      (item) =>
        item.slug === values.topicSlug &&
        item.subjectId === subject.id,
    )

    if (!topic) {
      errors.push(
        `Unknown topic_slug for ${values.subjectSlug}: ${values.topicSlug}.`,
      )
    }
  }

  return errors
}

function validateImportRowBusinessRules(values: QuestionImportRowValues) {
  const errors: string[] = []
  const points = Number(values.points)

  if (!values.points.trim() || !Number.isFinite(points) || points <= 0) {
    errors.push("points must be greater than 0.")
  }

  if (
    values.scoringRule.trim().length > 0 &&
    !questionScoringRuleValues.includes(
      values.scoringRule as (typeof questionScoringRuleValues)[number],
    )
  ) {
    errors.push("scoring_rule must be all_or_nothing, partial, or blank.")
  }

  if (values.questionType === "multiple_answer" && !values.scoringRule.trim()) {
    errors.push("scoring_rule is required for multiple_answer.")
  }

  if (
    values.questionType !== "multiple_answer" &&
    values.scoringRule.trim().length > 0
  ) {
    errors.push("scoring_rule is only used for multiple_answer.")
  }

  if (values.questionType === "true_false") {
    const normalizedAnswer = values.correctAnswerText.trim().toLowerCase()

    if (normalizedAnswer !== "true" && normalizedAnswer !== "false") {
      errors.push("correct_answer_text must be true or false for true_false.")
    }
  }

  return errors
}

export async function parseQuestionImportWorkbook(
  file: File,
  lookups?: QuestionImportLookupValues,
): Promise<ParsedQuestionImportWorkbook> {
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
      title: cellValue(row, ["title"]),
      questionContent: cellValue(row, ["question_content", "questionContent"]),
      imageUrl: cellValue(row, ["image_url", "imageUrl"]),
      optionA: cellValue(row, ["option_a", "optionA"]),
      optionB: cellValue(row, ["option_b", "optionB"]),
      optionC: cellValue(row, ["option_c", "optionC"]),
      optionD: cellValue(row, ["option_d", "optionD"]),
      optionE: cellValue(row, ["option_e", "optionE"]),
      optionF: cellValue(row, ["option_f", "optionF"]),
      optionG: cellValue(row, ["option_g", "optionG"]),
      optionH: cellValue(row, ["option_h", "optionH"]),
      optionI: cellValue(row, ["option_i", "optionI"]),
      optionJ: cellValue(row, ["option_j", "optionJ"]),
      correctAnswer: cellValue(row, ["correct_answer", "correctAnswer"]),
      correctAnswerText: cellValue(row, ["correct_answer_text", "correctAnswerText"]),
      scoringRule: cellValue(row, ["scoring_rule", "scoringRule"]),
      gradingRubric: cellValue(row, ["grading_rubric", "gradingRubric"]),
      explanation: cellValue(row, ["explanation"]),
      year: cellValue(row, ["year"]),
      points: cellValue(row, ["points"]),
      status: cellValue(row, ["status"]),
    }

    const validated = questionImportRowSchema.safeParse(normalized)

    if (!validated.success) {
      rowErrors.push({
        rowNumber,
        errors: z.prettifyError(validated.error).split("\n").filter(Boolean),
        values: normalized as Partial<QuestionImportRowValues>,
      })
      return
    }

    const values = validated.data
    const businessRuleErrors = [
      ...validateImportRowAgainstLookups(values, lookups),
      ...validateImportRowBusinessRules(values),
    ]

    if (businessRuleErrors.length > 0) {
      rowErrors.push({
        rowNumber,
        errors: businessRuleErrors,
        values,
      })
      return
    }

    const choiceType = values.questionType === "multiple_choice" || values.questionType === "multiple_answer" || values.questionType === "true_false"

    if (choiceType) {
      const optionValues = getQuestionImportOptionValues(values)
      const availableOptions = optionValues.filter((item) => item.trim().length > 0)
      const availableLabels = questionOptionLabelValues.filter(
        (_, index) => optionValues[index].trim().length > 0,
      )
      const rawCorrectLabels = values.correctAnswer
        .split(",")
        .map((item) => item.trim().toUpperCase())
        .filter(Boolean)
      const correctLabels = rawCorrectLabels
        .filter((item): item is QuestionOptionLabel =>
          questionOptionLabelValues.includes(item as QuestionOptionLabel),
        )
      const hasInvalidCorrectLabel = rawCorrectLabels.length !== correctLabels.length

      if (values.questionType !== "true_false" && availableOptions.length < 2) {
        rowErrors.push({
          rowNumber,
          errors: ["At least two options are required."],
          values,
        })
        return
      }

      if (values.questionType === "multiple_choice") {
        if (
          hasInvalidCorrectLabel ||
          correctLabels.length !== 1 ||
          !availableLabels.includes(correctLabels[0])
        ) {
          rowErrors.push({
            rowNumber,
            errors: ["Multiple choice rows must use one correct answer that matches a filled option."],
            values,
          })
          return
        }
      }

      if (values.questionType === "multiple_answer") {
        if (
          correctLabels.length < 2 ||
          hasInvalidCorrectLabel ||
          correctLabels.some((label) => !availableLabels.includes(label))
        ) {
          rowErrors.push({
            rowNumber,
            errors: ["Multiple answer rows must use at least two correct answers that match filled options."],
            values,
          })
          return
        }
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
