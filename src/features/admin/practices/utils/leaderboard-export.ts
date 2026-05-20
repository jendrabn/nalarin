import * as XLSX from "xlsx"

import type {
  PracticeInsightData,
  PracticeInsightParticipantRow,
  PracticeInsightSessionRow,
  PracticeSessionInsightStatus,
} from "../queries/insights"
import { formatDuration } from "./insights"

type WorkbookSheetRow = Record<string, string | number | null>

const statusLabels: Record<PracticeSessionInsightStatus, string> = {
  pending: "Pending",
  in_progress: "In progress",
  submitted: "Submitted",
  grading: "Grading",
  graded: "Graded",
  cancelled: "Cancelled",
}

function formatExportDateTime(value: string | null) {
  if (!value) {
    return "-"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

function formatModeLabel(value: PracticeInsightSessionRow["mode"]) {
  return value === "quiz" ? "Quiz" : "Practice"
}

function sanitizeFileName(value: string) {
  const safe = value
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()

  return safe || "practice"
}

function buildLeaderboardRows(participants: PracticeInsightParticipantRow[]): WorkbookSheetRow[] {
  return participants.map((participant) => ({
    Rank: participant.rank,
    Participant: participant.userName,
    Sessions: participant.sessionCount,
    "Graded Sessions": participant.gradedSessionCount,
    "Best Score": participant.bestScore,
    "Average Score": participant.averageScore,
    "Median Score": participant.medianScore,
    "Accuracy (%)": participant.averageAccuracy,
    Correct: participant.totalCorrect,
    Wrong: participant.totalWrong,
    Blank: participant.totalUnanswered,
    "Average Duration": formatDuration(Math.round(participant.averageDurationSeconds)),
    "Latest Status": statusLabels[participant.latestStatus],
    "Latest Started At": formatExportDateTime(participant.latestStartedAt),
  }))
}

function buildSessionRows(sessions: PracticeInsightSessionRow[]): WorkbookSheetRow[] {
  return sessions.map((session) => ({
    "Session ID": session.sessionId,
    "User ID": session.userId,
    Participant: session.userName,
    Attempt: session.attemptNumber,
    Mode: formatModeLabel(session.mode),
    Status: statusLabels[session.status],
    Score: session.totalScore,
    "Max Score": session.totalMaxScore,
    Correct: session.totalCorrect,
    Wrong: session.totalWrong,
    Blank: session.totalUnanswered,
    Duration: formatDuration(session.durationSeconds),
    "Started At": formatExportDateTime(session.startedAt),
    "Submitted At": formatExportDateTime(session.submittedAt),
    "Graded At": formatExportDateTime(session.gradedAt),
    "Last Saved At": formatExportDateTime(session.lastSavedAt),
  }))
}

function applyColumnWidths(sheet: XLSX.WorkSheet, widths: number[]) {
  sheet["!cols"] = widths.map((wch) => ({ wch }))
}

function appendSheetFromRows(
  workbook: XLSX.WorkBook,
  sheetName: string,
  rows: WorkbookSheetRow[],
  widths: number[],
) {
  const sheet = XLSX.utils.json_to_sheet(rows)
  applyColumnWidths(sheet, widths)
  XLSX.utils.book_append_sheet(workbook, sheet, sheetName)
}

export function downloadPracticeLeaderboardWorkbook(insight: PracticeInsightData) {
  const workbook = XLSX.utils.book_new()

  appendSheetFromRows(
    workbook,
    "Leaderboard",
    buildLeaderboardRows(insight.participants),
    [8, 30, 10, 14, 12, 12, 12, 12, 10, 10, 10, 16, 16, 22],
  )

  appendSheetFromRows(
    workbook,
    "Sessions",
    buildSessionRows(insight.sessions),
    [10, 10, 30, 8, 12, 12, 10, 10, 10, 10, 10, 14, 22, 22, 22, 22],
  )

  const data = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
  const blob = new Blob([data], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")

  link.href = url
  link.download = `${sanitizeFileName(insight.practice.title)}-results.xlsx`
  link.click()

  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}
