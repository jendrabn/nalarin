import "server-only"

import { and, eq, gt } from "drizzle-orm"

import { env } from "@/config/env"
import { PLAN_CONFIG, type PlanCode } from "@/config/plans"
import { db, schema } from "@/db"
import { isFeatureReleased } from "@/features/tryouts/utils/status"

import type {
  AiExplanationContext,
  AiExplanationSessionType,
} from "./types"
import type {
  PracticeCorrectAnswerSnapshot,
  PracticeOptionSnapshot,
  PracticeQuestionSnapshot,
} from "@/features/practices/types"

type AiExplanationRequest = {
  userId: number
  sessionType: AiExplanationSessionType
  sessionId: number
  sessionQuestionId: number
}

type OpenAiCompatibleResponse = {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
}

const ALLOWED_HTML_TAGS = new Set([
  "section",
  "h3",
  "h4",
  "p",
  "ul",
  "ol",
  "li",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "code",
  "pre",
  "br",
  "figure",
  "figcaption",
  "img",
  "a",
])

const BASE_REQUIRED_SECTION_TITLES = [
  "Jawaban yang Benar",
  "Penjelasan Konsep",
  "Tips dan Trik",
]

export async function userCanAccessAiExplanation(userId: number) {
  const planCode = await getActivePlanCode(userId)

  return PLAN_CONFIG[planCode].access.aiExplanation
}

export async function generateAiExplanation(input: AiExplanationRequest) {
  const planCode = await getActivePlanCode(input.userId)

  if (!PLAN_CONFIG[planCode].access.aiExplanation) {
    return {
      success: false,
      status: 403,
      message: "Pembahasan AI hanya tersedia untuk paket Pro dan Max.",
    } as const
  }

  const context =
    input.sessionType === "practice"
      ? await getPracticeAiExplanationContext(input)
      : await getTryoutAiExplanationContext(input)

  if (!context) {
    return {
      success: false,
      status: 404,
      message: "Data soal tidak ditemukan atau belum bisa dibahas.",
    } as const
  }

  const html = await requestAiExplanationHtml(context)

  return {
    success: true,
    status: 200,
    html,
  } as const
}

async function getActivePlanCode(userId: number): Promise<PlanCode> {
  const now = new Date()
  const [subscription] = await db
    .select({ planCode: schema.subscriptions.planCode })
    .from(schema.subscriptions)
    .where(
      and(
        eq(schema.subscriptions.userId, userId),
        eq(schema.subscriptions.status, "active"),
        gt(schema.subscriptions.endsAt, now),
      ),
    )
    .limit(1)

  return subscription?.planCode ?? "free"
}

async function getPracticeAiExplanationContext({
  userId,
  sessionId,
  sessionQuestionId,
}: AiExplanationRequest): Promise<AiExplanationContext | null> {
  const [row] = await db
    .select({
      mode: schema.practiceSessions.mode,
      sessionStatus: schema.practiceSessions.status,
      examTypeName: schema.examTypes.name,
      subjectName: schema.subjects.name,
      topicName: schema.topics.name,
      questionSnapshot: schema.practiceSessionQuestions.questionSnapshot,
      optionSnapshot: schema.practiceSessionQuestions.optionSnapshot,
      correctAnswerSnapshot: schema.practiceSessionQuestions.correctAnswerSnapshot,
      selectedOptionKeys: schema.practiceAnswers.selectedOptionKeys,
      answerText: schema.practiceAnswers.answerText,
      isCorrect: schema.practiceAnswers.isCorrect,
      answerGradedAt: schema.practiceAnswers.gradedAt,
      manualExplanation: schema.questions.explanation,
    })
    .from(schema.practiceSessionQuestions)
    .innerJoin(
      schema.practiceSessions,
      eq(schema.practiceSessionQuestions.practiceSessionId, schema.practiceSessions.id),
    )
    .innerJoin(schema.practices, eq(schema.practiceSessions.practiceId, schema.practices.id))
    .innerJoin(schema.examTypes, eq(schema.practices.examTypeId, schema.examTypes.id))
    .innerJoin(schema.subjects, eq(schema.practices.subjectId, schema.subjects.id))
    .innerJoin(schema.questions, eq(schema.practiceSessionQuestions.questionId, schema.questions.id))
    .leftJoin(schema.topics, eq(schema.questions.topicId, schema.topics.id))
    .leftJoin(
      schema.practiceAnswers,
      eq(schema.practiceSessionQuestions.id, schema.practiceAnswers.practiceSessionQuestionId),
    )
    .where(
      and(
        eq(schema.practiceSessions.id, sessionId),
        eq(schema.practiceSessions.userId, userId),
        eq(schema.practiceSessionQuestions.id, sessionQuestionId),
      ),
    )
    .limit(1)

  if (!row) {
    return null
  }

  const canExplainInPracticeRoom =
    row.mode === "practice" &&
    row.sessionStatus === "in_progress" &&
    Boolean(row.answerGradedAt)
  const canExplainInReview =
    row.sessionStatus === "submitted" ||
    row.sessionStatus === "grading" ||
    row.sessionStatus === "graded"

  if (!canExplainInPracticeRoom && !canExplainInReview) {
    return null
  }

  return {
    examTypeName: row.examTypeName,
    subjectName: row.subjectName,
    topicName: row.topicName ?? null,
    question: normalizeQuestionSnapshot(row.questionSnapshot),
    options: normalizeOptionSnapshot(row.optionSnapshot, row.questionSnapshot),
    correctAnswer: normalizeCorrectAnswerSnapshot(
      row.correctAnswerSnapshot,
      row.questionSnapshot,
    ),
    answer: row.answerGradedAt
      ? {
          selectedOptionKeys: normalizeSelectedOptionKeys(row.selectedOptionKeys),
          answerText: row.answerText ?? "",
          isCorrect: row.isCorrect,
        }
      : null,
    manualExplanation: row.manualExplanation ?? null,
  }
}

async function getTryoutAiExplanationContext({
  userId,
  sessionId,
  sessionQuestionId,
}: AiExplanationRequest): Promise<AiExplanationContext | null> {
  const [row] = await db
    .select({
      sessionStatus: schema.tryoutSessions.status,
      showResultAfterSubmit: schema.tryouts.showResultAfterSubmit,
      resultReleaseAt: schema.tryouts.resultReleaseAt,
      examTypeName: schema.examTypes.name,
      subjectName: schema.subjects.name,
      topicName: schema.topics.name,
      questionSnapshot: schema.tryoutSessionQuestions.questionSnapshot,
      optionSnapshot: schema.tryoutSessionQuestions.optionSnapshot,
      correctAnswerSnapshot: schema.tryoutSessionQuestions.correctAnswerSnapshot,
      selectedOptionKeys: schema.tryoutAnswers.selectedOptionKeys,
      answerText: schema.tryoutAnswers.answerText,
      isCorrect: schema.tryoutAnswers.isCorrect,
      manualExplanation: schema.questions.explanation,
    })
    .from(schema.tryoutSessionQuestions)
    .innerJoin(
      schema.tryoutSessions,
      eq(schema.tryoutSessionQuestions.tryoutSessionId, schema.tryoutSessions.id),
    )
    .innerJoin(schema.tryouts, eq(schema.tryoutSessions.tryoutId, schema.tryouts.id))
    .innerJoin(schema.examTypes, eq(schema.tryouts.examTypeId, schema.examTypes.id))
    .innerJoin(
      schema.tryoutSectionSessions,
      eq(
        schema.tryoutSessionQuestions.tryoutSectionSessionId,
        schema.tryoutSectionSessions.id,
      ),
    )
    .innerJoin(
      schema.tryoutSections,
      eq(schema.tryoutSectionSessions.tryoutSectionId, schema.tryoutSections.id),
    )
    .innerJoin(schema.subjects, eq(schema.tryoutSections.subjectId, schema.subjects.id))
    .innerJoin(schema.questions, eq(schema.tryoutSessionQuestions.questionId, schema.questions.id))
    .leftJoin(schema.topics, eq(schema.questions.topicId, schema.topics.id))
    .leftJoin(
      schema.tryoutAnswers,
      eq(schema.tryoutSessionQuestions.id, schema.tryoutAnswers.tryoutSessionQuestionId),
    )
    .where(
      and(
        eq(schema.tryoutSessions.id, sessionId),
        eq(schema.tryoutSessions.userId, userId),
        eq(schema.tryoutSessionQuestions.id, sessionQuestionId),
      ),
    )
    .limit(1)

  if (!row) {
    return null
  }

  const resultAvailable = isFeatureReleased(
    {
      enabled: row.showResultAfterSubmit,
      releaseAt: row.resultReleaseAt?.toISOString() ?? null,
    },
    new Date(),
  )

  if (
    !resultAvailable ||
    (row.sessionStatus !== "submitted" &&
      row.sessionStatus !== "grading" &&
      row.sessionStatus !== "graded")
  ) {
    return null
  }

  return {
    examTypeName: row.examTypeName,
    subjectName: row.subjectName,
    topicName: row.topicName ?? null,
    question: normalizeQuestionSnapshot(row.questionSnapshot),
    options: normalizeOptionSnapshot(row.optionSnapshot, row.questionSnapshot),
    correctAnswer: normalizeCorrectAnswerSnapshot(
      row.correctAnswerSnapshot,
      row.questionSnapshot,
    ),
    answer:
      row.selectedOptionKeys !== null || row.answerText !== null
        ? {
            selectedOptionKeys: normalizeSelectedOptionKeys(row.selectedOptionKeys),
            answerText: row.answerText ?? "",
            isCorrect: row.isCorrect,
          }
        : null,
    manualExplanation: row.manualExplanation ?? null,
  }
}

async function requestAiExplanationHtml(context: AiExplanationContext) {
  const firstHtml = await requestAiExplanationFromProvider(context)
  const firstValidation = validateAiExplanationHtml(firstHtml, context)

  if (firstValidation.valid) {
    return firstHtml
  }

  const retryHtml = await requestAiExplanationFromProvider(
    context,
    `Respons sebelumnya ditolak karena: ${firstValidation.reason}. Buat ulang dari nol dan patuhi struktur HTML serta semua heading yang diminta.`,
  )
  const retryValidation = validateAiExplanationHtml(retryHtml, context)

  if (!retryValidation.valid) {
    console.warn("AI explanation format fallback used:", retryValidation.reason)
    return buildStructuredFallbackHtml(context, retryHtml)
  }

  return retryHtml
}

async function requestAiExplanationFromProvider(
  context: AiExplanationContext,
  correctionInstruction?: string,
) {
  const response = await fetch(`${getAiBaseUrl()}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.AI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: env.AI_MODEL_EXPLANATION_GENERATION,
      temperature: 0.2,
      top_p: 0.9,
      frequency_penalty: 0.15,
      presence_penalty: 0,
      max_tokens: 3600,
      messages: [
        {
          role: "system",
          content:
            "You are an expert exam-preparation tutor and friendly Indonesian educational writer. Follow the user's template strictly. Write the final explanation in natural Bahasa Indonesia with a warm second-person tone using 'kamu'. Never call the learner 'user', 'pengguna', 'siswa', or 'peserta' in the output. Keep standard technical, Latin, or English terms as-is when they are normally used as-is. Never invent facts, formulas, sources, images, or reasoning that cannot be supported by the provided question context. If the context is insufficient, explicitly say that you do not know or that the available information is not enough. Return only a safe HTML fragment: no markdown, no html/body tags, no scripts, no inline styles, and no CSS classes.",
        },
        {
          role: "user",
          content: buildAiExplanationPrompt(context, correctionInstruction),
        },
      ],
    }),
  })

  if (!response.ok) {
    throw new Error("AI provider gagal merespons.")
  }

  const payload = (await response.json()) as OpenAiCompatibleResponse
  const content = payload.choices?.[0]?.message?.content?.trim()

  if (!content) {
    throw new Error("AI provider tidak mengembalikan pembahasan.")
  }

  return sanitizeAiExplanationHtml(convertMarkdownLikeHeadingsToHtml(stripHtmlCodeFence(content)))
}

function buildAiExplanationPrompt(
  context: AiExplanationContext,
  correctionInstruction?: string,
) {
  const answerStatus = getAnswerStatus(context.answer)
  const optionsBlock =
    context.options.length > 0
      ? context.options
          .map((option) => `${option.label}. ${toPlainText(option.content)}`)
          .join("\n")
      : "-"
  const correctAnswer = getCorrectAnswerLabel(context)
  const userAnswer = getUserAnswerLabel(context)
  const manualExplanation = context.manualExplanation
    ? `\nPembahasan dari admin:\n${toPlainText(context.manualExplanation)}\n`
    : ""

  return `You are an expert tutor for ${context.examTypeName} - ${context.subjectName}.

Create a high-quality explanation for the following exam-preparation question. The explanation must be clear, structured, concrete, and easy to understand.

IMPORTANT LANGUAGE RULE:
- Write the explanation content in Bahasa Indonesia.
- Keep standard technical, Latin, or English terms as-is when translating them would sound unnatural or reduce precision.

---
QUESTION INFORMATION
Question type: ${context.question.type}
Topic: ${context.topicName ?? "-"}
Question: ${toPlainText(context.question.content)}
${context.options.length > 0 ? `Options:\n${optionsBlock}` : ""}
Correct answer: ${correctAnswer}
Learner answer (refer to this as "jawaban kamu" in the output): ${userAnswer}
Learner answer status: ${answerStatus}
${manualExplanation}
---

EXPLANATION INSTRUCTIONS:

Write the explanation in this exact section order. Use a clear <h3> heading for each section:

1. Jawaban yang Benar
   State the correct answer and explain why it is correct. Start from the underlying concept or principle, not merely "the answer is...".

2. Penjelasan Konsep
   Explain the core concept, theory, or reasoning being tested. Use simple but precise language. Include concrete examples when useful. Do not only compute the final result; explain the thinking process and why each step matters.

3. Analisis Jawaban Kamu
   Include this section only when the learner answer is wrong, empty, or not graded. Explain empathetically why the learner's answer is not quite right. Identify the likely misconception or trap, then correct it.

4. Tips dan Trik
   Give 1-2 practical strategies or time-saving techniques for similar exam questions. Close with one key sentence the user should remember.

CRITICAL ACCURACY RULES:
- Never fabricate facts, formulas, concepts, sources, image URLs, or reasoning.
- Use only the question, options, correct answer, learner answer, topic, exam context, and manual explanation provided above.
- If the correct reasoning cannot be determined from the available context, explicitly say in Bahasa Indonesia: "Saya tidak tahu dari konteks soal yang tersedia" or "Informasi pada soal belum cukup untuk memastikan alasan lengkapnya."
- Do not present uncertain assumptions as facts. If you make an inference, label it clearly as an inference from the available context.
- The correct answer is provided by the system. You may explain it, but if the reasoning is unclear from the question context, say so instead of inventing a reason.

WRITING RULES:
- Every included section must be substantive. Do not answer with a single short sentence.
- For very simple questions, still explain one main method and one quick check or alternative way to verify the answer.
- Use natural, clear, non-stiff Bahasa Indonesia.
- Use a friendly second-person tone. Address the learner as "kamu", not "user", "pengguna", "siswa", or "peserta".
- When discussing the learner answer, write phrases such as "Jawaban kamu adalah...", "Pilihanmu menunjukkan...", or "Kamu sudah benar saat...".
- Never output phrases like "Jawaban user", "User memilih", "status jawaban user", or any wording that sounds like internal product data.
- Avoid opening phrases like "Baik, saya akan menjelaskan..." or "Tentu saja...".
- Go directly into the substance of each section.
- If the learner answer status is "benar", skip "Analisis Jawaban Kamu" and include a brief positive reinforcement in "Tips dan Trik".
- Do not create "Analisis Pilihan Jawaban" or "Rangkuman" sections; keep the explanation focused.
- Return an HTML fragment only, not Markdown.
- Each section must be wrapped in <section> and must use <h3>.
- Allowed text tags: <section>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>, <code>, <pre>, and <br>.
- Optional visual aid: if, and only if, you are confident a stable public HTTPS image URL from a reputable educational/reference source is directly relevant, include it as <figure><img src="https://..." alt="..."><figcaption>...</figcaption></figure>. Do not invent image URLs. Omit the visual aid when unsure.
- You may include a plain supporting source link only when it is directly relevant and public HTTPS, using <a href="https://...">label</a>.
- Do not use tables, CSS classes, inline styles, html/body tags, or scripts.
- Do not hallucinate facts beyond the question context. If context is limited, say you do not know from the available context instead of filling the gap with guesses.
${correctionInstruction ? `\nCORRECTION INSTRUCTION:\n${correctionInstruction}` : ""}`
}

function validateAiExplanationHtml(html: string, context: AiExplanationContext) {
  if (!/<h3>\s*[^<]+\s*<\/h3>/i.test(html) || !/<section>\s*/i.test(html)) {
    return {
      valid: false,
      reason: "respons tidak memakai HTML section dan heading h3",
    }
  }

  const requiredTitles = getRequiredSectionTitles(context)
  const headings = Array.from(html.matchAll(/<h3>\s*([^<]+)\s*<\/h3>/gi)).map((match) =>
    normalizeSectionTitle(match[1] ?? ""),
  )
  const missingTitles = requiredTitles.filter(
    (title) => !headings.some((heading) => heading.includes(normalizeSectionTitle(title))),
  )

  if (missingTitles.length > 0) {
    return {
      valid: false,
      reason: `heading wajib belum lengkap: ${missingTitles.join(", ")}`,
    }
  }

  const plainText = toPlainText(html)

  if (plainText.length < 550) {
    return {
      valid: false,
      reason: "pembahasan terlalu pendek dan tidak substantif",
    }
  }

  if (hasUnfriendlyLearnerLabel(plainText)) {
    return {
      valid: false,
      reason: "pembahasan masih memakai label internal seperti user/pengguna/siswa",
    }
  }

  return { valid: true, reason: null }
}

function buildStructuredFallbackHtml(context: AiExplanationContext, providerHtml: string) {
  const answerStatus = getAnswerStatus(context.answer)
  const correctAnswer = getCorrectAnswerLabel(context)
  const userAnswer = getUserAnswerLabel(context)
  const providerText = toPlainText(providerHtml)
  const providerInsight =
    providerText.length >= 80 && !hasUnfriendlyLearnerLabel(providerText)
      ? `<p>${escapeHtml(providerText)}</p>`
      : ""
  const sections = [
    buildFallbackSection(
      "Jawaban yang Benar",
      `<p>Jawaban yang benar adalah <strong>${escapeHtml(correctAnswer)}</strong>.</p>${providerInsight || "<p>Informasi pada soal belum cukup untuk memastikan alasan lengkapnya tanpa membuat asumsi tambahan.</p>"}`,
    ),
    buildFallbackSection(
      "Penjelasan Konsep",
      `<p>Soal ini perlu dikerjakan dengan membaca maksud pertanyaan terlebih dahulu, lalu menghubungkannya dengan konsep dasar yang sedang diuji. Fokus utamanya adalah memahami hubungan antara data pada soal, proses yang diminta, dan bentuk jawaban akhir yang sesuai.</p><p>Jika soal memuat perhitungan, kerjakan langkahnya secara bertahap dan cek kembali hasil akhir terhadap pertanyaan. Jika soal memuat konsep verbal, cari kata kunci utama lalu cocokkan dengan prinsip yang relevan.</p>`,
    ),
  ]

  if (answerStatus !== "benar") {
    sections.push(
      buildFallbackSection(
        "Analisis Jawaban Kamu",
        answerStatus === "tidak dijawab"
          ? `<p>Kamu belum menjawab soal ini. Untuk soal seperti ini, mulai dari identifikasi apa yang ditanyakan, tandai informasi penting, lalu eliminasi pilihan yang jelas tidak sesuai.</p>`
          : `<p>Jawaban kamu adalah <strong>${escapeHtml(userAnswer)}</strong>. Jawaban ini belum tepat dibandingkan kunci <strong>${escapeHtml(correctAnswer)}</strong>. Kemungkinan jebakannya adalah terlalu cepat memilih jawaban sebelum memastikan seluruh langkah atau alasan sudah sesuai dengan pertanyaan.</p>`,
      ),
    )
  }

  sections.push(
    buildFallbackSection(
      "Tips dan Trik",
      `<ul><li>Baca kalimat pertanyaan terakhir terlebih dahulu agar tahu target jawaban.</li><li>Kerjakan dengan langkah kecil dan cocokkan hasilnya dengan pilihan atau format jawaban yang diminta.</li><li>Ingat kunci akhirnya: <strong>${escapeHtml(correctAnswer)}</strong>, dan biasakan mengecek alasan, bukan hanya hasil akhir.</li></ul>`,
    ),
  )

  return sections.join("")
}

function hasUnfriendlyLearnerLabel(value: string) {
  return [
    /\buser\b/i,
    /jawaban\s+pengguna/i,
    /pengguna\s+memilih/i,
    /jawaban\s+siswa/i,
    /siswa\s+memilih/i,
    /jawaban\s+peserta/i,
    /peserta\s+memilih/i,
  ].some((pattern) => pattern.test(value))
}

function buildFallbackSection(title: string, content: string) {
  return `<section><h3>${escapeHtml(title)}</h3>${content}</section>`
}

function getRequiredSectionTitles(context: AiExplanationContext) {
  const titles = [...BASE_REQUIRED_SECTION_TITLES]

  if (getAnswerStatus(context.answer) !== "benar") {
    titles.splice(2, 0, "Analisis Jawaban Kamu")
  }

  return titles
}

function normalizeSectionTitle(value: string) {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
}

function convertMarkdownLikeHeadingsToHtml(value: string) {
  if (/<h3>\s*[^<]+\s*<\/h3>/i.test(value)) {
    return value
  }

  const knownTitles = [
    "Jawaban yang Benar",
    "Penjelasan Konsep",
    "Analisis Jawaban Kamu",
    "Tips dan Trik",
  ]
  const lines = value.split(/\r?\n/)
  const output: string[] = []
  let sectionOpen = false

  for (const line of lines) {
    const trimmed = line.trim()
    const title = knownTitles.find((item) => {
      const pattern = new RegExp(
        `^(?:#{1,6}\\s*)?(?:\\d+\\.\\s*)?(?:\\*\\*)?${escapeRegExp(item)}(?:\\*\\*)?\\s*:?$`,
        "i",
      )

      return pattern.test(trimmed)
    })

    if (title) {
      if (sectionOpen) {
        output.push("</section>")
      }

      output.push(`<section><h3>${title}</h3>`)
      sectionOpen = true
      continue
    }

    output.push(line)
  }

  if (sectionOpen) {
    output.push("</section>")
  }

  return output.join("\n")
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function getAiBaseUrl() {
  return (env.AI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/+$/, "")
}

function stripHtmlCodeFence(value: string) {
  return value
    .replace(/^```(?:html)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim()
}

function sanitizeAiExplanationHtml(value: string) {
  const withoutDangerousBlocks = value
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\s*(script|style|iframe|object|embed|link|meta|base)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*(script|style|iframe|object|embed|link|meta|base)[^>]*\/?\s*>/gi, "")

  return withoutDangerousBlocks.replace(
    /<\s*(\/?)\s*([a-zA-Z][a-zA-Z0-9-]*)([^>]*)>/g,
    (_match, closing: string, tagName: string, rawAttributes: string) => {
      const tag = tagName.toLowerCase()

      if (!ALLOWED_HTML_TAGS.has(tag)) {
        return ""
      }

      if (closing) {
        return tag === "img" || tag === "br" ? "" : `</${tag}>`
      }

      if (tag === "br") {
        return "<br>"
      }

      if (tag === "img") {
        const src = getSafeHttpsAttribute(rawAttributes, "src")

        if (!src || !isLikelyImageUrl(src)) {
          return ""
        }

        const alt = getSafeTextAttribute(rawAttributes, "alt") ?? "Ilustrasi pembahasan"

        return `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="lazy" referrerpolicy="no-referrer">`
      }

      if (tag === "a") {
        const href = getSafeHttpsAttribute(rawAttributes, "href")

        if (!href) {
          return ""
        }

        return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">`
      }

      return `<${tag}>`
    },
  )
}

function getSafeHttpsAttribute(rawAttributes: string, name: string) {
  const value = getRawAttribute(rawAttributes, name)

  if (!value) {
    return null
  }

  try {
    const url = new URL(value)

    if (url.protocol !== "https:") {
      return null
    }

    return url.toString()
  } catch {
    return null
  }
}

function getSafeTextAttribute(rawAttributes: string, name: string) {
  const value = getRawAttribute(rawAttributes, name)

  if (!value) {
    return null
  }

  return value.replace(/\s+/g, " ").trim().slice(0, 160)
}

function getRawAttribute(rawAttributes: string, name: string) {
  const pattern = new RegExp(`${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i")
  const match = rawAttributes.match(pattern)

  return match?.[1] ?? match?.[2] ?? match?.[3] ?? null
}

function isLikelyImageUrl(value: string) {
  try {
    const url = new URL(value)
    const pathname = url.pathname.toLowerCase()

    return (
      pathname.endsWith(".jpg") ||
      pathname.endsWith(".jpeg") ||
      pathname.endsWith(".png") ||
      pathname.endsWith(".webp") ||
      pathname.endsWith(".gif") ||
      pathname.endsWith(".svg")
    )
  } catch {
    return false
  }
}

function normalizeQuestionSnapshot(value: unknown): PracticeQuestionSnapshot {
  const snapshot = value as Partial<PracticeQuestionSnapshot>

  return {
    id: Number(snapshot.id ?? 0),
    title: typeof snapshot.title === "string" ? snapshot.title : null,
    content: typeof snapshot.content === "string" ? snapshot.content : "",
    type: snapshot.type ?? "multiple_choice",
    difficulty: snapshot.difficulty ?? "medium",
    scoringRule: snapshot.scoringRule ?? null,
    imageUrl: typeof snapshot.imageUrl === "string" ? snapshot.imageUrl : null,
    explanation: typeof snapshot.explanation === "string" ? snapshot.explanation : null,
    year: typeof snapshot.year === "number" ? snapshot.year : null,
    points: Number(snapshot.points ?? 0),
  }
}

function normalizeOptionSnapshot(value: unknown, questionValue?: unknown): PracticeOptionSnapshot[] {
  if (!Array.isArray(value)) {
    return []
  }

  const question = questionValue as Partial<PracticeQuestionSnapshot>

  return value.map((option, index) => {
    const item = option as Partial<PracticeOptionSnapshot>
    const rawLabel = typeof item.label === "string" ? item.label : ""
    const content = typeof item.content === "string" ? item.content : ""

    return {
      id: Number(item.id ?? 0),
      label:
        question.type === "true_false"
          ? getTrueFalseOptionLabel(rawLabel, content, index)
          : rawLabel,
      content,
      imageUrl: typeof item.imageUrl === "string" ? item.imageUrl : null,
    }
  })
}

function normalizeCorrectAnswerSnapshot(
  value: unknown,
  questionValue?: unknown,
): PracticeCorrectAnswerSnapshot {
  const snapshot = value as Partial<PracticeCorrectAnswerSnapshot>
  const question = questionValue as Partial<PracticeQuestionSnapshot>
  const answerText = typeof snapshot.answerText === "string" ? snapshot.answerText : null

  return {
    optionKeys:
      question.type === "true_false"
        ? getTrueFalseCorrectOptionKeys(answerText)
        : normalizeSelectedOptionKeys(snapshot.optionKeys),
    answerText,
  }
}

function normalizeSelectedOptionKeys(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []
}

function getAnswerStatus(answer: AiExplanationContext["answer"]) {
  if (!answer || (answer.selectedOptionKeys.length === 0 && answer.answerText.trim().length === 0)) {
    return "tidak dijawab"
  }

  if (answer.isCorrect === true) {
    return "benar"
  }

  if (answer.isCorrect === false) {
    return "salah"
  }

  return "belum dinilai"
}

function getCorrectAnswerLabel(context: AiExplanationContext) {
  if (context.correctAnswer.optionKeys.length > 0) {
    return context.correctAnswer.optionKeys
      .map((key) => getOptionLabelWithContent(key, context.options))
      .join("; ")
  }

  return context.correctAnswer.answerText?.trim() || "-"
}

function getUserAnswerLabel(context: AiExplanationContext) {
  if (!context.answer) {
    return "Tidak dijawab"
  }

  if (context.answer.selectedOptionKeys.length > 0) {
    return context.answer.selectedOptionKeys
      .map((key) => getOptionLabelWithContent(key, context.options))
      .join("; ")
  }

  return context.answer.answerText.trim() || "Tidak dijawab"
}

function getOptionLabelWithContent(label: string, options: PracticeOptionSnapshot[]) {
  const option = options.find((item) => item.label === label)

  return option ? `${label}. ${toPlainText(option.content)}` : label
}

function toPlainText(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function normalizeAnswerText(value: string | null | undefined) {
  return value?.trim().replace(/\s+/g, " ").toLowerCase() ?? ""
}

function getTrueFalseCorrectOptionKeys(correctAnswerText: string | null | undefined) {
  const normalized = normalizeAnswerText(correctAnswerText)

  if (normalized === "true" || normalized === "benar" || normalized === "a") {
    return ["A"]
  }

  if (normalized === "false" || normalized === "salah" || normalized === "b") {
    return ["B"]
  }

  return []
}

function getTrueFalseOptionLabel(
  optionLabel: string | null,
  optionContent: string | null,
  index: number,
) {
  const normalized = normalizeAnswerText(`${optionLabel ?? ""} ${optionContent ?? ""}`)

  if (normalized.includes("true") || normalized.includes("benar")) {
    return "A"
  }

  if (normalized.includes("false") || normalized.includes("salah")) {
    return "B"
  }

  return index === 0 ? "A" : "B"
}
