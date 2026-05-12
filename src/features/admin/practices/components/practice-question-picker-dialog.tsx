"use client"

import { TryoutQuestionPickerDialog } from "@/features/admin/tryouts/components/tryout-question-picker-dialog"

import type { PracticeQuestionLookupOption } from "../queries"

type PracticeQuestionPickerDialogProps = {
  open: boolean
  questions: PracticeQuestionLookupOption[]
  practiceTitle: string
  onOpenChange: (open: boolean) => void
  onAddQuestions: (questions: PracticeQuestionLookupOption[]) => void
}

export function PracticeQuestionPickerDialog({
  open,
  questions,
  practiceTitle,
  onOpenChange,
  onAddQuestions,
}: PracticeQuestionPickerDialogProps) {
  return (
    <TryoutQuestionPickerDialog
      open={open}
      questions={questions}
      sectionTitle={practiceTitle}
      onOpenChange={onOpenChange}
      onAddQuestions={(selectedQuestions) =>
        onAddQuestions(selectedQuestions as PracticeQuestionLookupOption[])
      }
    />
  )
}
