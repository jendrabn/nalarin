import "server-only"

import { and, asc, desc, eq, sql } from "drizzle-orm"

import { PLAN_CONFIG, type PlanCode } from "@/config/plans"
import { db, schema } from "@/db"

import type {
  TryoutCorrectAnswerSnapshot,
  TryoutOptionSnapshot,
  TryoutQuestionSnapshot,
  TryoutResultData,
  TryoutReviewData,
  TryoutReviewQuestion,
  TryoutReviewSection,
  TryoutRoomAnswer,
  TryoutRankingData,
  TryoutRankingRow,
  TryoutSectionResult,
} from "../types"
import { isFeatureReleased } from "../utils/status"

type ReleaseInput = {
  enabled: boolean
  releaseAt: Date | null
}

export async function getTryoutResultData(
  sessionId: number,
  userId: number,
  planCode: PlanCode,
): Promise<TryoutResultData | null> {
  const context = await getTryoutSessionResultContext(sessionId, userId)

  if (!context) {
    return null
  }

  const now = new Date()
  const resultRelease = getReleaseState(
    {
      enabled: context.showResultAfterSubmit,
      releaseAt: context.resultReleaseAt,
    },
    now,
  )
  const rankingRelease = getReleaseState(
    {
      enabled: context.showRankingAfterSubmit,
      releaseAt: context.rankingReleaseAt,
    },
    now,
  )
  const explanationRelease = getReleaseState(
    {
      enabled: context.showExplanationAfterSubmit,
      releaseAt: context.explanationReleaseAt,
    },
    now,
  )
  const sections = await getTryoutSectionResults(sessionId)
  const scorePercentage =
    context.totalMaxScore > 0
      ? Math.round((context.totalScore / context.totalMaxScore) * 100)
      : 0

  return {
    ...context,
    scorePercentage,
    isFinal: context.status === "graded",
    resultRelease,
    rankingRelease: {
      ...rankingRelease,
      allowedByPlan: PLAN_CONFIG[planCode].access.ranking,
    },
    explanationRelease: {
      ...explanationRelease,
      allowedByPlan: PLAN_CONFIG[planCode].access.fullExplanation,
    },
    sections,
  }
}

export async function getTryoutRankingData(
  sessionId: number,
  userId: number,
  planCode: PlanCode,
): Promise<TryoutRankingData | null> {
  const context = await getTryoutSessionResultContext(sessionId, userId)

  if (!context) {
    return null
  }

  const now = new Date()
  const release = getReleaseState(
    {
      enabled: context.showRankingAfterSubmit,
      releaseAt: context.rankingReleaseAt,
    },
    now,
  )
  const allowedByPlan = PLAN_CONFIG[planCode].access.ranking

  if (!release.available) {
    return {
      session: context,
      release: {
        ...release,
        allowedByPlan,
      },
      participantCount: 0,
      ownRank: null,
      leaderboard: [],
    }
  }

  const rows = await db
    .select({
      sessionId: schema.tryoutSessions.id,
      userId: schema.tryoutSessions.userId,
      userName: schema.users.name,
      userAvatarUrl: schema.users.avatarUrl,
      totalScore: schema.tryoutSessions.totalScore,
      totalMaxScore: schema.tryoutSessions.totalMaxScore,
      totalCorrect: schema.tryoutSessions.totalCorrect,
      totalWrong: schema.tryoutSessions.totalWrong,
      totalUnanswered: schema.tryoutSessions.totalUnanswered,
      totalSectionsStarted: schema.tryoutSessions.totalSectionsStarted,
      durationUsedSeconds: schema.tryoutSessions.durationUsedSeconds,
      submittedAt: schema.tryoutSessions.submittedAt,
      gradedAt: schema.tryoutSessions.gradedAt,
    })
    .from(schema.tryoutSessions)
    .innerJoin(schema.users, eq(schema.tryoutSessions.userId, schema.users.id))
    .where(
      and(
        eq(schema.tryoutSessions.tryoutId, context.tryoutId),
        eq(schema.tryoutSessions.status, "graded"),
      ),
    )
    .orderBy(
      desc(schema.tryoutSessions.totalScore),
      desc(schema.tryoutSessions.totalSectionsStarted),
      desc(schema.tryoutSessions.totalCorrect),
      asc(schema.tryoutSessions.durationUsedSeconds),
      asc(schema.tryoutSessions.submittedAt),
    )

  const rankedRows = rows.map<TryoutRankingRow>((row, index) => ({
    rank: index + 1,
    sessionId: row.sessionId,
    userId: row.userId,
    userName: row.userName,
    userAvatarUrl: row.userAvatarUrl ?? null,
    totalScore: Number(row.totalScore ?? 0),
    totalMaxScore: Number(row.totalMaxScore ?? 0),
    totalCorrect: row.totalCorrect,
    totalWrong: row.totalWrong,
    totalUnanswered: row.totalUnanswered,
    totalSectionsStarted: row.totalSectionsStarted,
    durationUsedSeconds: row.durationUsedSeconds,
    submittedAt: row.submittedAt?.toISOString() ?? null,
    gradedAt: row.gradedAt?.toISOString() ?? null,
    isCurrentUser: row.userId === userId,
  }))

  return {
    session: context,
    release: {
      ...release,
      allowedByPlan,
    },
    participantCount: rankedRows.length,
    ownRank: rankedRows.find((row) => row.userId === userId) ?? null,
    leaderboard: allowedByPlan ? rankedRows : [],
  }
}

export async function getTryoutReviewData(
  sessionId: number,
  userId: number,
  planCode: PlanCode,
): Promise<TryoutReviewData | null> {
  const context = await getTryoutSessionResultContext(sessionId, userId)

  if (!context) {
    return null
  }

  const now = new Date()
  const resultRelease = getReleaseState(
    {
      enabled: context.showResultAfterSubmit,
      releaseAt: context.resultReleaseAt,
    },
    now,
  )
  const explanationRelease = getReleaseState(
    {
      enabled: context.showExplanationAfterSubmit,
      releaseAt: context.explanationReleaseAt,
    },
    now,
  )
  const explanationsAllowedByPlan = PLAN_CONFIG[planCode].access.fullExplanation

  if (!resultRelease.available) {
    return {
      session: context,
      resultRelease,
      explanationRelease: {
        ...explanationRelease,
        allowedByPlan: explanationsAllowedByPlan,
      },
      sections: [],
    }
  }

  const rows = await db
    .select({
      sectionSessionId: schema.tryoutSectionSessions.id,
      sectionTitle: schema.tryoutSections.title,
      sectionOrderIndex: schema.tryoutSections.orderIndex,
      subjectName: schema.subjects.name,
      sectionScore: schema.tryoutSectionSessions.score,
      sectionCorrectCount: schema.tryoutSectionSessions.correctCount,
      sectionWrongCount: schema.tryoutSectionSessions.wrongCount,
      sectionUnansweredCount: schema.tryoutSectionSessions.unansweredCount,
      sectionDurationMinutes: schema.tryoutSectionSessions.durationMinutes,
      sectionStartedAt: schema.tryoutSectionSessions.startedAt,
      sectionSubmittedAt: schema.tryoutSectionSessions.submittedAt,
      sessionQuestionId: schema.tryoutSessionQuestions.id,
      tryoutQuestionId: schema.tryoutSessionQuestions.tryoutQuestionId,
      questionId: schema.tryoutSessionQuestions.questionId,
      orderIndex: schema.tryoutSessionQuestions.orderIndex,
      questionSnapshot: schema.tryoutSessionQuestions.questionSnapshot,
      optionSnapshot: schema.tryoutSessionQuestions.optionSnapshot,
      correctAnswerSnapshot: schema.tryoutSessionQuestions.correctAnswerSnapshot,
      points: schema.tryoutSessionQuestions.points,
      selectedOptionKeys: schema.tryoutAnswers.selectedOptionKeys,
      answerText: schema.tryoutAnswers.answerText,
      isMarkedForReview: schema.tryoutAnswers.isMarkedForReview,
      isCorrect: schema.tryoutAnswers.isCorrect,
      score: schema.tryoutAnswers.score,
      maxScore: schema.tryoutAnswers.maxScore,
      gradingStatus: schema.tryoutAnswers.gradingStatus,
      gradedAt: schema.tryoutAnswers.gradedAt,
      manualExplanation: schema.questions.manualExplanation,
      aiExplanation: schema.questions.aiExplanation,
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
      schema.tryoutSections,
      eq(schema.tryoutSectionSessions.tryoutSectionId, schema.tryoutSections.id),
    )
    .innerJoin(schema.subjects, eq(schema.tryoutSections.subjectId, schema.subjects.id))
    .innerJoin(schema.questions, eq(schema.tryoutSessionQuestions.questionId, schema.questions.id))
    .leftJoin(
      schema.tryoutAnswers,
      eq(schema.tryoutSessionQuestions.id, schema.tryoutAnswers.tryoutSessionQuestionId),
    )
    .where(eq(schema.tryoutSessionQuestions.tryoutSessionId, sessionId))
    .orderBy(schema.tryoutSections.orderIndex, schema.tryoutSessionQuestions.orderIndex)

  const sectionMap = new Map<number, TryoutReviewSection>()

  for (const row of rows) {
    const section =
      sectionMap.get(row.sectionSessionId) ??
      ({
        id: row.sectionSessionId,
        title: row.sectionTitle,
        subjectName: row.subjectName,
        orderIndex: row.sectionOrderIndex,
        score: Number(row.sectionScore ?? 0),
        maxScore: 0,
        correctCount: row.sectionCorrectCount,
        wrongCount: row.sectionWrongCount,
        unansweredCount: row.sectionUnansweredCount,
        durationMinutes: row.sectionDurationMinutes,
        durationUsedSeconds: getDurationSeconds(row.sectionStartedAt, row.sectionSubmittedAt),
        questions: [],
      } satisfies TryoutReviewSection)

    const questionSnapshot = normalizeQuestionSnapshot(row.questionSnapshot)
    const answer = normalizeReviewAnswer({
      sessionQuestionId: row.sessionQuestionId,
      selectedOptionKeys: row.selectedOptionKeys,
      answerText: row.answerText,
      isMarkedForReview: row.isMarkedForReview,
      isCorrect: row.isCorrect,
      score: row.score,
      maxScore: row.maxScore,
      gradingStatus: row.gradingStatus,
      gradedAt: row.gradedAt,
      questionSnapshot,
    })
    const question = {
      id: row.sessionQuestionId,
      tryoutQuestionId: row.tryoutQuestionId,
      questionId: row.questionId,
      orderIndex: row.orderIndex,
      displayOrder: row.orderIndex,
      points: Number(row.points ?? 0),
      question: {
        ...questionSnapshot,
        manualExplanation: row.manualExplanation ?? questionSnapshot.manualExplanation,
        aiExplanation: row.aiExplanation ?? questionSnapshot.aiExplanation,
      },
      options: normalizeOptionSnapshot(row.optionSnapshot, row.questionSnapshot),
      correctAnswer: normalizeCorrectAnswerSnapshot(
        row.correctAnswerSnapshot,
        row.questionSnapshot,
      ),
      answer,
      status: getReviewQuestionStatus(answer),
    } satisfies TryoutReviewQuestion

    section.maxScore += question.points
    section.questions.push(question)
    sectionMap.set(row.sectionSessionId, section)
  }

  return {
    session: context,
    resultRelease,
    explanationRelease: {
      ...explanationRelease,
      allowedByPlan: explanationsAllowedByPlan,
    },
    sections: Array.from(sectionMap.values()),
  }
}

async function getTryoutSessionResultContext(sessionId: number, userId: number) {
  const [session] = await db
    .select({
      id: schema.tryoutSessions.id,
      tryoutId: schema.tryoutSessions.tryoutId,
      userId: schema.tryoutSessions.userId,
      status: schema.tryoutSessions.status,
      startedAt: schema.tryoutSessions.startedAt,
      submittedAt: schema.tryoutSessions.submittedAt,
      gradedAt: schema.tryoutSessions.gradedAt,
      totalQuestions: schema.tryoutSessions.totalQuestions,
      totalCorrect: schema.tryoutSessions.totalCorrect,
      totalWrong: schema.tryoutSessions.totalWrong,
      totalUnanswered: schema.tryoutSessions.totalUnanswered,
      totalScore: schema.tryoutSessions.totalScore,
      totalMaxScore: schema.tryoutSessions.totalMaxScore,
      totalSectionsStarted: schema.tryoutSessions.totalSectionsStarted,
      durationUsedSeconds: schema.tryoutSessions.durationUsedSeconds,
      autoSubmitted: schema.tryoutSessions.autoSubmitted,
      tryoutTitle: schema.tryouts.title,
      tryoutSlug: schema.tryouts.slug,
      tryoutDescription: schema.tryouts.description,
      examTypeName: schema.examTypes.name,
      wrongAnswerPenalty: schema.tryouts.wrongAnswerPenalty,
      showResultAfterSubmit: schema.tryouts.showResultAfterSubmit,
      resultReleaseAt: schema.tryouts.resultReleaseAt,
      showRankingAfterSubmit: schema.tryouts.showRankingAfterSubmit,
      rankingReleaseAt: schema.tryouts.rankingReleaseAt,
      showExplanationAfterSubmit: schema.tryouts.showExplanationAfterSubmit,
      explanationReleaseAt: schema.tryouts.explanationReleaseAt,
    })
    .from(schema.tryoutSessions)
    .innerJoin(schema.tryouts, eq(schema.tryoutSessions.tryoutId, schema.tryouts.id))
    .innerJoin(schema.examTypes, eq(schema.tryouts.examTypeId, schema.examTypes.id))
    .where(and(eq(schema.tryoutSessions.id, sessionId), eq(schema.tryoutSessions.userId, userId)))
    .limit(1)

  if (!session) {
    return null
  }

  return {
    id: session.id,
    tryoutId: session.tryoutId,
    userId: session.userId,
    title: session.tryoutTitle,
    slug: session.tryoutSlug,
    description: session.tryoutDescription ?? null,
    examTypeName: session.examTypeName,
    status: session.status,
    startedAt: session.startedAt.toISOString(),
    submittedAt: session.submittedAt?.toISOString() ?? null,
    gradedAt: session.gradedAt?.toISOString() ?? null,
    totalQuestions: session.totalQuestions,
    totalCorrect: session.totalCorrect,
    totalWrong: session.totalWrong,
    totalUnanswered: session.totalUnanswered,
    totalScore: Number(session.totalScore ?? 0),
    totalMaxScore: Number(session.totalMaxScore ?? 0),
    totalSectionsStarted: session.totalSectionsStarted,
    durationUsedSeconds: session.durationUsedSeconds,
    autoSubmitted: session.autoSubmitted,
    wrongAnswerPenalty: Number(session.wrongAnswerPenalty ?? 0),
    showResultAfterSubmit: session.showResultAfterSubmit,
    resultReleaseAt: session.resultReleaseAt,
    showRankingAfterSubmit: session.showRankingAfterSubmit,
    rankingReleaseAt: session.rankingReleaseAt,
    showExplanationAfterSubmit: session.showExplanationAfterSubmit,
    explanationReleaseAt: session.explanationReleaseAt,
  }
}

async function getTryoutSectionResults(sessionId: number): Promise<TryoutSectionResult[]> {
  const rows = await db
    .select({
      id: schema.tryoutSectionSessions.id,
      tryoutSectionId: schema.tryoutSectionSessions.tryoutSectionId,
      title: schema.tryoutSections.title,
      subjectName: schema.subjects.name,
      orderIndex: schema.tryoutSections.orderIndex,
      durationMinutes: schema.tryoutSectionSessions.durationMinutes,
      startedAt: schema.tryoutSectionSessions.startedAt,
      submittedAt: schema.tryoutSectionSessions.submittedAt,
      totalQuestions: schema.tryoutSectionSessions.totalQuestions,
      correctCount: schema.tryoutSectionSessions.correctCount,
      wrongCount: schema.tryoutSectionSessions.wrongCount,
      unansweredCount: schema.tryoutSectionSessions.unansweredCount,
      score: schema.tryoutSectionSessions.score,
      maxScore: sql<string>`coalesce(sum(${schema.tryoutSessionQuestions.points}), 0)`,
    })
    .from(schema.tryoutSectionSessions)
    .innerJoin(
      schema.tryoutSections,
      eq(schema.tryoutSectionSessions.tryoutSectionId, schema.tryoutSections.id),
    )
    .innerJoin(schema.subjects, eq(schema.tryoutSections.subjectId, schema.subjects.id))
    .leftJoin(
      schema.tryoutSessionQuestions,
      eq(
        schema.tryoutSectionSessions.id,
        schema.tryoutSessionQuestions.tryoutSectionSessionId,
      ),
    )
    .where(eq(schema.tryoutSectionSessions.tryoutSessionId, sessionId))
    .groupBy(
      schema.tryoutSectionSessions.id,
      schema.tryoutSectionSessions.tryoutSectionId,
      schema.tryoutSections.title,
      schema.subjects.name,
      schema.tryoutSections.orderIndex,
      schema.tryoutSectionSessions.durationMinutes,
      schema.tryoutSectionSessions.startedAt,
      schema.tryoutSectionSessions.submittedAt,
      schema.tryoutSectionSessions.totalQuestions,
      schema.tryoutSectionSessions.correctCount,
      schema.tryoutSectionSessions.wrongCount,
      schema.tryoutSectionSessions.unansweredCount,
      schema.tryoutSectionSessions.score,
    )
    .orderBy(asc(schema.tryoutSections.orderIndex))

  return rows.map((row) => ({
    id: row.id,
    tryoutSectionId: row.tryoutSectionId,
    title: row.title,
    subjectName: row.subjectName,
    orderIndex: row.orderIndex,
    durationMinutes: row.durationMinutes,
    durationUsedSeconds: getDurationSeconds(row.startedAt, row.submittedAt),
    totalQuestions: row.totalQuestions,
    correctCount: row.correctCount,
    wrongCount: row.wrongCount,
    unansweredCount: row.unansweredCount,
    score: Number(row.score ?? 0),
    maxScore: Number(row.maxScore ?? 0),
  }))
}

function getReleaseState(input: ReleaseInput, now: Date) {
  const releaseAt = input.releaseAt?.toISOString() ?? null

  return {
    enabled: input.enabled,
    releaseAt,
    available: isFeatureReleased(
      {
        enabled: input.enabled,
        releaseAt,
      },
      now,
    ),
  }
}

function normalizeReviewAnswer(input: {
  sessionQuestionId: number
  selectedOptionKeys: unknown
  answerText: string | null
  isMarkedForReview: boolean | null
  isCorrect: boolean | null
  score: string | number | null
  maxScore: string | number | null
  gradingStatus: TryoutRoomAnswer["gradingStatus"] | null
  gradedAt: Date | null
  questionSnapshot: TryoutQuestionSnapshot
}): TryoutRoomAnswer | null {
  if (
    input.selectedOptionKeys === null &&
    input.answerText === null &&
    input.gradingStatus === null
  ) {
    return null
  }

  return {
    sessionQuestionId: input.sessionQuestionId,
    selectedOptionKeys: normalizeSelectedOptionKeysForQuestion(
      input.selectedOptionKeys,
      input.questionSnapshot,
    ),
    answerText: input.answerText ?? "",
    isMarkedForReview: Boolean(input.isMarkedForReview),
    isCorrect: input.isCorrect,
    score: input.score === null ? null : Number(input.score),
    maxScore: input.maxScore === null ? null : Number(input.maxScore),
    gradingStatus: input.gradingStatus ?? "not_required",
    gradedAt: input.gradedAt?.toISOString() ?? null,
  }
}

function getReviewQuestionStatus(
  answer: TryoutRoomAnswer | null,
): TryoutReviewQuestion["status"] {
  if (!answer || !isAnswerFilled(answer)) {
    return "unanswered"
  }

  if (answer.gradingStatus === "pending" || answer.gradingStatus === "needs_review") {
    return "pending"
  }

  return answer.isCorrect ? "correct" : "wrong"
}

function normalizeQuestionSnapshot(value: unknown): TryoutQuestionSnapshot {
  const snapshot = value as Partial<TryoutQuestionSnapshot>
  const legacyExplanation = typeof snapshot.explanation === "string" ? snapshot.explanation : null

  return {
    id: Number(snapshot.id ?? 0),
    title: typeof snapshot.title === "string" ? snapshot.title : null,
    content: typeof snapshot.content === "string" ? snapshot.content : "",
    type: snapshot.type ?? "multiple_choice",
    difficulty: snapshot.difficulty ?? "medium",
    scoringRule: snapshot.scoringRule ?? null,
    imageUrl: typeof snapshot.imageUrl === "string" ? snapshot.imageUrl : null,
    explanation: legacyExplanation,
    manualExplanation:
      typeof snapshot.manualExplanation === "string" ? snapshot.manualExplanation : null,
    aiExplanation: typeof snapshot.aiExplanation === "string" ? snapshot.aiExplanation : null,
    year: typeof snapshot.year === "number" ? snapshot.year : null,
    points: Number(snapshot.points ?? 0),
  }
}

function normalizeCorrectAnswerSnapshot(
  value: unknown,
  questionValue?: unknown,
): TryoutCorrectAnswerSnapshot {
  const snapshot = value as Partial<TryoutCorrectAnswerSnapshot>
  const question = questionValue as Partial<TryoutQuestionSnapshot>
  const answerText = typeof snapshot.answerText === "string" ? snapshot.answerText : null

  return {
    optionKeys:
      question.type === "true_false"
        ? getTrueFalseCorrectOptionKeys(answerText)
        : normalizeSelectedOptionKeys(snapshot.optionKeys),
    answerText,
  }
}

function normalizeOptionSnapshot(value: unknown, questionValue?: unknown): TryoutOptionSnapshot[] {
  if (!Array.isArray(value)) {
    return []
  }
  const question = questionValue as Partial<TryoutQuestionSnapshot>

  return value.map((option, index) => {
    const item = option as Partial<TryoutOptionSnapshot>
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

function normalizeSelectedOptionKeys(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((item): item is string => typeof item === "string")
}

function normalizeSelectedOptionKeysForQuestion(
  value: unknown,
  questionValue?: unknown,
): string[] {
  const keys = normalizeSelectedOptionKeys(value)
  const question = questionValue as Partial<TryoutQuestionSnapshot>

  if (question.type !== "true_false") {
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

function isAnswerFilled(answer: TryoutRoomAnswer) {
  return answer.selectedOptionKeys.length > 0 || answer.answerText.trim().length > 0
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

function getDurationSeconds(startedAt: Date | null, submittedAt: Date | null) {
  if (!startedAt || !submittedAt) {
    return 0
  }

  return Math.max(0, Math.floor((submittedAt.getTime() - startedAt.getTime()) / 1000))
}
