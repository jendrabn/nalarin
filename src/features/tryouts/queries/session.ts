import "server-only"

import { and, asc, eq } from "drizzle-orm"

import { db, schema } from "@/db"

import type {
  TryoutCorrectAnswerSnapshot,
  TryoutOptionSnapshot,
  TryoutQuestionSnapshot,
  TryoutRoomAnswer,
  TryoutRoomQuestion,
  TryoutSectionRoomData,
  TryoutSectionSummary,
  TryoutSessionOverviewData,
} from "../types"

export async function getTryoutSessionOverview(
  sessionId: number,
  userId: number,
): Promise<TryoutSessionOverviewData | null> {
  const [session] = await db
    .select({
      id: schema.tryoutSessions.id,
      tryoutId: schema.tryoutSessions.tryoutId,
      status: schema.tryoutSessions.status,
      startedAt: schema.tryoutSessions.startedAt,
      submittedAt: schema.tryoutSessions.submittedAt,
      gradedAt: schema.tryoutSessions.gradedAt,
      totalQuestions: schema.tryoutSessions.totalQuestions,
      totalScore: schema.tryoutSessions.totalScore,
      totalMaxScore: schema.tryoutSessions.totalMaxScore,
      totalSectionsStarted: schema.tryoutSessions.totalSectionsStarted,
      durationUsedSeconds: schema.tryoutSessions.durationUsedSeconds,
      tryoutSlug: schema.tryouts.slug,
      tryoutTitle: schema.tryouts.title,
      tryoutDescription: schema.tryouts.description,
      navigationMode: schema.tryouts.navigationMode,
      allowReviewBeforeSubmit: schema.tryouts.allowReviewBeforeSubmit,
      examTypeName: schema.examTypes.name,
    })
    .from(schema.tryoutSessions)
    .innerJoin(schema.tryouts, eq(schema.tryoutSessions.tryoutId, schema.tryouts.id))
    .innerJoin(schema.examTypes, eq(schema.tryouts.examTypeId, schema.examTypes.id))
    .where(and(eq(schema.tryoutSessions.id, sessionId), eq(schema.tryoutSessions.userId, userId)))
    .limit(1)

  if (!session) {
    return null
  }

  const sections = await getTryoutSectionSummaries(session.id)
  const totalAnswered = sections.reduce((total, section) => total + section.answeredCount, 0)
  const totalMarked = sections.reduce((total, section) => total + section.markedCount, 0)

  return {
    id: session.id,
    tryoutId: session.tryoutId,
    tryoutSlug: session.tryoutSlug,
    title: session.tryoutTitle,
    description: session.tryoutDescription ?? null,
    examTypeName: session.examTypeName,
    status: session.status,
    navigationMode: session.navigationMode,
    allowReviewBeforeSubmit: session.allowReviewBeforeSubmit,
    startedAt: session.startedAt.toISOString(),
    submittedAt: session.submittedAt?.toISOString() ?? null,
    gradedAt: session.gradedAt?.toISOString() ?? null,
    totalQuestions: session.totalQuestions,
    totalSections: sections.length,
    totalDurationMinutes: sections.reduce(
      (total, section) => total + section.durationMinutes,
      0,
    ),
    totalAnswered,
    totalMarked,
    totalScore: Number(session.totalScore ?? 0),
    totalMaxScore: Number(session.totalMaxScore ?? 0),
    totalSectionsStarted: session.totalSectionsStarted,
    durationUsedSeconds: session.durationUsedSeconds,
    sections,
  }
}

export async function getTryoutSectionRoom(
  sessionId: number,
  sectionSessionId: number,
  userId: number,
): Promise<TryoutSectionRoomData | null> {
  const overview = await getTryoutSessionOverview(sessionId, userId)

  if (!overview) {
    return null
  }

  const section = overview.sections.find((item) => item.id === sectionSessionId)

  if (!section) {
    return null
  }

  const [questionRows, answerRows] = await Promise.all([
    db
      .select({
        id: schema.tryoutSessionQuestions.id,
        tryoutQuestionId: schema.tryoutSessionQuestions.tryoutQuestionId,
        questionId: schema.tryoutSessionQuestions.questionId,
        orderIndex: schema.tryoutSessionQuestions.orderIndex,
        questionSnapshot: schema.tryoutSessionQuestions.questionSnapshot,
        optionSnapshot: schema.tryoutSessionQuestions.optionSnapshot,
        correctAnswerSnapshot: schema.tryoutSessionQuestions.correctAnswerSnapshot,
        points: schema.tryoutSessionQuestions.points,
      })
      .from(schema.tryoutSessionQuestions)
      .where(eq(schema.tryoutSessionQuestions.tryoutSectionSessionId, sectionSessionId))
      .orderBy(asc(schema.tryoutSessionQuestions.orderIndex)),
    db
      .select({
        sessionQuestionId: schema.tryoutAnswers.tryoutSessionQuestionId,
        selectedOptionKeys: schema.tryoutAnswers.selectedOptionKeys,
        answerText: schema.tryoutAnswers.answerText,
        isMarkedForReview: schema.tryoutAnswers.isMarkedForReview,
        isCorrect: schema.tryoutAnswers.isCorrect,
        score: schema.tryoutAnswers.score,
        maxScore: schema.tryoutAnswers.maxScore,
        gradingStatus: schema.tryoutAnswers.gradingStatus,
        gradedAt: schema.tryoutAnswers.gradedAt,
      })
      .from(schema.tryoutAnswers)
      .where(eq(schema.tryoutAnswers.tryoutSectionSessionId, sectionSessionId)),
  ])
  const questionSnapshotBySessionQuestionId = new Map(
    questionRows.map((row) => [row.id, row.questionSnapshot]),
  )

  return {
    sessionId: overview.id,
    tryoutId: overview.tryoutId,
    tryoutSlug: overview.tryoutSlug,
    title: overview.title,
    examTypeName: overview.examTypeName,
    navigationMode: overview.navigationMode,
    allowReviewBeforeSubmit: overview.allowReviewBeforeSubmit,
    sessionStatus: overview.status,
    section,
    sections: overview.sections,
    questions: questionRows.map<TryoutRoomQuestion>((row, index) => ({
      id: row.id,
      tryoutQuestionId: row.tryoutQuestionId,
      questionId: row.questionId,
      orderIndex: row.orderIndex,
      displayOrder: index + 1,
      points: Number(row.points ?? 0),
      question: normalizeQuestionSnapshot(row.questionSnapshot),
      options: normalizeOptionSnapshot(row.optionSnapshot, row.questionSnapshot),
      correctAnswer: normalizeCorrectAnswerSnapshot(
        row.correctAnswerSnapshot,
        row.questionSnapshot,
      ),
    })),
    answers: answerRows.map<TryoutRoomAnswer>((row) => ({
      sessionQuestionId: row.sessionQuestionId,
      selectedOptionKeys: normalizeSelectedOptionKeysForQuestion(
        row.selectedOptionKeys,
        questionSnapshotBySessionQuestionId.get(row.sessionQuestionId),
      ),
      answerText: row.answerText ?? "",
      isMarkedForReview: Boolean(row.isMarkedForReview),
      isCorrect: row.isCorrect ?? null,
      score: row.score === null ? null : Number(row.score),
      maxScore: row.maxScore === null ? null : Number(row.maxScore),
      gradingStatus: row.gradingStatus,
      gradedAt: row.gradedAt?.toISOString() ?? null,
    })),
  }
}

async function getTryoutSectionSummaries(sessionId: number): Promise<TryoutSectionSummary[]> {
  const [sectionRows, answerRows] = await Promise.all([
    db
      .select({
        id: schema.tryoutSectionSessions.id,
        tryoutSectionId: schema.tryoutSectionSessions.tryoutSectionId,
        status: schema.tryoutSectionSessions.status,
        durationMinutes: schema.tryoutSectionSessions.durationMinutes,
        totalQuestions: schema.tryoutSectionSessions.totalQuestions,
        correctCount: schema.tryoutSectionSessions.correctCount,
        wrongCount: schema.tryoutSectionSessions.wrongCount,
        unansweredCount: schema.tryoutSectionSessions.unansweredCount,
        score: schema.tryoutSectionSessions.score,
        currentQuestionOrder: schema.tryoutSectionSessions.currentQuestionOrder,
        startedAt: schema.tryoutSectionSessions.startedAt,
        submittedAt: schema.tryoutSectionSessions.submittedAt,
        gradedAt: schema.tryoutSectionSessions.gradedAt,
        title: schema.tryoutSections.title,
        description: schema.tryoutSections.description,
        orderIndex: schema.tryoutSections.orderIndex,
        subjectName: schema.subjects.name,
        subjectSlug: schema.subjects.slug,
      })
      .from(schema.tryoutSectionSessions)
      .innerJoin(
        schema.tryoutSections,
        eq(schema.tryoutSectionSessions.tryoutSectionId, schema.tryoutSections.id),
      )
      .innerJoin(schema.subjects, eq(schema.tryoutSections.subjectId, schema.subjects.id))
      .where(eq(schema.tryoutSectionSessions.tryoutSessionId, sessionId))
      .orderBy(asc(schema.tryoutSections.orderIndex)),
    db
      .select({
        sectionSessionId: schema.tryoutAnswers.tryoutSectionSessionId,
        selectedOptionKeys: schema.tryoutAnswers.selectedOptionKeys,
        answerText: schema.tryoutAnswers.answerText,
        isMarkedForReview: schema.tryoutAnswers.isMarkedForReview,
      })
      .from(schema.tryoutAnswers)
      .where(eq(schema.tryoutAnswers.tryoutSessionId, sessionId)),
  ])
  const statsBySection = new Map<number, { answeredCount: number; markedCount: number }>()

  for (const row of answerRows) {
    const selectedOptionKeys = normalizeSelectedOptionKeys(row.selectedOptionKeys)
    const isAnswered = selectedOptionKeys.length > 0 || Boolean(row.answerText?.trim())
    const current = statsBySection.get(row.sectionSessionId) ?? {
      answeredCount: 0,
      markedCount: 0,
    }

    if (isAnswered) {
      current.answeredCount += 1
    }

    if (row.isMarkedForReview) {
      current.markedCount += 1
    }

    statsBySection.set(row.sectionSessionId, current)
  }

  return sectionRows.map<TryoutSectionSummary>((row) => {
    const stats = statsBySection.get(row.id) ?? { answeredCount: 0, markedCount: 0 }

    return {
      id: row.id,
      tryoutSectionId: row.tryoutSectionId,
      title: row.title,
      description: row.description ?? null,
      subjectName: row.subjectName,
      subjectCode: row.subjectSlug ?? null,
      orderIndex: row.orderIndex,
      status: row.status,
      durationMinutes: row.durationMinutes,
      totalQuestions: row.totalQuestions,
      answeredCount: stats.answeredCount,
      markedCount: stats.markedCount,
      correctCount: row.correctCount,
      wrongCount: row.wrongCount,
      unansweredCount: row.unansweredCount,
      score: Number(row.score ?? 0),
      currentQuestionOrder: row.currentQuestionOrder ?? null,
      startedAt: row.startedAt?.toISOString() ?? null,
      submittedAt: row.submittedAt?.toISOString() ?? null,
      gradedAt: row.gradedAt?.toISOString() ?? null,
    }
  })
}

function normalizeQuestionSnapshot(value: unknown): TryoutQuestionSnapshot {
  const snapshot = value as Partial<TryoutQuestionSnapshot>
  const legacyExplanation =
    typeof snapshot.explanation === "string"
      ? snapshot.explanation
      : typeof (snapshot as { manualExplanation?: unknown }).manualExplanation === "string"
        ? (snapshot as { manualExplanation?: string }).manualExplanation ?? null
        : typeof (snapshot as { aiExplanation?: unknown }).aiExplanation === "string"
          ? (snapshot as { aiExplanation?: string }).aiExplanation ?? null
          : null

  return {
    id: Number(snapshot.id ?? 0),
    title: typeof snapshot.title === "string" ? snapshot.title : null,
    content: typeof snapshot.content === "string" ? snapshot.content : "",
    type: snapshot.type ?? "multiple_choice",
    difficulty: snapshot.difficulty ?? "medium",
    scoringRule: snapshot.scoringRule ?? null,
    imageUrl: typeof snapshot.imageUrl === "string" ? snapshot.imageUrl : null,
    explanation: legacyExplanation,
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
