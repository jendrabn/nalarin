import "server-only"

import { and, asc, eq } from "drizzle-orm"

import { db, schema } from "@/db"

import type {
  PracticeCorrectAnswerSnapshot,
  PracticeOptionSnapshot,
  PracticeQuestionSnapshot,
  PracticeRoomAnswer,
  PracticeRoomData,
  PracticeRoomQuestion,
  PracticeSessionReviewQuestion,
  PracticeSessionSummary,
} from "../types"

export async function getPracticeSessionRoom(
  sessionId: number,
  userId: number,
): Promise<PracticeRoomData | null> {
  const [session] = await db
    .select({
      id: schema.practiceSessions.id,
      practiceId: schema.practiceSessions.practiceId,
      mode: schema.practiceSessions.mode,
      status: schema.practiceSessions.status,
      startedAt: schema.practiceSessions.startedAt,
      durationMinutes: schema.practiceSessions.durationMinutes,
      currentQuestionOrder: schema.practiceSessions.currentQuestionOrder,
      totalQuestions: schema.practiceSessions.totalQuestions,
      practiceTitle: schema.practices.title,
      examTypeName: schema.examTypes.name,
      subjectName: schema.subjects.name,
    })
    .from(schema.practiceSessions)
    .innerJoin(schema.practices, eq(schema.practiceSessions.practiceId, schema.practices.id))
    .innerJoin(schema.examTypes, eq(schema.practices.examTypeId, schema.examTypes.id))
    .innerJoin(schema.subjects, eq(schema.practices.subjectId, schema.subjects.id))
    .where(and(eq(schema.practiceSessions.id, sessionId), eq(schema.practiceSessions.userId, userId)))
    .limit(1)

  if (!session) {
    return null
  }

  const [questionRows, answerRows] = await Promise.all([
    db
      .select({
        id: schema.practiceSessionQuestions.id,
        practiceQuestionId: schema.practiceSessionQuestions.practiceQuestionId,
        questionId: schema.practiceSessionQuestions.questionId,
        orderIndex: schema.practiceSessionQuestions.orderIndex,
        questionSnapshot: schema.practiceSessionQuestions.questionSnapshot,
        optionSnapshot: schema.practiceSessionQuestions.optionSnapshot,
        correctAnswerSnapshot: schema.practiceSessionQuestions.correctAnswerSnapshot,
        points: schema.practiceSessionQuestions.points,
      })
      .from(schema.practiceSessionQuestions)
      .where(eq(schema.practiceSessionQuestions.practiceSessionId, session.id))
      .orderBy(asc(schema.practiceSessionQuestions.orderIndex)),
    db
      .select({
        sessionQuestionId: schema.practiceAnswers.practiceSessionQuestionId,
        selectedOptionKeys: schema.practiceAnswers.selectedOptionKeys,
        answerText: schema.practiceAnswers.answerText,
        isMarkedForReview: schema.practiceAnswers.isMarkedForReview,
        isCorrect: schema.practiceAnswers.isCorrect,
        score: schema.practiceAnswers.score,
        maxScore: schema.practiceAnswers.maxScore,
        gradingStatus: schema.practiceAnswers.gradingStatus,
        gradedAt: schema.practiceAnswers.gradedAt,
      })
      .from(schema.practiceAnswers)
      .where(eq(schema.practiceAnswers.practiceSessionId, session.id)),
  ])
  const questionSnapshotBySessionQuestionId = new Map(
    questionRows.map((row) => [row.id, row.questionSnapshot]),
  )

  return {
    id: session.id,
    practiceId: session.practiceId,
    title: session.practiceTitle,
    examTypeName: session.examTypeName,
    subjectName: session.subjectName,
    mode: session.mode,
    status: session.status,
    startedAt: session.startedAt.toISOString(),
    durationMinutes: session.durationMinutes ?? null,
    currentQuestionOrder: session.currentQuestionOrder ?? null,
    totalQuestions: session.totalQuestions,
    questions: questionRows.map<PracticeRoomQuestion>((row) => ({
      id: row.id,
      practiceQuestionId: row.practiceQuestionId,
      questionId: row.questionId,
      orderIndex: row.orderIndex,
      points: Number(row.points ?? 0),
      question: normalizeQuestionSnapshot(row.questionSnapshot),
      options: normalizeOptionSnapshot(row.optionSnapshot, row.questionSnapshot),
      correctAnswer: normalizeCorrectAnswerSnapshot(
        row.correctAnswerSnapshot,
        row.questionSnapshot,
      ),
    })),
    answers: answerRows.map<PracticeRoomAnswer>((row) => ({
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

export async function getPracticeSessionSummary(
  sessionId: number,
  userId: number,
): Promise<PracticeSessionSummary | null> {
  const room = await getPracticeSessionRoom(sessionId, userId)

  if (!room) {
    return null
  }

  const [sessionTotals] = await db
    .select({
      submittedAt: schema.practiceSessions.submittedAt,
      gradedAt: schema.practiceSessions.gradedAt,
      totalCorrect: schema.practiceSessions.totalCorrect,
      totalWrong: schema.practiceSessions.totalWrong,
      totalUnanswered: schema.practiceSessions.totalUnanswered,
      totalScore: schema.practiceSessions.totalScore,
      totalMaxScore: schema.practiceSessions.totalMaxScore,
    })
    .from(schema.practiceSessions)
    .where(and(eq(schema.practiceSessions.id, sessionId), eq(schema.practiceSessions.userId, userId)))
    .limit(1)

  if (!sessionTotals) {
    return null
  }

  const answerByQuestion = new Map(
    room.answers.map((answer) => [answer.sessionQuestionId, answer]),
  )
  const questions = room.questions.map<PracticeSessionReviewQuestion>((question) => {
    const answer = answerByQuestion.get(question.id) ?? null
    const answered = answer ? isAnswerFilled(answer) : false

    return {
      ...question,
      answer,
      status: !answered ? "unanswered" : answer?.isCorrect ? "correct" : "wrong",
    }
  })
  const submittedAt = sessionTotals.submittedAt?.toISOString() ?? null
  const gradedAt = sessionTotals.gradedAt?.toISOString() ?? null
  const durationEnd = sessionTotals.submittedAt ?? new Date()
  const durationSeconds = Math.max(
    0,
    Math.floor((durationEnd.getTime() - new Date(room.startedAt).getTime()) / 1000),
  )
  const totalScore = Number(sessionTotals.totalScore ?? 0)
  const totalMaxScore = Number(sessionTotals.totalMaxScore ?? 0)

  return {
    id: room.id,
    practiceId: room.practiceId,
    title: room.title,
    examTypeName: room.examTypeName,
    subjectName: room.subjectName,
    mode: room.mode,
    status: room.status,
    startedAt: room.startedAt,
    submittedAt,
    gradedAt,
    durationSeconds,
    totalQuestions: room.totalQuestions,
    totalCorrect: sessionTotals.totalCorrect,
    totalWrong: sessionTotals.totalWrong,
    totalUnanswered: sessionTotals.totalUnanswered,
    totalScore,
    totalMaxScore,
    accuracy: totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0,
    questions,
  }
}

function normalizeQuestionSnapshot(value: unknown): PracticeQuestionSnapshot {
  const snapshot = value as Partial<PracticeQuestionSnapshot>
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

function normalizeOptionSnapshot(
  value: unknown,
  questionValue?: unknown,
): PracticeOptionSnapshot[] {
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
  const question = questionValue as Partial<PracticeQuestionSnapshot>

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

function isAnswerFilled(answer: PracticeRoomAnswer) {
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
