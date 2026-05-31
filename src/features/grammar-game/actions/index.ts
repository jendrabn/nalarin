"use server"

import { z } from "zod"

import { normalizeGrammarText, parseGrammarSentenceTemplate } from "../utils"
import { getGrammarQuestionForGrading } from "../queries"
import type {
  GrammarQuestionSubmission,
  GrammarQuestionSubmissionResult,
} from "../types"

const grammarQuestionSubmissionSchema = z.object({
  questionId: z.number().int().positive(),
  answers: z
    .array(
      z.object({
        order: z.number().int().positive(),
        answer: z.string().trim().default(""),
      }),
    )
    .min(1),
})

export async function gradeGrammarQuestionAction(
  payload: GrammarQuestionSubmission,
): Promise<
  | { success: false; message: string }
  | { success: true; data: GrammarQuestionSubmissionResult }
> {
  const validated = grammarQuestionSubmissionSchema.safeParse(payload)

  if (!validated.success) {
    return {
      success: false,
      message: "Please complete the answers first.",
    }
  }

  const question = await getGrammarQuestionForGrading(validated.data.questionId)

  if (!question) {
    return {
      success: false,
      message: "Grammar question not found.",
    }
  }

  const template = parseGrammarSentenceTemplate(question.sentenceTemplate)

  if (template.errors.length > 0) {
    return {
      success: false,
      message: "This grammar question is not ready for grading.",
    }
  }

  const answerMap = new Map(
    (question.answers ?? []).map((entry) => [entry.order, entry.answer.trim()]),
  )
  const selectedMap = new Map(
    validated.data.answers.map((entry) => [entry.order, entry.answer.trim()]),
  )

  const blankResults = template.placeholderOrders.map((order) => {
    const correctAnswer = answerMap.get(order) ?? ""
    const selectedAnswer = selectedMap.get(order) ?? ""
    const isCorrect =
      normalizeGrammarText(selectedAnswer) === normalizeGrammarText(correctAnswer)

    return {
      order,
      selectedAnswer,
      correctAnswer,
      isCorrect,
    }
  })

  return {
    success: true,
    data: {
      questionId: validated.data.questionId,
      blankResults,
      correctCount: blankResults.filter((item) => item.isCorrect).length,
      totalCount: blankResults.length,
    },
  }
}
