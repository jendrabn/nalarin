import { z } from "zod"

import { env } from "@/config/env"

import {
  questionDifficultyValues,
  questionTypeValues,
} from "../constants"
import { questionOptionFormSchema } from "../schemas/question"

const questionAiDraftSchema = z.object({
  title: z.string().trim().max(255).default(""),
  type: z.enum(questionTypeValues),
  difficulty: z.enum(questionDifficultyValues),
  scoringRule: z.string().trim().default(""),
  content: z.string().trim().min(20),
  imageUrl: z.string().trim().default(""),
  correctAnswerText: z.string().trim().default(""),
  gradingRubric: z.string().trim().default(""),
  manualExplanation: z.string().trim().default(""),
  aiExplanation: z.string().trim().default(""),
  year: z.string().trim().default(""),
  points: z.string().trim().default("1"),
  options: z.array(questionOptionFormSchema).default([]),
})

const questionAiDraftListSchema = z.object({
  questions: z.array(questionAiDraftSchema).min(1),
})

export type QuestionAiDraft = z.infer<typeof questionAiDraftSchema>

function stripCodeFence(value: string) {
  const trimmed = value.trim()

  if (trimmed.startsWith("```")) {
    return trimmed.replace(/^```[a-z]*\n?/i, "").replace(/```$/, "").trim()
  }

  return trimmed
}

function buildRequestPrompt({
  examTypeName,
  subjectName,
  topicName,
  type,
  difficulty,
  count,
  prompt,
  points,
}: {
  examTypeName: string
  subjectName: string
  topicName: string | null
  type: string
  difficulty: string
  count: number
  prompt: string
  points: number
}) {
  return [
    "You are generating Indonesian academic questions for an exam bank.",
    "Return strict JSON only with this shape: {\"questions\":[...]}",
    "Each question object must include: title, type, difficulty, scoringRule, content, imageUrl, correctAnswerText, gradingRubric, manualExplanation, aiExplanation, year, points, options.",
    "Use empty strings for optional text fields when not needed.",
    "For multiple_choice and multiple_answer, provide options A-E with label, content, imageUrl, isCorrect.",
    "For true_false, provide exactly two options with labels True and False, and set isCorrect false for both.",
    "For short_answer and essay, provide an empty options array.",
    "All text must be in Bahasa Indonesia.",
    `Context: exam type = ${examTypeName}; subject = ${subjectName}; topic = ${topicName ?? "none"}; question type = ${type}; difficulty = ${difficulty}; points = ${points}; count = ${count}.`,
    `User brief: ${prompt}`,
  ].join("\n")
}

export async function generateQuestionDrafts({
  examTypeName,
  subjectName,
  topicName,
  type,
  difficulty,
  count,
  prompt,
  points,
}: {
  examTypeName: string
  subjectName: string
  topicName: string | null
  type: string
  difficulty: string
  count: number
  prompt: string
  points: number
}) {
  const baseUrl = env.AI_BASE_URL ?? "https://api.openai.com/v1"
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.AI_MODEL_QUESTION_GENERATION,
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content:
            "You generate high quality exam bank questions. Respond with valid JSON only.",
        },
        {
          role: "user",
          content: buildRequestPrompt({
            examTypeName,
            subjectName,
            topicName,
            type,
            difficulty,
            count,
            prompt,
            points,
          }),
        },
      ],
    }),
  })

  if (!response.ok) {
    throw new Error("Failed to generate questions from the AI provider.")
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }

  const content = payload.choices?.[0]?.message?.content

  if (!content) {
    throw new Error("AI provider returned an empty response.")
  }

  const parsedJson = JSON.parse(stripCodeFence(content))
  const validated = questionAiDraftListSchema.safeParse(parsedJson)

  if (!validated.success) {
    throw new Error("AI response could not be parsed into questions.")
  }

  return validated.data.questions
}
