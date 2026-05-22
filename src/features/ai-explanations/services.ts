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
      temperature: 0.25,
      max_tokens: 3200,
      messages: [
        {
          role: "system",
          content:
            "Kamu adalah tutor ahli persiapan ujian. Ikuti prompt user-facing dari PRD secara ketat: pembahasan harus jelas, terstruktur, rinci, konkret, dan mudah dipahami. Respons hanya berupa HTML fragment yang aman, tanpa markdown, tanpa tag html/body, tanpa script, tanpa style inline.",
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

  return `Kamu adalah tutor ahli untuk persiapan ujian ${context.examTypeName} - ${context.subjectName}.

Buat pembahasan yang jelas, terstruktur, rinci, dan mudah dipahami untuk soal berikut.

---
INFORMASI SOAL
Tipe soal: ${context.question.type}
Materi/Topik: ${context.topicName ?? "-"}
Soal: ${toPlainText(context.question.content)}
${context.options.length > 0 ? `Opsi:\n${optionsBlock}` : ""}
Kunci jawaban: ${correctAnswer}
Jawaban user: ${userAnswer}
Status jawaban user: ${answerStatus}
${manualExplanation}
---

INSTRUKSI PEMBAHASAN:

Tulis pembahasan dengan urutan berikut. Gunakan heading <h3> yang jelas untuk setiap bagian:

1. Jawaban yang Benar
   Sebutkan kunci jawaban dan jelaskan secara singkat mengapa jawaban tersebut benar. Mulai dari konsep atau prinsip yang mendasari, bukan sekadar menyatakan "jawaban yang benar adalah...".

2. Penjelasan Konsep
   Jelaskan konsep, teori, atau materi inti yang diuji soal ini secara mendalam. Gunakan bahasa yang mudah dipahami. Sertakan contoh konkret jika membantu pemahaman. Jangan hanya menghitung hasil akhir; jelaskan cara berpikirnya.

3. Analisis Jawaban User
   Hanya jika user menjawab salah atau kosong. Jelaskan dengan empati mengapa jawaban user kurang tepat. Identifikasi kemungkinan miskonsepsi atau jebakan yang membuat user memilih jawaban tersebut, lalu luruskan.

4. Tips dan Trik
   Berikan 1-2 strategi atau cara cepat untuk menyelesaikan soal serupa di ujian nyata. Fokus pada pendekatan yang praktis dan hemat waktu. Tutup dengan satu kalimat poin kunci yang harus diingat user.

ATURAN PENULISAN:
- Setiap bagian wajib substantif. Jangan memberi jawaban satu kalimat.
- Untuk soal sangat sederhana, tetap jelaskan minimal satu cara utama dan satu cara alternatif/cek cepat.
- Gunakan Bahasa Indonesia yang baik, jelas, dan tidak kaku.
- Hindari kalimat pembuka seperti "Baik, saya akan menjelaskan..." atau "Tentu saja...".
- Langsung masuk ke konten pada setiap bagian.
- Jika status jawaban user adalah "benar", lewati bagian "Analisis Jawaban User" dan beri apresiasi singkat di bagian "Tips dan Trik".
- Jangan membuat bagian "Analisis Pilihan Jawaban" atau "Rangkuman" agar pembahasan tidak bertele-tele.
- Respons wajib berupa HTML fragment saja, bukan Markdown.
- Setiap bagian wajib dibungkus <section> dan memakai heading <h3>.
- Gunakan tag <section>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, dan <em>.
- Jangan memakai tabel, link, class, style, atribut HTML, tag html, tag body, atau tag script.
- Jangan mengarang data di luar konteks soal. Jika konteks terbatas, jelaskan berdasarkan informasi yang tersedia.
${correctionInstruction ? `\nINSTRUKSI KOREKSI:\n${correctionInstruction}` : ""}`
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

  if (plainText.length < 700) {
    return {
      valid: false,
      reason: "pembahasan terlalu pendek dan tidak substantif",
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
    providerText.length >= 80
      ? `<p>${escapeHtml(providerText)}</p>`
      : ""
  const sections = [
    buildFallbackSection(
      "Jawaban yang Benar",
      `<p>Kunci jawaban untuk soal ini adalah <strong>${escapeHtml(correctAnswer)}</strong>. Jawaban tersebut menjadi acuan karena sesuai dengan informasi dan aturan penyelesaian yang ada pada soal.</p>${providerInsight}`,
    ),
    buildFallbackSection(
      "Penjelasan Konsep",
      `<p>Soal ini perlu dikerjakan dengan membaca maksud pertanyaan terlebih dahulu, lalu menghubungkannya dengan konsep dasar yang sedang diuji. Fokus utamanya adalah memahami hubungan antara data pada soal, proses yang diminta, dan bentuk jawaban akhir yang sesuai.</p><p>Jika soal memuat perhitungan, kerjakan langkahnya secara bertahap dan cek kembali hasil akhir terhadap pertanyaan. Jika soal memuat konsep verbal, cari kata kunci utama lalu cocokkan dengan prinsip yang relevan.</p>`,
    ),
  ]

  if (answerStatus !== "benar") {
    sections.push(
      buildFallbackSection(
        "Analisis Jawaban User",
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

function buildFallbackSection(title: string, content: string) {
  return `<section><h3>${escapeHtml(title)}</h3>${content}</section>`
}

function getRequiredSectionTitles(context: AiExplanationContext) {
  const titles = [...BASE_REQUIRED_SECTION_TITLES]

  if (getAnswerStatus(context.answer) !== "benar") {
    titles.splice(2, 0, "Analisis Jawaban User")
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
    "Analisis Jawaban User",
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
    /<\s*(\/?)\s*([a-zA-Z][a-zA-Z0-9-]*)(?:\s[^>]*)?>/g,
    (_match, closing: string, tagName: string) => {
      const tag = tagName.toLowerCase()

      if (!ALLOWED_HTML_TAGS.has(tag)) {
        return ""
      }

      if (tag === "br") {
        return "<br>"
      }

      return closing ? `</${tag}>` : `<${tag}>`
    },
  )
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
