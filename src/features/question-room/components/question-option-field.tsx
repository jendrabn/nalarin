"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"
import { CircleIcon, FileTextIcon } from "lucide-react"

import { Checkbox } from "@/components/ui/checkbox"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

import { getOptionFeedbackClass, isCorrectOptionForQuestion, type QuestionFeedbackMode } from "../utils"
import type { QuestionAnswerLike, QuestionRoomLike } from "../types"

export function QuestionOptionField({
  question,
  answer,
  feedbackMode = "none",
  readOnly = false,
  isPending = false,
  onChoiceChange,
  onTextChange,
  onTextBlur,
  keyboardHint = "Gunakan tombol ↑↓ untuk pindah opsi, Enter untuk memilih, Esc untuk menghapus sorotan.",
}: {
  question: QuestionRoomLike
  answer: QuestionAnswerLike
  feedbackMode?: QuestionFeedbackMode
  readOnly?: boolean
  isPending?: boolean
  onChoiceChange?: (selectedOptionKeys: string[]) => void
  onTextChange?: (answerText: string) => void
  onTextBlur?: () => void
  keyboardHint?: string
}) {
  const isLocked = readOnly || (feedbackMode !== "none" && Boolean(answer.gradedAt))
  const isInteractive = !readOnly && !isPending && !isLocked
  const [highlightedOption, setHighlightedOption] = useState<{
    questionId: number
    optionKey: string | null
  } | null>(null)
  const optionKeys = useMemo(() => question.options.map((option) => option.label), [question.options])
  const highlightedOptionKey =
    highlightedOption?.questionId === question.id ? highlightedOption.optionKey : null

  const moveHighlight = useCallback(
    (direction: 1 | -1) => {
      if (!isInteractive || optionKeys.length === 0) {
        return
      }

      setHighlightedOption((current) => {
        const currentKey = current?.questionId === question.id ? current.optionKey : null
        const currentIndex = currentKey ? optionKeys.indexOf(currentKey) : -1
        const fallbackIndex = direction === 1 ? 0 : optionKeys.length - 1
        const nextIndex =
          currentIndex === -1
            ? fallbackIndex
            : (currentIndex + direction + optionKeys.length) % optionKeys.length

        return {
          questionId: question.id,
          optionKey: optionKeys[nextIndex] ?? null,
        }
      })
    },
    [isInteractive, optionKeys, question.id],
  )

  const selectHighlightedOption = useCallback(() => {
    if (!isInteractive || !highlightedOptionKey || !onChoiceChange) {
      return
    }

    if (question.question.type === "multiple_answer") {
      const nextKeys = answer.selectedOptionKeys.includes(highlightedOptionKey)
        ? answer.selectedOptionKeys.filter((key) => key !== highlightedOptionKey)
        : [...answer.selectedOptionKeys, highlightedOptionKey]

      onChoiceChange(nextKeys)
      return
    }

    onChoiceChange([highlightedOptionKey])
  }, [answer.selectedOptionKeys, highlightedOptionKey, isInteractive, onChoiceChange, question.question.type])

  useEffect(() => {
    if (!isInteractive || optionKeys.length === 0) {
      return
    }

    function handleKeyboardShortcut(event: KeyboardEvent) {
      if (isShortcutIgnoredTarget(event.target)) {
        return
      }

      if (event.key === "ArrowDown") {
        event.preventDefault()
        moveHighlight(1)
        return
      }

      if (event.key === "ArrowUp") {
        event.preventDefault()
        moveHighlight(-1)
        return
      }

      if (event.key === "Enter") {
        event.preventDefault()
        selectHighlightedOption()
        return
      }

      if (event.key === "Escape") {
        event.preventDefault()
        setHighlightedOption(null)
      }
    }

    window.addEventListener("keydown", handleKeyboardShortcut)

    return () => {
      window.removeEventListener("keydown", handleKeyboardShortcut)
    }
  }, [isInteractive, moveHighlight, optionKeys.length, selectHighlightedOption])

  if (question.question.type === "short_answer") {
    if (readOnly) {
      return (
        <div className="flex flex-col gap-2">
          <span className="text-base font-semibold">Jawaban</span>
          <div className="rounded-lg border bg-muted/20 px-4 py-3 text-base leading-7 text-foreground">
            {answer.answerText.trim() || "Kosong"}
          </div>
        </div>
      )
    }

    return (
      <div className="flex flex-col gap-2">
        <label className="text-base font-semibold" htmlFor={`answer-${question.id}`}>
          Jawaban
        </label>
        <Input
          id={`answer-${question.id}`}
          value={answer.answerText}
          placeholder="Tulis jawaban singkat kamu di sini."
          className="h-12 bg-background px-4 text-base"
          disabled={isPending || isLocked}
          readOnly={isLocked}
          onChange={(event) => onTextChange?.(event.target.value)}
          onBlur={() => onTextBlur?.()}
        />
      </div>
    )
  }

  if (question.options.length === 0) {
    return (
      <Empty className="border bg-muted/30 py-8">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileTextIcon />
          </EmptyMedia>
          <EmptyTitle>Opsi belum tersedia</EmptyTitle>
          <EmptyDescription>Soal ini belum memiliki opsi jawaban.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div
      className="flex flex-col gap-3"
      aria-describedby={!readOnly && !isLocked ? `answer-keyboard-help-${question.id}` : undefined}
    >
      <div className="grid gap-2">
        {question.options.map((option) => {
          const selected = answer.selectedOptionKeys.includes(option.label)
          const highlighted = highlightedOptionKey === option.label
          const isMultipleAnswer = question.question.type === "multiple_answer"
          const feedbackClass = getOptionFeedbackClass({
            feedbackMode,
            locked: isLocked,
            selected,
            isCorrectOption: isCorrectOptionForQuestion(question, option.label, option.content),
            isAnswerCorrect: answer.isCorrect,
          })

          if (isMultipleAnswer) {
            return (
              <div
                key={`${question.id}-${option.label}`}
                className={cn(
                  "flex min-h-12 items-center gap-3 rounded-lg border bg-background p-3 text-base transition-colors",
                  isInteractive ? "hover:border-primary/35 hover:bg-muted/45" : "opacity-100",
                  feedbackClass ?? (selected && "border-primary bg-primary/10"),
                  highlighted && isInteractive && "ring-3 ring-ring/35",
                )}
                onMouseEnter={() => {
                  if (isInteractive) {
                    setHighlightedOption({ questionId: question.id, optionKey: option.label })
                  }
                }}
              >
                <Checkbox
                  id={`option-${question.id}-${option.label}`}
                  checked={selected}
                  disabled={!isInteractive}
                  aria-label={`Pilih opsi ${option.label}`}
                  onFocus={() => {
                    if (isInteractive) {
                      setHighlightedOption({ questionId: question.id, optionKey: option.label })
                    }
                  }}
                  onCheckedChange={(checked) => {
                    if (!onChoiceChange || !isInteractive) {
                      return
                    }

                    setHighlightedOption({ questionId: question.id, optionKey: option.label })
                    const nextKeys =
                      checked === true
                        ? [...answer.selectedOptionKeys, option.label]
                        : answer.selectedOptionKeys.filter((key) => key !== option.label)

                    onChoiceChange(nextKeys)
                  }}
                />
                <label
                  htmlFor={`option-${question.id}-${option.label}`}
                  className={cn(
                    "min-w-0 flex-1 leading-7",
                    isInteractive ? "cursor-pointer" : "cursor-default",
                  )}
                >
                  <span className="block [&_p]:mb-2" dangerouslySetInnerHTML={{ __html: option.content }} />
                  {option.imageUrl ? (
                    <span className="mt-2 block overflow-hidden rounded-md border bg-card">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={option.imageUrl} alt="" className="max-h-56 w-full object-contain" />
                    </span>
                  ) : null}
                </label>
              </div>
            )
          }

          return (
            <button
              key={`${question.id}-${option.label}`}
              type="button"
              disabled={!isInteractive}
              onClick={() => {
                if (!onChoiceChange || !isInteractive) {
                  return
                }

                setHighlightedOption({ questionId: question.id, optionKey: option.label })
                onChoiceChange([option.label])
              }}
              className={cn(
                "group flex min-h-12 items-center gap-3 rounded-lg border bg-background p-3 text-left text-base transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-100",
                feedbackClass ??
                  (selected ? "border-primary bg-primary/10" : isInteractive ? "hover:border-primary/35 hover:bg-muted/45" : undefined),
                highlighted && isInteractive && "ring-3 ring-ring/35",
              )}
              onFocus={() => {
                if (isInteractive) {
                  setHighlightedOption({ questionId: question.id, optionKey: option.label })
                }
              }}
              onMouseEnter={() => {
                if (isInteractive) {
                  setHighlightedOption({ questionId: question.id, optionKey: option.label })
                }
              }}
            >
              <span
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-full border text-xs font-semibold",
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground group-hover:border-primary/45",
                )}
              >
                {option.label || <CircleIcon />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block leading-7 [&_p]:mb-2" dangerouslySetInnerHTML={{ __html: option.content }} />
                {option.imageUrl ? (
                  <span className="mt-2 block overflow-hidden rounded-md border bg-card">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={option.imageUrl} alt="" className="max-h-56 w-full object-contain" />
                  </span>
                ) : null}
              </span>
            </button>
          )
        })}
      </div>

      {!readOnly && !isLocked ? (
        <p
          id={`answer-keyboard-help-${question.id}`}
          className="text-center text-xs text-muted-foreground"
        >
          {keyboardHint}
        </p>
      ) : null}
    </div>
  )
}

function isShortcutIgnoredTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  if (target.closest('[role="dialog"], [role="alertdialog"]')) {
    return true
  }

  const tagName = target.tagName.toLowerCase()

  return (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select" ||
    target.isContentEditable
  )
}
