"use server"

import { and, asc, eq, sql } from "drizzle-orm"
import { redirect } from "next/navigation"

import { db, schema } from "@/db"
import { getCurrentUser, requireUser } from "@/features/auth/services/session"
import { getActiveExamTypeEntitlement } from "@/features/premium/access"
import { isUnlimitedQuota } from "@/lib/billing"
import type {
  PracticeCorrectAnswerSnapshot,
  PracticeOptionSnapshot,
  PracticeQuestionSnapshot,
  PracticeQuestionType,
} from "@/features/practices/types"

import { canAccessTryout } from "../utils/access"
import {
  IRT_SCORE_MAX,
  calculateIrtScore,
  getIrtDifficulty,
  getIrtOptionCount,
  type IrtItemResponse,
} from "../utils/irt-scoring"
import { isResultReleased, resolveTryoutAvailabilityStatus } from "../utils/status"

type TryoutActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; message: string }

type StartTryoutInput = {
  tryoutSlug: string
}

type StartTryoutSectionInput = {
  sessionId: number
  sectionSessionId: number
}

type SaveTryoutAnswerInput = {
  sessionId: number
  sectionSessionId: number
  sessionQuestionId: number
  selectedOptionKeys?: string[]
  answerText?: string
}

type SetTryoutFlagInput = {
  sessionId: number
  sectionSessionId: number
  sessionQuestionId: number
  isMarkedForReview: boolean
}

type SetTryoutCurrentQuestionInput = {
  sessionId: number
  sectionSessionId: number
  orderIndex: number
}

type SubmitTryoutSectionInput = {
  sessionId: number
  sectionSessionId: number
  autoSubmitted?: boolean
}

type TryoutScoringMethod = "raw_score" | "irt_3pl"

export async function startTryoutSessionAction(
  input: StartTryoutInput,
): Promise<TryoutActionResult<{ sessionId: number }>> {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  if (!user.emailVerifiedAt) {
    return {
      success: false,
      message: "Verifikasi email dulu sebelum mulai tryout.",
    }
  }

  if (!input.tryoutSlug.trim()) {
    return {
      success: false,
      message: "Tryout tidak valid.",
    }
  }

  const [tryout] = await db
    .select({
      id: schema.tryouts.id,
      examTypeId: schema.tryouts.examTypeId,
      title: schema.tryouts.title,
      slug: schema.tryouts.slug,
      isFree: schema.tryouts.isFree,
      startsAt: schema.tryouts.startsAt,
      endsAt: schema.tryouts.endsAt,
      status: schema.tryouts.status,
      publishedAt: schema.tryouts.publishedAt,
      shuffleQuestions: schema.tryouts.shuffleQuestions,
      shuffleOptions: schema.tryouts.shuffleOptions,
      showResultAfterSubmit: schema.tryouts.showResultAfterSubmit,
      resultReleaseAt: schema.tryouts.resultReleaseAt,
      wrongAnswerPenalty: schema.tryouts.wrongAnswerPenalty,
    })
    .from(schema.tryouts)
    .where(eq(schema.tryouts.slug, input.tryoutSlug))
    .limit(1)

  if (
    !tryout ||
    !tryout.publishedAt ||
    (tryout.status !== "published" && tryout.status !== "archived")
  ) {
    return {
      success: false,
      message: "Tryout belum tersedia.",
    }
  }

  const existingSession = await getExistingTryoutSession(user.id, tryout.id)

  if (existingSession) {
    if (existingSession.status === "in_progress" || existingSession.status === "pending") {
      redirect(`/tryout-sessions/${existingSession.id}`)
    }

    if (existingSession.status === "graded") {
      if (
        isResultReleased(
          {
            showResultAfterSubmit: tryout.showResultAfterSubmit,
            resultReleaseAt: tryout.resultReleaseAt?.toISOString() ?? null,
          },
          new Date(),
        )
      ) {
        redirect(`/tryout-sessions/${existingSession.id}/result`)
      }

      return {
        success: false,
        message: "Tryout sudah selesai. Hasil akan tampil setelah jadwal rilis.",
      }
    }

    return {
      success: false,
      message: "Kamu sudah pernah memulai tryout ini dan tidak bisa mengulang.",
    }
  }

  const availabilityStatus = resolveTryoutAvailabilityStatus(
    {
      contentStatus: tryout.status as "published" | "archived",
      startsAt: tryout.startsAt?.toISOString() ?? null,
      endsAt: tryout.endsAt?.toISOString() ?? null,
    },
    new Date(),
  )

  if (availabilityStatus === "upcoming") {
    return {
      success: false,
      message: "Tryout belum dimulai.",
    }
  }

  if (availabilityStatus === "ended") {
    return {
      success: false,
      message: "Tryout sudah berakhir.",
    }
  }

  const entitlement = await getActiveExamTypeEntitlement(user.id, tryout.examTypeId)

  if (
    !canAccessTryout({
      isFree: tryout.isFree,
      hasPremiumAccess: Boolean(entitlement?.premiumTryoutsEnabled),
    })
  ) {
    return {
      success: false,
      message: "Tryout premium tersedia untuk paket exam type ini.",
    }
  }

  const [sections, questionRows] = await Promise.all([
    getTryoutSectionRows(tryout.id),
    getTryoutQuestionSnapshotRows(tryout.id),
  ])

  if (sections.length === 0 || questionRows.length === 0) {
    return {
      success: false,
      message: "Tryout ini belum memiliki section dan soal yang siap dikerjakan.",
    }
  }

  const sessionQuestions = buildTryoutSessionQuestions(questionRows, {
    shuffleQuestions: tryout.shuffleQuestions,
    shuffleOptions: tryout.shuffleOptions,
  })
  const totalMaxScore = sessionQuestions.reduce(
    (total, question) => total + question.points,
    0,
  )
  const now = new Date()
  const period = getMonthlyUsagePeriod(now)
  const shouldReserveUsage = !tryout.isFree

  const created = await db.transaction(async (tx) => {
    if (shouldReserveUsage) {
      const usageReservation = await reserveMonthlyTryoutUsage({
        tx,
        userId: user.id,
        examTypeId: tryout.examTypeId,
        entitlement,
        period,
        now,
      })

      if (!usageReservation.success) {
        return usageReservation
      }
    }

    const [insertedSession] = await tx
      .insert(schema.tryoutSessions)
      .values({
        tryoutId: tryout.id,
        userId: user.id,
        status: "in_progress",
        totalQuestions: sessionQuestions.length,
        totalCorrect: 0,
        totalWrong: 0,
        totalUnanswered: sessionQuestions.length,
        totalScore: "0.00",
        totalMaxScore: totalMaxScore.toFixed(2),
        totalSectionsStarted: 0,
        durationUsedSeconds: 0,
        autoSubmitted: false,
        startedAt: now,
        lastSavedAt: now,
      })
      .$returningId()

    const sectionSessionIds = new Map<number, number>()

    for (const section of sections) {
      const sectionQuestions = sessionQuestions.filter(
        (question) => question.tryoutSectionId === section.id,
      )
      const sectionMaxScore = sectionQuestions.reduce(
        (total, question) => total + question.points,
        0,
      )
      const [insertedSectionSession] = await tx
        .insert(schema.tryoutSectionSessions)
        .values({
          tryoutSessionId: insertedSession.id,
          tryoutSectionId: section.id,
          status: "pending",
          durationMinutes: section.durationMinutes,
          wrongAnswerPenalty: (
            section.wrongAnswerPenalty ?? Number(tryout.wrongAnswerPenalty ?? 0)
          ).toFixed(2),
          totalQuestions: sectionQuestions.length,
          correctCount: 0,
          wrongCount: 0,
          unansweredCount: sectionQuestions.length,
          score: "0.00",
        })
        .$returningId()

      sectionSessionIds.set(section.id, insertedSectionSession.id)

      if (sectionMaxScore < 0) {
        throw new Error("Invalid tryout section score.")
      }
    }

    await tx.insert(schema.tryoutSessionQuestions).values(
      sessionQuestions.map((question) => ({
        tryoutSessionId: insertedSession.id,
        tryoutSectionSessionId: sectionSessionIds.get(question.tryoutSectionId) ?? 0,
        tryoutQuestionId: question.tryoutQuestionId,
        questionId: question.question.id,
        orderIndex: question.orderIndex,
        questionSnapshot: question.question as unknown as Record<string, unknown>,
        optionSnapshot: question.options as unknown as Record<string, unknown>[],
        correctAnswerSnapshot: question.correctAnswer as unknown as Record<string, unknown>,
        points: question.points.toFixed(2),
      })),
    )

    return {
      success: true,
      data: insertedSession,
    } as const
  })

  if (!created.success) {
    return created
  }

  redirect(`/tryout-sessions/${created.data.id}`)
}

export async function startTryoutSectionAction(
  input: StartTryoutSectionInput,
): Promise<TryoutActionResult<{ sectionSessionId: number }>> {
  const user = await requireUser()

  if (!Number.isInteger(input.sessionId) || input.sessionId <= 0) {
    return { success: false, message: "Sesi tryout tidak valid." }
  }

  if (!Number.isInteger(input.sectionSessionId) || input.sectionSessionId <= 0) {
    return { success: false, message: "Section tryout tidak valid." }
  }

  const rows = await getOwnedTryoutSectionSessionRows(user.id, input.sessionId)
  const targetIndex = rows.findIndex((row) => row.id === input.sectionSessionId)
  const target = rows[targetIndex]

  if (!target) {
    return { success: false, message: "Section tryout tidak ditemukan." }
  }

  if (target.sessionStatus !== "in_progress") {
    return { success: false, message: "Sesi tryout ini sudah tidak dapat dikerjakan." }
  }

  if (target.status === "in_progress") {
    return { success: true, data: { sectionSessionId: target.id } }
  }

  if (target.status !== "pending") {
    return { success: false, message: "Section ini sudah selesai dan tidak bisa dibuka ulang." }
  }

  const activeOtherSection = rows.find(
    (row) => row.id !== target.id && row.status === "in_progress",
  )

  if (activeOtherSection) {
    return {
      success: false,
      message: `Selesaikan section ${activeOtherSection.title} terlebih dahulu.`,
    }
  }

  const unfinishedPreviousSection = rows
    .slice(0, targetIndex)
    .find((row) => row.status === "pending" || row.status === "in_progress")

  if (unfinishedPreviousSection) {
    return {
      success: false,
      message: `Kerjakan section ${unfinishedPreviousSection.title} terlebih dahulu.`,
    }
  }

  const [firstQuestion] = await db
    .select({
      orderIndex: schema.tryoutSessionQuestions.orderIndex,
    })
    .from(schema.tryoutSessionQuestions)
    .where(eq(schema.tryoutSessionQuestions.tryoutSectionSessionId, target.id))
    .orderBy(asc(schema.tryoutSessionQuestions.orderIndex))
    .limit(1)

  if (!firstQuestion) {
    return { success: false, message: "Section ini belum memiliki soal." }
  }

  const now = new Date()

  await db.transaction(async (tx) => {
    await tx
      .update(schema.tryoutSectionSessions)
      .set({
        status: "in_progress",
        startedAt: target.startedAt ?? now,
        currentQuestionOrder: firstQuestion.orderIndex,
        lastSavedAt: now,
        updatedAt: now,
      })
      .where(eq(schema.tryoutSectionSessions.id, target.id))

    await tx
      .update(schema.tryoutSessions)
      .set({
        totalSectionsStarted: target.startedAt
          ? sql`${schema.tryoutSessions.totalSectionsStarted}`
          : sql`${schema.tryoutSessions.totalSectionsStarted} + 1`,
        lastSavedAt: now,
        updatedAt: now,
      })
      .where(eq(schema.tryoutSessions.id, input.sessionId))
  })

  return { success: true, data: { sectionSessionId: target.id } }
}

export async function saveTryoutAnswerAction(
  input: SaveTryoutAnswerInput,
): Promise<TryoutActionResult> {
  const user = await requireUser()
  const context = await getOwnedTryoutSessionQuestionContext(
    user.id,
    input.sessionId,
    input.sectionSessionId,
    input.sessionQuestionId,
  )

  if (!context) {
    return { success: false, message: "Sesi, section, atau soal tidak ditemukan." }
  }

  if (context.sectionStatus !== "in_progress") {
    return { success: false, message: "Section ini belum aktif atau sudah selesai." }
  }

  const selectedOptionKeys = normalizeSelectedOptionKeys(input.selectedOptionKeys)
  const answerText = input.answerText?.trim() ? input.answerText : null
  const now = new Date()

  await db.transaction(async (tx) => {
    await tx
      .insert(schema.tryoutAnswers)
      .values({
        tryoutSessionId: input.sessionId,
        tryoutSectionSessionId: input.sectionSessionId,
        tryoutSessionQuestionId: input.sessionQuestionId,
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

    await tx
      .update(schema.tryoutSectionSessions)
      .set({
        currentQuestionOrder: context.orderIndex,
        lastSavedAt: now,
        updatedAt: now,
      })
      .where(eq(schema.tryoutSectionSessions.id, input.sectionSessionId))

    await tx
      .update(schema.tryoutSessions)
      .set({
        lastSavedAt: now,
        updatedAt: now,
      })
      .where(eq(schema.tryoutSessions.id, input.sessionId))
  })

  return { success: true, data: undefined }
}

export async function setTryoutQuestionFlagAction(
  input: SetTryoutFlagInput,
): Promise<TryoutActionResult> {
  const user = await requireUser()
  const context = await getOwnedTryoutSessionQuestionContext(
    user.id,
    input.sessionId,
    input.sectionSessionId,
    input.sessionQuestionId,
  )

  if (!context) {
    return { success: false, message: "Sesi, section, atau soal tidak ditemukan." }
  }

  if (context.sectionStatus !== "in_progress") {
    return { success: false, message: "Section ini belum aktif atau sudah selesai." }
  }

  const now = new Date()

  await db
    .insert(schema.tryoutAnswers)
    .values({
      tryoutSessionId: input.sessionId,
      tryoutSectionSessionId: input.sectionSessionId,
      tryoutSessionQuestionId: input.sessionQuestionId,
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

export async function setTryoutCurrentQuestionAction(
  input: SetTryoutCurrentQuestionInput,
): Promise<TryoutActionResult> {
  const user = await requireUser()

  if (!Number.isInteger(input.orderIndex) || input.orderIndex <= 0) {
    return { success: false, message: "Nomor soal tidak valid." }
  }

  const [sessionQuestion] = await db
    .select({
      id: schema.tryoutSessionQuestions.id,
      orderIndex: schema.tryoutSessionQuestions.orderIndex,
    })
    .from(schema.tryoutSessionQuestions)
    .innerJoin(
      schema.tryoutSectionSessions,
      eq(
        schema.tryoutSessionQuestions.tryoutSectionSessionId,
        schema.tryoutSectionSessions.id,
      ),
    )
    .innerJoin(
      schema.tryoutSessions,
      eq(schema.tryoutSectionSessions.tryoutSessionId, schema.tryoutSessions.id),
    )
    .where(
      and(
        eq(schema.tryoutSessions.id, input.sessionId),
        eq(schema.tryoutSessions.userId, user.id),
        eq(schema.tryoutSessions.status, "in_progress"),
        eq(schema.tryoutSectionSessions.id, input.sectionSessionId),
        eq(schema.tryoutSectionSessions.status, "in_progress"),
        eq(schema.tryoutSessionQuestions.orderIndex, input.orderIndex),
      ),
    )
    .limit(1)

  if (!sessionQuestion) {
    return { success: false, message: "Soal tidak ditemukan." }
  }

  const now = new Date()

  await db
    .update(schema.tryoutSectionSessions)
    .set({
      currentQuestionOrder: sessionQuestion.orderIndex,
      lastSavedAt: now,
      updatedAt: now,
    })
    .where(eq(schema.tryoutSectionSessions.id, input.sectionSessionId))

  return { success: true, data: undefined }
}

export async function submitTryoutSectionAction(
  input: SubmitTryoutSectionInput,
): Promise<TryoutActionResult<{ sessionId: number }>> {
  const user = await requireUser()

  const [section] = await db
    .select({
      id: schema.tryoutSectionSessions.id,
      status: schema.tryoutSectionSessions.status,
      startedAt: schema.tryoutSectionSessions.startedAt,
      durationMinutes: schema.tryoutSectionSessions.durationMinutes,
      wrongAnswerPenalty: schema.tryoutSectionSessions.wrongAnswerPenalty,
      tryoutSessionId: schema.tryoutSectionSessions.tryoutSessionId,
      sessionStatus: schema.tryoutSessions.status,
      scoringMethod: schema.tryouts.scoringMethod,
    })
    .from(schema.tryoutSectionSessions)
    .innerJoin(
      schema.tryoutSessions,
      eq(schema.tryoutSectionSessions.tryoutSessionId, schema.tryoutSessions.id),
    )
    .innerJoin(schema.tryouts, eq(schema.tryoutSessions.tryoutId, schema.tryouts.id))
    .where(
      and(
        eq(schema.tryoutSessions.id, input.sessionId),
        eq(schema.tryoutSessions.userId, user.id),
        eq(schema.tryoutSectionSessions.id, input.sectionSessionId),
      ),
    )
    .limit(1)

  if (!section) {
    return { success: false, message: "Section tryout tidak ditemukan." }
  }

  if (section.sessionStatus !== "in_progress") {
    return { success: true, data: { sessionId: input.sessionId } }
  }

  if (section.status !== "in_progress") {
    return { success: true, data: { sessionId: input.sessionId } }
  }

  const rows = await getTryoutSectionScoringRows(section.id)

  if (rows.length === 0) {
    return { success: false, message: "Section ini belum memiliki soal." }
  }

  const now = new Date()
  const penalty = Number(section.wrongAnswerPenalty ?? 0)
  const scoringMethod = isTryoutScoringMethod(section.scoringMethod)
    ? section.scoringMethod
    : "raw_score"
  let correctCount = 0
  let wrongCount = 0
  let unansweredCount = 0
  let score = 0
  const irtResponses: IrtItemResponse[] = []

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

      if (!answered) {
        unansweredCount += 1
        irtResponses.push({
          isCorrect: false,
          difficulty: getIrtDifficulty(questionSnapshot.difficulty),
          questionType,
          optionCount: getIrtOptionCount(row.optionSnapshot),
        })
        continue
      }

      const grade = gradeTryoutAnswer({
        questionType,
        scoringRule,
        selectedOptionKeys,
        answerText,
        correctOptionKeys,
        correctAnswerText,
        points,
        penalty: scoringMethod === "irt_3pl" ? 0 : penalty,
      })

      if (grade.isCorrect) {
        correctCount += 1
      } else {
        wrongCount += 1
      }

      if (scoringMethod === "raw_score") {
        score += grade.score
      }

      irtResponses.push({
        isCorrect: grade.isCorrect,
        difficulty: getIrtDifficulty(questionSnapshot.difficulty),
        questionType,
        optionCount: getIrtOptionCount(row.optionSnapshot),
      })

      await tx
        .insert(schema.tryoutAnswers)
        .values({
          tryoutSessionId: input.sessionId,
          tryoutSectionSessionId: section.id,
          tryoutSessionQuestionId: row.sessionQuestionId,
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
            gradedAt: now,
            lastSavedAt: now,
            updatedAt: now,
          },
        })
    }

    if (scoringMethod === "irt_3pl") {
      score = calculateIrtScore(irtResponses)
    }

    await tx
      .update(schema.tryoutSectionSessions)
      .set({
        status: "graded",
        totalQuestions: rows.length,
        correctCount,
        wrongCount,
        unansweredCount,
        score: score.toFixed(2),
        submittedAt: now,
        gradedAt: now,
        lastSavedAt: now,
        updatedAt: now,
      })
      .where(eq(schema.tryoutSectionSessions.id, section.id))
  })

  await recomputeTryoutSessionAggregate(input.sessionId, input.autoSubmitted === true)

  return { success: true, data: { sessionId: input.sessionId } }
}

async function getExistingTryoutSession(userId: number, tryoutId: number) {
  const [session] = await db
    .select({
      id: schema.tryoutSessions.id,
      status: schema.tryoutSessions.status,
    })
    .from(schema.tryoutSessions)
    .where(
      and(
        eq(schema.tryoutSessions.userId, userId),
        eq(schema.tryoutSessions.tryoutId, tryoutId),
      ),
    )
    .orderBy(schema.tryoutSessions.createdAt)
    .limit(1)

  return session ?? null
}

async function getOwnedTryoutSectionSessionRows(userId: number, sessionId: number) {
  return db
    .select({
      id: schema.tryoutSectionSessions.id,
      status: schema.tryoutSectionSessions.status,
      startedAt: schema.tryoutSectionSessions.startedAt,
      sessionStatus: schema.tryoutSessions.status,
      title: schema.tryoutSections.title,
      orderIndex: schema.tryoutSections.orderIndex,
    })
    .from(schema.tryoutSectionSessions)
    .innerJoin(
      schema.tryoutSessions,
      eq(schema.tryoutSectionSessions.tryoutSessionId, schema.tryoutSessions.id),
    )
    .innerJoin(
      schema.tryoutSections,
      eq(schema.tryoutSectionSessions.tryoutSectionId, schema.tryoutSections.id),
    )
    .where(and(eq(schema.tryoutSessions.id, sessionId), eq(schema.tryoutSessions.userId, userId)))
    .orderBy(asc(schema.tryoutSections.orderIndex))
}

async function getOwnedTryoutSessionQuestionContext(
  userId: number,
  sessionId: number,
  sectionSessionId: number,
  sessionQuestionId: number,
) {
  const [row] = await db
    .select({
      sessionQuestionId: schema.tryoutSessionQuestions.id,
      orderIndex: schema.tryoutSessionQuestions.orderIndex,
      questionSnapshot: schema.tryoutSessionQuestions.questionSnapshot,
      correctAnswerSnapshot: schema.tryoutSessionQuestions.correctAnswerSnapshot,
      points: schema.tryoutSessionQuestions.points,
      sectionStatus: schema.tryoutSectionSessions.status,
      answerText: schema.tryoutAnswers.answerText,
      selectedOptionKeys: schema.tryoutAnswers.selectedOptionKeys,
      isMarkedForReview: schema.tryoutAnswers.isMarkedForReview,
    })
    .from(schema.tryoutSessionQuestions)
    .innerJoin(
      schema.tryoutSectionSessions,
      eq(
        schema.tryoutSessionQuestions.tryoutSectionSessionId,
        schema.tryoutSectionSessions.id,
      ),
    )
    .innerJoin(
      schema.tryoutSessions,
      eq(schema.tryoutSectionSessions.tryoutSessionId, schema.tryoutSessions.id),
    )
    .leftJoin(
      schema.tryoutAnswers,
      eq(schema.tryoutSessionQuestions.id, schema.tryoutAnswers.tryoutSessionQuestionId),
    )
    .where(
      and(
        eq(schema.tryoutSessions.id, sessionId),
        eq(schema.tryoutSessions.userId, userId),
        eq(schema.tryoutSessions.status, "in_progress"),
        eq(schema.tryoutSectionSessions.id, sectionSessionId),
        eq(schema.tryoutSessionQuestions.id, sessionQuestionId),
      ),
    )
    .limit(1)

  if (!row) {
    return null
  }

  const snapshot = row.questionSnapshot as Partial<PracticeQuestionSnapshot>

  return {
    orderIndex: row.orderIndex,
    sectionStatus: row.sectionStatus,
    questionType: isPracticeQuestionType(snapshot.type) ? snapshot.type : "multiple_choice",
    points: Number(row.points ?? 0),
    answerText: row.answerText ?? null,
    selectedOptionKeys: normalizeSelectedOptionKeysForQuestion(
      row.selectedOptionKeys,
      snapshot.type,
    ),
    isMarkedForReview: Boolean(row.isMarkedForReview),
  }
}

async function getTryoutSectionScoringRows(sectionSessionId: number) {
  return db
    .select({
      sessionQuestionId: schema.tryoutSessionQuestions.id,
      questionSnapshot: schema.tryoutSessionQuestions.questionSnapshot,
      correctAnswerSnapshot: schema.tryoutSessionQuestions.correctAnswerSnapshot,
      optionSnapshot: schema.tryoutSessionQuestions.optionSnapshot,
      points: schema.tryoutSessionQuestions.points,
      selectedOptionKeys: schema.tryoutAnswers.selectedOptionKeys,
      answerText: schema.tryoutAnswers.answerText,
      isMarkedForReview: schema.tryoutAnswers.isMarkedForReview,
      answeredAt: schema.tryoutAnswers.answeredAt,
    })
    .from(schema.tryoutSessionQuestions)
    .leftJoin(
      schema.tryoutAnswers,
      eq(schema.tryoutSessionQuestions.id, schema.tryoutAnswers.tryoutSessionQuestionId),
    )
    .where(eq(schema.tryoutSessionQuestions.tryoutSectionSessionId, sectionSessionId))
    .orderBy(schema.tryoutSessionQuestions.orderIndex)
}

async function recomputeTryoutSessionAggregate(sessionId: number, autoSubmitted: boolean) {
  const sections = await db
    .select({
      status: schema.tryoutSectionSessions.status,
      totalQuestions: schema.tryoutSectionSessions.totalQuestions,
      correctCount: schema.tryoutSectionSessions.correctCount,
      wrongCount: schema.tryoutSectionSessions.wrongCount,
      unansweredCount: schema.tryoutSectionSessions.unansweredCount,
      score: schema.tryoutSectionSessions.score,
      startedAt: schema.tryoutSectionSessions.startedAt,
      submittedAt: schema.tryoutSectionSessions.submittedAt,
      scoringMethod: schema.tryouts.scoringMethod,
    })
    .from(schema.tryoutSectionSessions)
    .innerJoin(
      schema.tryoutSessions,
      eq(schema.tryoutSectionSessions.tryoutSessionId, schema.tryoutSessions.id),
    )
    .innerJoin(schema.tryouts, eq(schema.tryoutSessions.tryoutId, schema.tryouts.id))
    .where(eq(schema.tryoutSectionSessions.tryoutSessionId, sessionId))

  if (sections.length === 0) {
    return
  }

  const hasOpenSection = sections.some(
    (section) => section.status === "pending" || section.status === "in_progress",
  )
  const totalQuestions = sections.reduce((total, section) => total + section.totalQuestions, 0)
  const totalCorrect = sections.reduce((total, section) => total + section.correctCount, 0)
  const totalWrong = sections.reduce((total, section) => total + section.wrongCount, 0)
  const totalUnanswered = sections.reduce(
    (total, section) => total + section.unansweredCount,
    0,
  )
  const scoringMethod: TryoutScoringMethod =
    sections[0]?.scoringMethod === "irt_3pl" ? "irt_3pl" : "raw_score"
  const totalRawScore = sections.reduce((total, section) => total + Number(section.score ?? 0), 0)
  const totalScore =
    scoringMethod === "irt_3pl" && sections.length > 0
      ? totalRawScore / sections.length
      : totalRawScore
  const totalMaxScore = scoringMethod === "irt_3pl" ? IRT_SCORE_MAX : null
  const totalSectionsStarted = sections.filter((section) => section.startedAt).length
  const durationUsedSeconds = sections.reduce((total, section) => {
    if (!section.startedAt || !section.submittedAt) {
      return total
    }

    return total + Math.max(0, Math.floor((section.submittedAt.getTime() - section.startedAt.getTime()) / 1000))
  }, 0)

  const now = new Date()

  if (hasOpenSection) {
    await db
      .update(schema.tryoutSessions)
      .set({
        totalQuestions,
        totalCorrect,
        totalWrong,
        totalUnanswered,
        totalScore: totalScore.toFixed(2),
        ...(totalMaxScore === null ? {} : { totalMaxScore: totalMaxScore.toFixed(2) }),
        totalSectionsStarted,
        durationUsedSeconds,
        lastSavedAt: now,
        updatedAt: now,
      })
      .where(eq(schema.tryoutSessions.id, sessionId))
    return
  }

  const hasPendingSubjective = sections.some((section) => section.status === "grading")

  await db
    .update(schema.tryoutSessions)
    .set({
      status: hasPendingSubjective ? "grading" : "graded",
      totalQuestions,
      totalCorrect,
      totalWrong,
      totalUnanswered,
      totalScore: totalScore.toFixed(2),
      ...(totalMaxScore === null ? {} : { totalMaxScore: totalMaxScore.toFixed(2) }),
      totalSectionsStarted,
      durationUsedSeconds,
      autoSubmitted,
      submittedAt: now,
      gradedAt: hasPendingSubjective ? null : now,
      lastSavedAt: now,
      updatedAt: now,
    })
    .where(eq(schema.tryoutSessions.id, sessionId))
}

type MonthlyUsageTransaction = Pick<typeof db, "insert" | "select" | "update">

async function reserveMonthlyTryoutUsage({
  tx,
  userId,
  examTypeId,
  entitlement,
  period,
  now,
}: {
  tx: MonthlyUsageTransaction
  userId: number
  examTypeId: number
  entitlement: Awaited<ReturnType<typeof getActiveExamTypeEntitlement>>
  period: string
  now: Date
}): Promise<TryoutActionResult> {
  const limit = entitlement?.tryoutQuotaPerMonth ?? 0

  await tx
    .insert(schema.monthlyUsage)
    .values({
      userId,
      examTypeId,
      period,
      practiceSessionsCount: 0,
      quizSessionsCount: 0,
      tryoutSessionsCount: 0,
      aiExplanationSessionsCount: 0,
    })
    .onDuplicateKeyUpdate({
      set: {
        updatedAt: now,
      },
    })

  const [usage] = await tx
    .select({
      id: schema.monthlyUsage.id,
      tryoutSessionsCount: schema.monthlyUsage.tryoutSessionsCount,
    })
    .from(schema.monthlyUsage)
    .where(
      and(
        eq(schema.monthlyUsage.userId, userId),
        eq(schema.monthlyUsage.examTypeId, examTypeId),
        eq(schema.monthlyUsage.period, period),
      ),
    )
    .limit(1)
    .for("update")

  if (!usage) {
    return {
      success: false,
      message: "Gagal menyiapkan limit penggunaan. Coba lagi.",
    }
  }

  if (!isUnlimitedQuota(limit) && (usage?.tryoutSessionsCount ?? 0) >= limit) {
    return {
      success: false,
      message: "Limit tryout bulan ini sudah habis.",
    }
  }

  await tx
    .update(schema.monthlyUsage)
    .set({
      tryoutSessionsCount: sql`${schema.monthlyUsage.tryoutSessionsCount} + 1`,
      updatedAt: now,
    })
    .where(eq(schema.monthlyUsage.id, usage.id))

  return { success: true, data: undefined }
}

type TryoutSectionRow = {
  id: number
  durationMinutes: number
  orderIndex: number
  wrongAnswerPenalty: number | null
}

async function getTryoutSectionRows(tryoutId: number): Promise<TryoutSectionRow[]> {
  const rows = await db
    .select({
      id: schema.tryoutSections.id,
      durationMinutes: schema.tryoutSections.durationMinutes,
      orderIndex: schema.tryoutSections.orderIndex,
      wrongAnswerPenalty: schema.tryoutSections.wrongAnswerPenalty,
    })
    .from(schema.tryoutSections)
    .where(eq(schema.tryoutSections.tryoutId, tryoutId))
    .orderBy(schema.tryoutSections.orderIndex)

  return rows.map((row) => ({
    ...row,
    wrongAnswerPenalty:
      row.wrongAnswerPenalty === null ? null : Number(row.wrongAnswerPenalty),
  }))
}

type TryoutQuestionSnapshotRow = {
  tryoutQuestionId: number
  tryoutSectionId: number
  sectionOrderIndex: number
  orderIndex: number
  overridePoints: string | number | null
  questionId: number
  title: string | null
  content: string
  type: PracticeQuestionType
  difficulty: "easy" | "medium" | "hard"
  scoringRule: "all_or_nothing" | "partial" | null
  imageUrl: string | null
  explanation: string | null
  correctAnswerText: string | null
  year: number | null
  basePoints: string | number
  optionId: number | null
  optionLabel: string | null
  optionContent: string | null
  optionImageUrl: string | null
  optionIsCorrect: boolean | null
}

async function getTryoutQuestionSnapshotRows(tryoutId: number) {
  const rows = await db
    .select({
      tryoutQuestionId: schema.tryoutQuestions.id,
      tryoutSectionId: schema.tryoutSections.id,
      sectionOrderIndex: schema.tryoutSections.orderIndex,
      orderIndex: schema.tryoutQuestions.orderIndex,
      overridePoints: schema.tryoutQuestions.points,
      questionId: schema.questions.id,
      title: schema.questions.title,
      content: schema.questions.content,
      type: schema.questions.type,
      difficulty: schema.questions.difficulty,
      scoringRule: schema.questions.scoringRule,
      imageUrl: schema.questions.imageUrl,
      explanation: schema.questions.explanation,
      correctAnswerText: schema.questions.correctAnswerText,
      year: schema.questions.year,
      basePoints: schema.questions.points,
      optionId: schema.questionOptions.id,
      optionLabel: schema.questionOptions.label,
      optionContent: schema.questionOptions.content,
      optionImageUrl: schema.questionOptions.imageUrl,
      optionIsCorrect: schema.questionOptions.isCorrect,
    })
    .from(schema.tryoutQuestions)
    .innerJoin(
      schema.tryoutSections,
      eq(schema.tryoutQuestions.tryoutSectionId, schema.tryoutSections.id),
    )
    .innerJoin(schema.questions, eq(schema.tryoutQuestions.questionId, schema.questions.id))
    .leftJoin(schema.questionOptions, eq(schema.questions.id, schema.questionOptions.questionId))
    .where(
      and(
        eq(schema.tryoutSections.tryoutId, tryoutId),
        eq(schema.questions.status, "published"),
      ),
    )
    .orderBy(
      schema.tryoutSections.orderIndex,
      schema.tryoutQuestions.orderIndex,
      schema.questionOptions.id,
    )

  return rows as TryoutQuestionSnapshotRow[]
}

function buildTryoutSessionQuestions(
  rows: TryoutQuestionSnapshotRow[],
  options: { shuffleQuestions: boolean; shuffleOptions: boolean },
) {
  type SessionQuestionSource = {
    tryoutQuestionId: number
    tryoutSectionId: number
    sectionOrderIndex: number
    sourceOrderIndex: number
    points: number
    question: PracticeQuestionSnapshot
    options: (PracticeOptionSnapshot & { isCorrect: boolean })[]
    correctAnswer: PracticeCorrectAnswerSnapshot
  }

  const questionMap = new Map<number, SessionQuestionSource>()

  for (const row of rows) {
    const points = Number(row.overridePoints ?? row.basePoints ?? 0)
    const existing = questionMap.get(row.tryoutQuestionId)

    if (!existing) {
      questionMap.set(row.tryoutQuestionId, {
        tryoutQuestionId: row.tryoutQuestionId,
        tryoutSectionId: row.tryoutSectionId,
        sectionOrderIndex: row.sectionOrderIndex,
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
          explanation: row.explanation ?? null,
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

    const target = questionMap.get(row.tryoutQuestionId)

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

  const sectionGroups = new Map<number, SessionQuestionSource[]>()

  Array.from(questionMap.values())
    .sort((a, b) => a.sectionOrderIndex - b.sectionOrderIndex || a.sourceOrderIndex - b.sourceOrderIndex)
    .forEach((question) => {
      const current = sectionGroups.get(question.tryoutSectionId) ?? []
      current.push(question)
      sectionGroups.set(question.tryoutSectionId, current)
    })

  const orderedQuestions = Array.from(sectionGroups.values()).flatMap((sectionQuestions) =>
    options.shuffleQuestions ? shuffleArray(sectionQuestions) : sectionQuestions,
  )

  return orderedQuestions.map((question, index) => {
    const orderedOptions = options.shuffleOptions
      ? shuffleArray(question.options)
      : question.options

    return {
      tryoutQuestionId: question.tryoutQuestionId,
      tryoutSectionId: question.tryoutSectionId,
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

function normalizeAnswerText(value: string | null | undefined) {
  return value?.trim().replace(/\s+/g, " ").toLowerCase() ?? ""
}

function normalizeExactAnswerText(value: string | null | undefined) {
  return value?.trim() ?? ""
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

function isPracticeQuestionType(value: unknown): value is PracticeQuestionType {
  return (
    value === "multiple_choice" ||
    value === "multiple_answer" ||
    value === "short_answer" ||
    value === "true_false"
  )
}

function isTryoutScoringMethod(value: unknown): value is TryoutScoringMethod {
  return value === "raw_score" || value === "irt_3pl"
}

function gradeTryoutAnswer({
  questionType,
  scoringRule,
  selectedOptionKeys,
  answerText,
  correctOptionKeys,
  correctAnswerText,
  points,
  penalty,
}: {
  questionType: PracticeQuestionType
  scoringRule: "all_or_nothing" | "partial"
  selectedOptionKeys: string[]
  answerText: string | null
  correctOptionKeys: string[]
  correctAnswerText: string | null
  points: number
  penalty: number
}) {
  if (questionType === "short_answer") {
    const normalizedAnswer = normalizeExactAnswerText(answerText)
    const normalizedCorrectAnswer = normalizeExactAnswerText(correctAnswerText)
    const isCorrect =
      normalizedAnswer.length > 0 &&
      normalizedCorrectAnswer.length > 0 &&
      normalizedAnswer === normalizedCorrectAnswer

    return {
      isCorrect,
      score: isCorrect ? points : penalty,
    }
  }

  const selected = new Set(selectedOptionKeys)
  const correct = new Set(correctOptionKeys)
  const fullyCorrect =
    selected.size === correct.size && [...selected].every((key) => correct.has(key))

  if (questionType !== "multiple_answer" || scoringRule !== "partial") {
    return {
      isCorrect: fullyCorrect,
      score: fullyCorrect ? points : penalty,
    }
  }

  const correctSelected = [...selected].filter((key) => correct.has(key)).length
  const wrongSelected = [...selected].filter((key) => !correct.has(key)).length
  const rawScore =
    correct.size > 0 ? ((correctSelected - wrongSelected) / correct.size) * points : 0
  const score = Math.max(penalty, Math.min(points, rawScore))

  return {
    isCorrect: fullyCorrect,
    score,
  }
}

function isAnswerFilled(selectedOptionKeys: string[], answerText: string | null) {
  return selectedOptionKeys.length > 0 || Boolean(answerText?.trim())
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
