"use client"

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { FileTextIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

import { getOptionFeedbackClass, isCorrectOptionForQuestion, type QuestionFeedbackMode } from "../utils"
import type { QuestionAnswerLike, QuestionRoomLike } from "../types"

type QuestionOptionFieldProps = {
  question: QuestionRoomLike
  answer: QuestionAnswerLike
  feedbackMode?: QuestionFeedbackMode
  readOnly?: boolean
  isPending?: boolean
  readingMode?: "default" | "comfortable"
  onChoiceChange?: (selectedOptionKeys: string[]) => void
  onTextChange?: (answerText: string) => void
  onTextBlur?: () => void
  keyboardHint?: string
}

const optionDisplayLabels = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"] as const

function getOptionDisplayLabel(index: number, fallbackLabel: string) {
  return optionDisplayLabels[index] ?? fallbackLabel
}

function QuestionOptionFieldBase({
  question,
  answer,
  feedbackMode = "none",
  readOnly = false,
  isPending = false,
  readingMode = "default",
  onChoiceChange,
  onTextChange,
  onTextBlur,
  keyboardHint = "Gunakan tombol atas/bawah untuk pindah opsi, Enter untuk memilih, Esc untuk menghapus sorotan.",
}: QuestionOptionFieldProps) {
  const isComfortable = readingMode === "comfortable"
  const compact = !isComfortable
  const isLocked = readOnly || (feedbackMode !== "none" && Boolean(answer.gradedAt))
  const isInteractive = !readOnly && !isPending && !isLocked
  const [highlightedOption, setHighlightedOption] = useState<{
    questionId: number
    optionKey: string | null
  } | null>(null)
  const optionKeys = useMemo(() => question.options.map((option) => option.label), [question.options])
  const selectedOptionKeysRef = useRef(answer.selectedOptionKeys)
  const onChoiceChangeRef = useRef(onChoiceChange)
  const questionTypeRef = useRef(question.question.type)
  const highlightedOptionKey =
    highlightedOption?.questionId === question.id ? highlightedOption.optionKey : null
  const highlightedOptionKeyRef = useRef<string | null>(highlightedOptionKey)

  useEffect(() => {
    selectedOptionKeysRef.current = answer.selectedOptionKeys
  }, [answer.selectedOptionKeys])

  useEffect(() => {
    onChoiceChangeRef.current = onChoiceChange
  }, [onChoiceChange])

  useEffect(() => {
    questionTypeRef.current = question.question.type
  }, [question.question.type])

  useEffect(() => {
    highlightedOptionKeyRef.current = highlightedOptionKey
  }, [highlightedOptionKey])

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
    const choiceChange = onChoiceChangeRef.current
    const selectedOptionKeys = selectedOptionKeysRef.current
    const questionType = questionTypeRef.current
    const currentHighlightedOptionKey = highlightedOptionKeyRef.current

    if (!isInteractive || !currentHighlightedOptionKey || !choiceChange) {
      return
    }

    if (questionType === "multiple_answer") {
      const nextKeys = selectedOptionKeys.includes(currentHighlightedOptionKey)
        ? selectedOptionKeys.filter((key) => key !== currentHighlightedOptionKey)
        : [...selectedOptionKeys, currentHighlightedOptionKey]

      choiceChange(nextKeys)
      return
    }

    choiceChange([currentHighlightedOptionKey])
  }, [isInteractive])

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
          <span className={cn("font-semibold", isComfortable ? "text-base" : "text-sm")}>Jawaban</span>
          <div
            className={cn(
              "rounded-lg border bg-muted/20 text-foreground",
              isComfortable ? "px-4 py-3 text-base leading-7" : "px-3 py-2 text-sm leading-6",
            )}
          >
            {answer.answerText.trim() || "Kosong"}
          </div>
        </div>
      )
    }

    return (
      <div className="flex flex-col gap-2">
        <label
          className={cn("font-semibold", isComfortable ? "text-base" : "text-sm")}
          htmlFor={`answer-${question.id}`}
        >
          Jawaban
        </label>
        <Input
          id={`answer-${question.id}`}
          value={answer.answerText}
          placeholder="Tulis jawaban singkat kamu di sini."
          className={cn(
            "h-12 bg-background px-4",
            isComfortable ? "text-[1.05rem]" : "text-base",
          )}
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
      className={cn("flex flex-col", compact ? "gap-2" : "gap-3")}
      aria-describedby={!readOnly && !isLocked ? `answer-keyboard-help-${question.id}` : undefined}
    >
      <div className={cn("grid", compact ? "gap-1.5" : "gap-2")}>
        {question.options.map((option, index) => {
          const displayLabel = getOptionDisplayLabel(index, option.label)
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
                  "flex min-h-11 items-center rounded-lg border bg-background transition-colors",
                  compact ? "gap-2 px-2.5 py-1.5 text-sm" : "gap-3 px-3.5 py-2 text-[1.04rem]",
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
                <Badge
                  variant="outline"
                  className={cn(
                    "grid shrink-0 aspect-square place-items-center rounded-full px-0 font-semibold tabular-nums leading-none",
                    compact ? "size-7 text-[11px]" : "size-8 text-sm",
                  )}
                >
                  {displayLabel}
                </Badge>
                <Checkbox
                  id={`option-${question.id}-${option.label}`}
                  checked={selected}
                  disabled={!isInteractive}
                  aria-label={`Pilih opsi ${displayLabel}`}
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
                    "min-w-0 flex-1",
                    compact ? "leading-6" : "leading-7",
                    isInteractive ? "cursor-pointer" : "cursor-default",
                  )}
                >
                  <span
                    className={cn("block", compact ? "[&_p]:mb-1.5" : "[&_p]:mb-2")}
                    dangerouslySetInnerHTML={{ __html: option.content }}
                  />
                  {option.imageUrl ? (
                    <span className={cn("mt-2 block overflow-hidden rounded-md border bg-card", compact && "mt-1.5")}>
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
                "group flex min-h-11 items-center rounded-lg border bg-background text-left transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-100",
                compact ? "gap-2 px-2.5 py-1.5 text-sm" : "gap-3 px-3.5 py-2 text-[1.04rem]",
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
              <Badge
                variant="outline"
                className={cn(
                  "grid shrink-0 aspect-square place-items-center rounded-full px-0 font-semibold tabular-nums leading-none",
                  compact ? "size-7 text-[11px]" : "size-8 text-sm",
                )}
              >
                {displayLabel}
              </Badge>
              <span className={cn("min-w-0 flex-1", compact ? "leading-6" : "leading-7")}>
                <span
                  className={cn("block", compact ? "[&_p]:mb-1.5" : "[&_p]:mb-2")}
                  dangerouslySetInnerHTML={{ __html: option.content }}
                />
                {option.imageUrl ? (
                  <span className={cn("mt-2 block overflow-hidden rounded-md border bg-card", compact && "mt-1.5")}>
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
          className={cn("text-center text-muted-foreground", isComfortable ? "text-sm" : "text-xs")}
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

function areQuestionOptionFieldPropsEqual(
  previousProps: QuestionOptionFieldProps,
  nextProps: QuestionOptionFieldProps,
) {
  return (
    previousProps.question === nextProps.question &&
    previousProps.answer === nextProps.answer &&
    previousProps.feedbackMode === nextProps.feedbackMode &&
    previousProps.readOnly === nextProps.readOnly &&
    previousProps.isPending === nextProps.isPending &&
    previousProps.readingMode === nextProps.readingMode &&
    previousProps.keyboardHint === nextProps.keyboardHint
  )
}

export const QuestionOptionField = memo(QuestionOptionFieldBase, areQuestionOptionFieldPropsEqual)
