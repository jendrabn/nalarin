"use server"

import { and, eq, sql } from "drizzle-orm"

import { PLAN_CONFIG } from "@/config/plans"
import type { PlanCode } from "@/config/plans"
import { db, schema } from "@/db"
import { requireUser } from "@/features/auth/services/session"
import { getCurrentActiveSubscription } from "@/features/premium/queries"

import { canAccessPractice } from "../utils/access"
import type {
  PracticeCorrectAnswerSnapshot,
  PracticeMode,
  PracticeOptionSnapshot,
  PracticeQuestionSnapshot,
  PracticeQuestionType,
} from "../types"

type PracticeActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; message: string }

type StartPracticeSessionInput = {
  practiceId: number
  mode: PracticeMode
  restartExisting?: boolean
}

type SavePracticeAnswerInput = {
  sessionId: number
  sessionQuestionId: number
  selectedOptionKeys?: string[]
  answerText?: string
}

type SetPracticeFlagInput = {
  sessionId: number
  sessionQuestionId: number
  isMarkedForReview: boolean
}

type SetCurrentQuestionInput = {
  sessionId: number
  orderIndex: number
}

type ConfirmPracticeAnswerInput = SavePracticeAnswerInput

type SubmitPracticeSessionInput = {
  sessionId: number
  autoSubmitted?: boolean
}

export async function startPracticeSessionAction(
  input: StartPracticeSessionInput,
): Promise<
  PracticeActionResult<{
    sessionId: number
    resumed: boolean
    needsDecision?: boolean
  }>
> {
  const user = await requireUser()

  if (!user.emailVerifiedAt) {
    return {
      success: false,
      message: "Verifikasi email dulu sebelum mulai latihan.",
    }
  }

  if (!Number.isInteger(input.practiceId) || input.practiceId <= 0) {
    return {
      success: false,
      message: "Latihan tidak valid.",
    }
  }

  if (input.mode !== "practice" && input.mode !== "quiz") {
    return {
      success: false,
      message: "Mode latihan tidak valid.",
    }
  }

  const [practice] = await db
    .select({
      id: schema.practices.id,
      isFree: schema.practices.isFree,
      hasPracticeMode: schema.practices.hasPracticeMode,
      hasQuizMode: schema.practices.hasQuizMode,
      quizDurationMinutes: schema.practices.quizDurationMinutes,
      status: schema.practices.status,
      publishedAt: schema.practices.publishedAt,
    })
    .from(schema.practices)
    .where(eq(schema.practices.id, input.practiceId))
    .limit(1)

  if (!practice || practice.status !== "published" || !practice.publishedAt) {
    return {
      success: false,
      message: "Latihan belum tersedia.",
    }
  }

  if (input.mode === "practice" && !practice.hasPracticeMode) {
    return {
      success: false,
      message: "Practice ini tidak mendukung Mode Latihan.",
    }
  }

  if (input.mode === "quiz" && !practice.hasQuizMode) {
    return {
      success: false,
      message: "Practice ini tidak mendukung Mode Quiz.",
    }
  }

  const subscription = await getCurrentActiveSubscription(user.id)
  const planCode: PlanCode = subscription?.planCode ?? "free"

  if (!canAccessPractice({ isFree: practice.isFree, planCode })) {
    return {
      success: false,
      message: "Latihan premium tersedia untuk pengguna paket Pro atau Max.",
    }
  }

  const existingSession = await getExistingInProgressSession(
    user.id,
    practice.id,
    input.mode,
  )

  if (existingSession && !input.restartExisting) {
    return {
      success: true,
      data: {
        sessionId: existingSession.id,
        resumed: true,
        needsDecision: true,
      },
    }
  }

  const usageCheck = await checkMonthlyUsageLimit(user.id, planCode, input.mode)

  if (!usageCheck.success) {
    return usageCheck
  }

  const questionRows = await getPracticeQuestionSnapshotRows(practice.id)

  if (questionRows.length === 0) {
    return {
      success: false,
      message: "Latihan ini belum memiliki soal.",
    }
  }

  const sessionQuestions = buildSessionQuestions(questionRows, {
    shuffleQuestions: false,
    shuffleOptions: false,
  })
  const now = new Date()
  const totalMaxScore = sessionQuestions.reduce((total, question) => total + question.points, 0)
  const period = getMonthlyUsagePeriod(now)

  const created = await db.transaction(async (tx) => {
    if (existingSession && input.restartExisting) {
      await tx
        .update(schema.practiceSessions)
        .set({
          status: "cancelled",
          updatedAt: now,
        })
        .where(eq(schema.practiceSessions.id, existingSession.id))
    }

    const [insertedSession] = await tx
      .insert(schema.practiceSessions)
      .values({
        practiceId: practice.id,
        userId: user.id,
        mode: input.mode,
        status: "in_progress",
        totalQuestions: sessionQuestions.length,
        totalCorrect: 0,
        totalWrong: 0,
        totalUnanswered: sessionQuestions.length,
        totalScore: "0.00",
        totalMaxScore: totalMaxScore.toFixed(2),
        durationMinutes:
          input.mode === "quiz" ? practice.quizDurationMinutes ?? null : null,
        currentQuestionOrder: sessionQuestions[0]?.orderIndex ?? null,
        startedAt: now,
        lastSavedAt: now,
      })
      .$returningId()

    await tx.insert(schema.practiceSessionQuestions).values(
      sessionQuestions.map((question) => ({
        practiceSessionId: insertedSession.id,
        practiceQuestionId: question.practiceQuestionId,
        questionId: question.question.id,
        orderIndex: question.orderIndex,
        questionSnapshot: question.question as unknown as Record<string, unknown>,
        optionSnapshot: question.options as unknown as Record<string, unknown>[],
        correctAnswerSnapshot: question.correctAnswer as unknown as Record<string, unknown>,
        points: question.points.toFixed(2),
      })),
    )

    await tx
      .insert(schema.monthlyUsage)
      .values({
        userId: user.id,
        period,
        practiceSessionsCount: input.mode === "practice" ? 1 : 0,
        quizSessionsCount: input.mode === "quiz" ? 1 : 0,
        tryoutSessionsCount: 0,
      })
      .onDuplicateKeyUpdate({
        set: {
          practiceSessionsCount:
            input.mode === "practice"
              ? sql`${schema.monthlyUsage.practiceSessionsCount} + 1`
              : sql`${schema.monthlyUsage.practiceSessionsCount}`,
          quizSessionsCount:
            input.mode === "quiz"
              ? sql`${schema.monthlyUsage.quizSessionsCount} + 1`
              : sql`${schema.monthlyUsage.quizSessionsCount}`,
          updatedAt: now,
        },
      })

    return insertedSession
  })

  return {
    success: true,
    data: {
      sessionId: created.id,
      resumed: false,
    },
  }
}

export async function savePracticeAnswerAction(
  input: SavePracticeAnswerInput,
): Promise<PracticeActionResult> {
  const user = await requireUser()
  const context = await getOwnedSessionQuestionContext(
    user.id,
    input.sessionId,
    input.sessionQuestionId,
  )

  if (!context) {
    return {
      success: false,
      message: "Sesi atau soal tidak ditemukan.",
    }
  }

  if (context.mode === "practice" && context.gradedAt) {
    return {
      success: false,
      message: "Jawaban sudah dikonfirmasi dan tidak bisa diubah.",
    }
  }

  const sequenceCheck = await assertPracticeQuestionIsReachable(input.sessionId, context)
  if (!sequenceCheck.success) {
    return sequenceCheck
  }

  const selectedOptionKeys = normalizeSelectedOptionKeys(input.selectedOptionKeys)
  const answerText = input.answerText?.trim() ? input.answerText : null
  const now = new Date()

  await db
    .insert(schema.practiceAnswers)
    .values({
      practiceSessionId: input.sessionId,
      practiceSessionQuestionId: input.sessionQuestionId,
      questionType: context.questionType,
      selectedOptionKeys,
      answerText,
      isMarkedForReview: context.isMarkedForReview,
      gradingStatus: "not_required",
      answeredAt: now,
      lastSavedAt: now,
    })
    .onDuplicateKeyUpdate({
      set: {
        selectedOptionKeys,
        answerText,
        answeredAt: now,
        lastSavedAt: now,
        updatedAt: now,
      },
    })

  await db
    .update(schema.practiceSessions)
    .set({
      currentQuestionOrder: context.orderIndex,
      lastSavedAt: now,
      updatedAt: now,
    })
    .where(
      and(
        eq(schema.practiceSessions.id, input.sessionId),
        eq(schema.practiceSessions.userId, user.id),
      ),
    )

  return { success: true, data: undefined }
}

export async function confirmPracticeAnswerAction(
  input: ConfirmPracticeAnswerInput,
): Promise<PracticeActionResult<{ isCorrect: boolean; score: number; maxScore: number }>> {
  const user = await requireUser()
  const context = await getOwnedSessionQuestionContext(
    user.id,
    input.sessionId,
    input.sessionQuestionId,
  )

  if (!context) {
    return {
      success: false,
      message: "Sesi atau soal tidak ditemukan.",
    }
  }

  if (context.mode !== "practice") {
    return {
      success: false,
      message: "Konfirmasi jawaban hanya tersedia untuk Mode Latihan.",
    }
  }

  if (context.gradedAt && context.isCorrect !== null && context.score !== null) {
    return {
      success: true,
      data: {
        isCorrect: context.isCorrect,
        score: Number(context.score),
        maxScore: context.points,
      },
    }
  }

  const sequenceCheck = await assertPracticeQuestionIsReachable(input.sessionId, context)
  if (!sequenceCheck.success) {
    return sequenceCheck
  }

  const selectedOptionKeys = normalizeSelectedOptionKeys(input.selectedOptionKeys)
  const answerText = input.answerText?.trim() ? input.answerText.trim() : null

  if (!isAnswerFilled(selectedOptionKeys, answerText)) {
    return {
      success: false,
      message: "Pilih atau isi jawaban terlebih dahulu.",
    }
  }

  const grade = gradeAnswer({
    questionType: context.questionType,
    scoringRule: context.scoringRule as "all_or_nothing" | "partial",
    selectedOptionKeys,
    answerText,
    correctOptionKeys: context.correctOptionKeys,
    correctAnswerText: context.correctAnswerText,
    points: context.points,
  })
  const now = new Date()

  await db
    .insert(schema.practiceAnswers)
    .values({
      practiceSessionId: input.sessionId,
      practiceSessionQuestionId: input.sessionQuestionId,
      questionType: context.questionType,
      selectedOptionKeys,
      answerText,
      isMarkedForReview: context.isMarkedForReview,
      isCorrect: grade.isCorrect,
      score: grade.score.toFixed(2),
      maxScore: context.points.toFixed(2),
      gradingStatus: "graded",
      gradingSource: "auto",
      gradedAt: now,
      answeredAt: now,
      lastSavedAt: now,
    })
    .onDuplicateKeyUpdate({
      set: {
        selectedOptionKeys,
        answerText,
        isCorrect: grade.isCorrect,
        score: grade.score.toFixed(2),
        maxScore: context.points.toFixed(2),
        gradingStatus: "graded",
        gradingSource: "auto",
        gradedAt: now,
        answeredAt: now,
        lastSavedAt: now,
        updatedAt: now,
      },
    })

  await db
    .update(schema.practiceSessions)
    .set({
      currentQuestionOrder: context.orderIndex,
      lastSavedAt: now,
      updatedAt: now,
    })
    .where(
      and(
        eq(schema.practiceSessions.id, input.sessionId),
        eq(schema.practiceSessions.userId, user.id),
      ),
    )

  return {
    success: true,
    data: {
      isCorrect: grade.isCorrect,
      score: grade.score,
      maxScore: context.points,
    },
  }
}

export async function submitPracticeSessionAction(
  input: SubmitPracticeSessionInput,
): Promise<PracticeActionResult<{ sessionId: number }>> {
  const user = await requireUser()

  const [session] = await db
    .select({
      id: schema.practiceSessions.id,
      mode: schema.practiceSessions.mode,
      status: schema.practiceSessions.status,
      startedAt: schema.practiceSessions.startedAt,
    })
    .from(schema.practiceSessions)
    .where(
      and(
        eq(schema.practiceSessions.id, input.sessionId),
        eq(schema.practiceSessions.userId, user.id),
      ),
    )
    .limit(1)

  if (!session) {
    return {
      success: false,
      message: "Sesi tidak ditemukan.",
    }
  }

  if (session.status !== "in_progress") {
    return {
      success: true,
      data: { sessionId: session.id },
    }
  }

  const rows = await getSessionScoringRows(session.id)

  if (rows.length === 0) {
    return {
      success: false,
      message: "Sesi ini belum memiliki soal.",
    }
  }

  if (session.mode === "practice") {
    const unconfirmed = rows.find((row) => !row.answerGradedAt)

    if (unconfirmed) {
      return {
        success: false,
        message: "Selesaikan dan konfirmasi semua soal sebelum submit.",
      }
    }
  }

  const now = new Date()
  let totalCorrect = 0
  let totalWrong = 0
  let totalUnanswered = 0
  let totalScore = 0
  let totalMaxScore = 0

  await db.transaction(async (tx) => {
    for (const row of rows) {
      const points = Number(row.points ?? 0)
      const answerText = row.answerText?.trim() ? row.answerText.trim() : null
      const questionSnapshot = row.questionSnapshot as Partial<PracticeQuestionSnapshot>
      const correctAnswer = row.correctAnswerSnapshot as Partial<PracticeCorrectAnswerSnapshot>
      const questionType = isPracticeQuestionType(questionSnapshot.type)
        ? questionSnapshot.type
        : "multiple_choice"
      const selectedOptionKeys = normalizeSelectedOptionKeysForQuestion(
        row.selectedOptionKeys,
        questionType,
      )
      const answered = isAnswerFilled(selectedOptionKeys, answerText)
      const scoringRule = questionSnapshot.scoringRule === "partial" ? "partial" : "all_or_nothing"
      const correctAnswerText =
        typeof correctAnswer.answerText === "string" ? correctAnswer.answerText : null
      const correctOptionKeys =
        questionType === "true_false"
          ? getTrueFalseCorrectOptionKeys(correctAnswerText)
          : normalizeSelectedOptionKeys(correctAnswer.optionKeys)

      totalMaxScore += points

      if (!answered) {
        totalUnanswered += 1
        continue
      }

      const grade =
        session.mode === "practice" && row.isCorrect !== null && row.score !== null
          ? { isCorrect: row.isCorrect, score: Number(row.score) }
          : gradeAnswer({
              questionType,
              scoringRule,
              selectedOptionKeys,
              answerText,
              correctOptionKeys,
              correctAnswerText,
              points,
            })

      if (grade.isCorrect) {
        totalCorrect += 1
      } else {
        totalWrong += 1
      }

      totalScore += grade.score

      await tx
        .insert(schema.practiceAnswers)
        .values({
          practiceSessionId: session.id,
          practiceSessionQuestionId: row.sessionQuestionId,
          questionType,
          selectedOptionKeys,
          answerText,
          isMarkedForReview: Boolean(row.isMarkedForReview),
          isCorrect: grade.isCorrect,
          score: grade.score.toFixed(2),
          maxScore: points.toFixed(2),
          gradingStatus: "graded",
          gradingSource: "auto",
          gradedAt: now,
          answeredAt: row.answeredAt ?? now,
          lastSavedAt: now,
        })
        .onDuplicateKeyUpdate({
          set: {
            isCorrect: grade.isCorrect,
            score: grade.score.toFixed(2),
            maxScore: points.toFixed(2),
            gradingStatus: "graded",
            gradingSource: "auto",
            gradedAt: row.answerGradedAt ?? now,
            lastSavedAt: now,
            updatedAt: now,
          },
        })
    }

    await tx
      .update(schema.practiceSessions)
      .set({
        status: "graded",
        totalQuestions: rows.length,
        totalCorrect,
        totalWrong,
        totalUnanswered,
        totalScore: totalScore.toFixed(2),
        totalMaxScore: totalMaxScore.toFixed(2),
        submittedAt: now,
        gradedAt: now,
        lastSavedAt: now,
        updatedAt: now,
      })
      .where(eq(schema.practiceSessions.id, session.id))
  })

  return {
    success: true,
    data: { sessionId: session.id },
  }
}

export async function setPracticeQuestionFlagAction(
  input: SetPracticeFlagInput,
): Promise<PracticeActionResult> {
  const user = await requireUser()
  const context = await getOwnedSessionQuestionContext(
    user.id,
    input.sessionId,
    input.sessionQuestionId,
  )

  if (!context) {
    return {
      success: false,
      message: "Sesi atau soal tidak ditemukan.",
    }
  }

  if (context.mode !== "quiz") {
    return {
      success: false,
      message: "Fitur tandai soal hanya tersedia untuk Mode Quiz.",
    }
  }

  const now = new Date()

  await db
    .insert(schema.practiceAnswers)
    .values({
      practiceSessionId: input.sessionId,
      practiceSessionQuestionId: input.sessionQuestionId,
      questionType: context.questionType,
      selectedOptionKeys: context.selectedOptionKeys,
      answerText: context.answerText,
      isMarkedForReview: input.isMarkedForReview,
      gradingStatus: "not_required",
      lastSavedAt: now,
    })
    .onDuplicateKeyUpdate({
      set: {
        isMarkedForReview: input.isMarkedForReview,
        lastSavedAt: now,
        updatedAt: now,
      },
    })

  return { success: true, data: undefined }
}

export async function setPracticeCurrentQuestionAction(
  input: SetCurrentQuestionInput,
): Promise<PracticeActionResult> {
  const user = await requireUser()

  if (!Number.isInteger(input.orderIndex) || input.orderIndex <= 0) {
    return {
      success: false,
      message: "Nomor soal tidak valid.",
    }
  }

  const [sessionQuestion] = await db
    .select({
      id: schema.practiceSessionQuestions.id,
      mode: schema.practiceSessions.mode,
      orderIndex: schema.practiceSessionQuestions.orderIndex,
    })
    .from(schema.practiceSessionQuestions)
    .innerJoin(
      schema.practiceSessions,
      eq(schema.practiceSessionQuestions.practiceSessionId, schema.practiceSessions.id),
    )
    .where(
      and(
        eq(schema.practiceSessions.id, input.sessionId),
        eq(schema.practiceSessions.userId, user.id),
        eq(schema.practiceSessions.status, "in_progress"),
        eq(schema.practiceSessionQuestions.orderIndex, input.orderIndex),
      ),
    )
    .limit(1)

  if (!sessionQuestion) {
    return {
      success: false,
      message: "Soal tidak ditemukan.",
    }
  }

  if (sessionQuestion.mode === "practice") {
    const firstUnconfirmedOrder = await getFirstUnconfirmedQuestionOrder(input.sessionId)

    if (
      firstUnconfirmedOrder !== null &&
      sessionQuestion.orderIndex > firstUnconfirmedOrder
    ) {
      return {
        success: false,
        message: "Mode Latihan wajib dikerjakan berurutan.",
      }
    }
  }

  const now = new Date()

  await db
    .update(schema.practiceSessions)
    .set({
      currentQuestionOrder: input.orderIndex,
      lastSavedAt: now,
      updatedAt: now,
    })
    .where(
      and(
        eq(schema.practiceSessions.id, input.sessionId),
        eq(schema.practiceSessions.userId, user.id),
      ),
    )

  return { success: true, data: undefined }
}

async function assertPracticeQuestionIsReachable(
  sessionId: number,
  context: {
    mode: PracticeMode
    orderIndex: number
    gradedAt: Date | null
  },
): Promise<PracticeActionResult> {
  if (context.mode !== "practice" || context.gradedAt) {
    return { success: true, data: undefined }
  }

  const firstUnconfirmedOrder = await getFirstUnconfirmedQuestionOrder(sessionId)

  if (firstUnconfirmedOrder !== null && context.orderIndex > firstUnconfirmedOrder) {
    return {
      success: false,
      message: "Kerjakan soal secara berurutan.",
    }
  }

  return { success: true, data: undefined }
}

async function getFirstUnconfirmedQuestionOrder(sessionId: number) {
  const rows = await db
    .select({
      orderIndex: schema.practiceSessionQuestions.orderIndex,
      gradedAt: schema.practiceAnswers.gradedAt,
    })
    .from(schema.practiceSessionQuestions)
    .leftJoin(
      schema.practiceAnswers,
      eq(schema.practiceSessionQuestions.id, schema.practiceAnswers.practiceSessionQuestionId),
    )
    .where(eq(schema.practiceSessionQuestions.practiceSessionId, sessionId))
    .orderBy(schema.practiceSessionQuestions.orderIndex)

  return rows.find((row) => !row.gradedAt)?.orderIndex ?? null
}

async function getExistingInProgressSession(
  userId: number,
  practiceId: number,
  mode: PracticeMode,
) {
  const [session] = await db
    .select({
      id: schema.practiceSessions.id,
    })
    .from(schema.practiceSessions)
    .where(
      and(
        eq(schema.practiceSessions.userId, userId),
        eq(schema.practiceSessions.practiceId, practiceId),
        eq(schema.practiceSessions.mode, mode),
        eq(schema.practiceSessions.status, "in_progress"),
      ),
    )
    .limit(1)

  return session ?? null
}

async function checkMonthlyUsageLimit(
  userId: number,
  planCode: PlanCode,
  mode: PracticeMode,
): Promise<PracticeActionResult> {
  const period = getMonthlyUsagePeriod(new Date())
  const [usage] = await db
    .select({
      practiceSessionsCount: schema.monthlyUsage.practiceSessionsCount,
      quizSessionsCount: schema.monthlyUsage.quizSessionsCount,
    })
    .from(schema.monthlyUsage)
    .where(and(eq(schema.monthlyUsage.userId, userId), eq(schema.monthlyUsage.period, period)))
    .limit(1)

  const limit =
    mode === "practice"
      ? PLAN_CONFIG[planCode].limits.practiceSessionsPerMonth
      : PLAN_CONFIG[planCode].limits.quizSessionsPerMonth

  if (limit === null) {
    return { success: true, data: undefined }
  }

  const used =
    mode === "practice"
      ? usage?.practiceSessionsCount ?? 0
      : usage?.quizSessionsCount ?? 0

  if (used >= limit) {
    return {
      success: false,
      message:
        mode === "practice"
          ? "Limit Mode Latihan bulan ini sudah habis."
          : "Limit Mode Quiz bulan ini sudah habis.",
    }
  }

  return { success: true, data: undefined }
}

type PracticeQuestionSnapshotRow = {
  practiceQuestionId: number
  orderIndex: number
  overridePoints: string | number | null
  questionId: number
  title: string | null
  content: string
  type: PracticeQuestionType
  difficulty: "easy" | "medium" | "hard"
  scoringRule: "all_or_nothing" | "partial" | null
  imageUrl: string | null
  manualExplanation: string | null
  aiExplanation: string | null
  correctAnswerText: string | null
  year: number | null
  basePoints: string | number
  optionId: number | null
  optionLabel: string | null
  optionContent: string | null
  optionImageUrl: string | null
  optionIsCorrect: boolean | null
}

async function getPracticeQuestionSnapshotRows(practiceId: number) {
  const rows = await db
    .select({
      practiceQuestionId: schema.practiceQuestions.id,
      orderIndex: schema.practiceQuestions.orderIndex,
      overridePoints: schema.practiceQuestions.points,
      questionId: schema.questions.id,
      title: schema.questions.title,
      content: schema.questions.content,
      type: schema.questions.type,
      difficulty: schema.questions.difficulty,
      scoringRule: schema.questions.scoringRule,
      imageUrl: schema.questions.imageUrl,
      manualExplanation: schema.questions.manualExplanation,
      aiExplanation: schema.questions.aiExplanation,
      correctAnswerText: schema.questions.correctAnswerText,
      year: schema.questions.year,
      basePoints: schema.questions.points,
      optionId: schema.questionOptions.id,
      optionLabel: schema.questionOptions.label,
      optionContent: schema.questionOptions.content,
      optionImageUrl: schema.questionOptions.imageUrl,
      optionIsCorrect: schema.questionOptions.isCorrect,
    })
    .from(schema.practiceQuestions)
    .innerJoin(schema.questions, eq(schema.practiceQuestions.questionId, schema.questions.id))
    .leftJoin(schema.questionOptions, eq(schema.questions.id, schema.questionOptions.questionId))
    .where(
      and(
        eq(schema.practiceQuestions.practiceId, practiceId),
        eq(schema.questions.status, "published"),
      ),
    )
    .orderBy(schema.practiceQuestions.orderIndex, schema.questionOptions.id)

  return rows as PracticeQuestionSnapshotRow[]
}

function buildSessionQuestions(
  rows: PracticeQuestionSnapshotRow[],
  options: { shuffleQuestions: boolean; shuffleOptions: boolean },
) {
  const questionMap = new Map<
    number,
    {
      practiceQuestionId: number
      sourceOrderIndex: number
      points: number
      question: PracticeQuestionSnapshot
      options: (PracticeOptionSnapshot & { isCorrect: boolean })[]
      correctAnswer: PracticeCorrectAnswerSnapshot
    }
  >()

  for (const row of rows) {
    const points = Number(row.overridePoints ?? row.basePoints ?? 0)
    const existing = questionMap.get(row.practiceQuestionId)

    if (!existing) {
      questionMap.set(row.practiceQuestionId, {
        practiceQuestionId: row.practiceQuestionId,
        sourceOrderIndex: row.orderIndex,
        points,
        question: {
          id: row.questionId,
          title: row.title ?? null,
          content: row.content,
          type: row.type,
          difficulty: row.difficulty,
          scoringRule: row.scoringRule ?? null,
          imageUrl: row.imageUrl ?? null,
          explanation: row.manualExplanation ?? row.aiExplanation ?? null,
          manualExplanation: row.manualExplanation ?? null,
          aiExplanation: row.aiExplanation ?? null,
          year: row.year ?? null,
          points,
        },
        options: [],
        correctAnswer: {
          optionKeys:
            row.type === "true_false"
              ? getTrueFalseCorrectOptionKeys(row.correctAnswerText)
              : [],
          answerText: row.correctAnswerText ?? null,
        },
      })
    }

    const target = questionMap.get(row.practiceQuestionId)

    if (!target || !row.optionId || !row.optionLabel || !row.optionContent) {
      continue
    }

    const optionLabel =
      row.type === "true_false"
        ? getTrueFalseOptionLabel(row.optionLabel, row.optionContent, target.options.length)
        : row.optionLabel

    target.options.push({
      id: row.optionId,
      label: optionLabel,
      content: row.optionContent,
      imageUrl: row.optionImageUrl ?? null,
      isCorrect: Boolean(row.optionIsCorrect),
    })

    if (row.type !== "true_false" && row.optionIsCorrect) {
      target.correctAnswer.optionKeys.push(optionLabel)
    }
  }

  const questions = Array.from(questionMap.values()).sort(
    (a, b) => a.sourceOrderIndex - b.sourceOrderIndex,
  )
  const orderedQuestions = options.shuffleQuestions ? shuffleArray(questions) : questions

  return orderedQuestions.map((question, index) => {
    const orderedOptions = options.shuffleOptions
      ? shuffleArray(question.options)
      : question.options

    return {
      practiceQuestionId: question.practiceQuestionId,
      orderIndex: index + 1,
      points: question.points,
      question: question.question,
      options: orderedOptions.map((option) => ({
        id: option.id,
        label: option.label,
        content: option.content,
        imageUrl: option.imageUrl,
      })),
      correctAnswer: question.correctAnswer,
    }
  })
}

async function getOwnedSessionQuestionContext(
  userId: number,
  sessionId: number,
  sessionQuestionId: number,
) {
  const [row] = await db
    .select({
      sessionQuestionId: schema.practiceSessionQuestions.id,
      orderIndex: schema.practiceSessionQuestions.orderIndex,
      questionSnapshot: schema.practiceSessionQuestions.questionSnapshot,
      correctAnswerSnapshot: schema.practiceSessionQuestions.correctAnswerSnapshot,
      points: schema.practiceSessionQuestions.points,
      mode: schema.practiceSessions.mode,
      answerText: schema.practiceAnswers.answerText,
      selectedOptionKeys: schema.practiceAnswers.selectedOptionKeys,
      isMarkedForReview: schema.practiceAnswers.isMarkedForReview,
      isCorrect: schema.practiceAnswers.isCorrect,
      score: schema.practiceAnswers.score,
      gradedAt: schema.practiceAnswers.gradedAt,
    })
    .from(schema.practiceSessionQuestions)
    .innerJoin(
      schema.practiceSessions,
      eq(schema.practiceSessionQuestions.practiceSessionId, schema.practiceSessions.id),
    )
    .leftJoin(
      schema.practiceAnswers,
      eq(schema.practiceSessionQuestions.id, schema.practiceAnswers.practiceSessionQuestionId),
    )
    .where(
      and(
        eq(schema.practiceSessions.id, sessionId),
        eq(schema.practiceSessions.userId, userId),
        eq(schema.practiceSessions.status, "in_progress"),
        eq(schema.practiceSessionQuestions.id, sessionQuestionId),
      ),
    )
    .limit(1)

  if (!row) {
    return null
  }

  const snapshot = row.questionSnapshot as Partial<PracticeQuestionSnapshot>
  const correctAnswer = row.correctAnswerSnapshot as Partial<PracticeCorrectAnswerSnapshot>

  return {
    orderIndex: row.orderIndex,
    mode: row.mode,
    questionType:
      snapshot.type === "multiple_choice" ||
      snapshot.type === "multiple_answer" ||
      snapshot.type === "short_answer" ||
      snapshot.type === "essay" ||
      snapshot.type === "true_false"
        ? snapshot.type
        : "multiple_choice",
    scoringRule: snapshot.scoringRule === "partial" ? "partial" : "all_or_nothing",
    correctOptionKeys:
      snapshot.type === "true_false"
        ? getTrueFalseCorrectOptionKeys(correctAnswer.answerText)
        : normalizeSelectedOptionKeys(correctAnswer.optionKeys),
    correctAnswerText:
      typeof correctAnswer.answerText === "string" ? correctAnswer.answerText : null,
    points: Number(row.points ?? 0),
    answerText: row.answerText ?? null,
    selectedOptionKeys: normalizeSelectedOptionKeysForQuestion(
      row.selectedOptionKeys,
      snapshot.type,
    ),
    isMarkedForReview: Boolean(row.isMarkedForReview),
    isCorrect: row.isCorrect ?? null,
    score: row.score === null ? null : Number(row.score),
    gradedAt: row.gradedAt ?? null,
  }
}

async function getSessionScoringRows(sessionId: number) {
  return db
    .select({
      sessionQuestionId: schema.practiceSessionQuestions.id,
      questionSnapshot: schema.practiceSessionQuestions.questionSnapshot,
      correctAnswerSnapshot: schema.practiceSessionQuestions.correctAnswerSnapshot,
      points: schema.practiceSessionQuestions.points,
      selectedOptionKeys: schema.practiceAnswers.selectedOptionKeys,
      answerText: schema.practiceAnswers.answerText,
      isMarkedForReview: schema.practiceAnswers.isMarkedForReview,
      isCorrect: schema.practiceAnswers.isCorrect,
      score: schema.practiceAnswers.score,
      answeredAt: schema.practiceAnswers.answeredAt,
      answerGradedAt: schema.practiceAnswers.gradedAt,
    })
    .from(schema.practiceSessionQuestions)
    .leftJoin(
      schema.practiceAnswers,
      eq(schema.practiceSessionQuestions.id, schema.practiceAnswers.practiceSessionQuestionId),
    )
    .where(eq(schema.practiceSessionQuestions.practiceSessionId, sessionId))
    .orderBy(schema.practiceSessionQuestions.orderIndex)
}

function isPracticeQuestionType(value: unknown): value is PracticeQuestionType {
  return (
    value === "multiple_choice" ||
    value === "multiple_answer" ||
    value === "short_answer" ||
    value === "essay" ||
    value === "true_false"
  )
}

function gradeAnswer({
  questionType,
  scoringRule,
  selectedOptionKeys,
  answerText,
  correctOptionKeys,
  correctAnswerText,
  points,
}: {
  questionType: PracticeQuestionType
  scoringRule: "all_or_nothing" | "partial"
  selectedOptionKeys: string[]
  answerText: string | null
  correctOptionKeys: string[]
  correctAnswerText: string | null
  points: number
}) {
  if (questionType === "short_answer" || questionType === "essay") {
    const normalizedAnswer = normalizeAnswerText(answerText)
    const normalizedCorrectAnswer = normalizeAnswerText(correctAnswerText)
    const isCorrect =
      normalizedAnswer.length > 0 &&
      normalizedCorrectAnswer.length > 0 &&
      normalizedAnswer === normalizedCorrectAnswer

    return {
      isCorrect,
      score: isCorrect ? points : 0,
    }
  }

  const selected = new Set(selectedOptionKeys)
  const correct = new Set(correctOptionKeys)
  const fullyCorrect =
    selected.size === correct.size && [...selected].every((key) => correct.has(key))

  if (questionType !== "multiple_answer" || scoringRule !== "partial") {
    return {
      isCorrect: fullyCorrect,
      score: fullyCorrect ? points : 0,
    }
  }

  const correctSelected = [...selected].filter((key) => correct.has(key)).length
  const wrongSelected = [...selected].filter((key) => !correct.has(key)).length
  const rawScore =
    correct.size > 0 ? ((correctSelected - wrongSelected) / correct.size) * points : 0
  const score = Math.max(0, Math.min(points, rawScore))

  return {
    isCorrect: fullyCorrect,
    score,
  }
}

function isAnswerFilled(selectedOptionKeys: string[], answerText: string | null) {
  return selectedOptionKeys.length > 0 || Boolean(answerText?.trim())
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

function normalizeSelectedOptionKeys(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((item): item is string => typeof item === "string")
}

function normalizeSelectedOptionKeysForQuestion(
  value: unknown,
  questionType: unknown,
): string[] {
  const keys = normalizeSelectedOptionKeys(value)

  if (questionType !== "true_false") {
    return keys
  }

  return keys
    .map((key) => {
      const normalized = normalizeAnswerText(key)

      if (normalized === "true" || normalized === "benar" || normalized === "a") {
        return "A"
      }

      if (normalized === "false" || normalized === "salah" || normalized === "b") {
        return "B"
      }

      return key
    })
    .filter((key, index, items) => items.indexOf(key) === index)
}

function getMonthlyUsagePeriod(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")

  return `${year}-${month}-01`
}

function shuffleArray<T>(items: T[]) {
  const copy = [...items]

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const targetIndex = Math.floor(Math.random() * (index + 1))
    const current = copy[index]
    copy[index] = copy[targetIndex]
    copy[targetIndex] = current
  }

  return copy
}
