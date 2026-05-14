"use client"

import { useEffect, useId, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm, useWatch, type FieldErrors, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  GripVerticalIcon,
  PlusIcon,
  RotateCcwIcon,
  RocketIcon,
  SaveIcon,
  Trash2Icon,
} from "lucide-react"
import { toast } from "sonner"

import { AdminFormPage } from "@/components/admin-form-page"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { getModelEnumBadgeMeta } from "@/lib/model-enums"
import { cn } from "@/lib/utils"

import { createPracticeAction, publishPracticeAction, updatePracticeAction } from "../actions"
import type {
  PracticeDetails,
  PracticeQuestionLookupOption,
  PracticeLookupOption,
  PracticeSubjectLookupOption,
  PracticeTopicLookupOption,
} from "../queries"
import { practiceFormSchema, type PracticeFormValues } from "../schemas"
import { previewText } from "../utils/practice"
import { PracticeQuestionPickerDialog } from "./practice-question-picker-dialog"

const STEPS = ["details", "settings", "questions", "review"] as const
type WizardStep = (typeof STEPS)[number]
type SubmitIntent = "draft" | "publish"
type DraggedQuestion = {
  questionIndex: number
}

type PracticeFormPageProps = {
  mode: "create" | "edit"
  practiceId?: number
  title: string
  description: string
  backHref: string
  lookups: {
    examTypes: PracticeLookupOption[]
    subjects: PracticeSubjectLookupOption[]
    topics: PracticeTopicLookupOption[]
    questions: PracticeQuestionLookupOption[]
  }
  initialValues?: PracticeDetails | null
}

function getDefaultValues(initialValues?: PracticeDetails | null): PracticeFormValues {
  return {
    examTypeId: initialValues?.examTypeId ? String(initialValues.examTypeId) : "",
    subjectId: initialValues?.subjectId ? String(initialValues.subjectId) : "",
    topicId: initialValues?.topicId ? String(initialValues.topicId) : "",
    title: initialValues?.title ?? "",
    description: initialValues?.description ?? "",
    isFree: initialValues?.isFree ?? true,
    hasPracticeMode: initialValues?.hasPracticeMode ?? true,
    hasQuizMode: initialValues?.hasQuizMode ?? false,
    quizDurationMinutes: initialValues?.quizDurationMinutes
      ? String(initialValues.quizDurationMinutes)
      : "",
    shuffleQuestions: initialValues?.shuffleQuestions ?? false,
    shuffleOptions: initialValues?.shuffleOptions ?? false,
    allowReviewBeforeSubmit: initialValues?.allowReviewBeforeSubmit ?? true,
    showResultAfterSubmit: initialValues?.showResultAfterSubmit ?? true,
    showExplanationAfterSubmit: initialValues?.showExplanationAfterSubmit ?? true,
    navigationMode: initialValues?.navigationMode ?? "free",
    questions:
      initialValues?.questions.map((question) => ({
        id: String(question.id),
        questionId: String(question.questionId),
        orderIndex: String(question.orderIndex),
        points: String(question.points ?? question.basePoints),
      })) ?? [],
  }
}

function FieldSwitch({
  id,
  label,
  description,
  checked,
  disabled,
  onCheckedChange,
}: {
  id: string
  label: string
  description: string
  checked: boolean
  disabled?: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <Field orientation="responsive">
      <FieldContent>
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        <FieldDescription>{description}</FieldDescription>
      </FieldContent>
      <Switch
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
      />
    </Field>
  )
}

function getStepIndex(step: WizardStep) {
  return STEPS.indexOf(step)
}

function nextStep(step: WizardStep) {
  return STEPS[Math.min(getStepIndex(step) + 1, STEPS.length - 1)]
}

function previousStep(step: WizardStep) {
  return STEPS[Math.max(getStepIndex(step) - 1, 0)]
}

function getStepForErrors(errors: FieldErrors<PracticeFormValues>): WizardStep {
  if (errors.examTypeId || errors.subjectId || errors.topicId || errors.title || errors.description) {
    return "details"
  }

  if (
    errors.hasPracticeMode ||
    errors.hasQuizMode ||
    errors.quizDurationMinutes
  ) {
    return "settings"
  }

  return "questions"
}

function formatReviewText(value: string | null | undefined, fallback = "-") {
  const trimmed = value?.trim()
  return trimmed ? trimmed : fallback
}

function getEnabledLabel(value: boolean | null | undefined) {
  return value ? "Enabled" : "Disabled"
}

export function PracticeFormPage({
  mode,
  practiceId,
  title,
  description,
  backHref,
  lookups,
  initialValues,
}: PracticeFormPageProps) {
  const router = useRouter()
  const formId = useId()
  const [step, setStep] = useState<WizardStep>("details")
  const [massPoints, setMassPoints] = useState("")
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [draggedQuestion, setDraggedQuestion] = useState<DraggedQuestion | null>(null)
  const [submitIntent, setSubmitIntent] = useState<SubmitIntent | null>(null)
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false)
  const isLocked = Boolean(initialValues && initialValues.status !== "draft")
  const defaultValues = useMemo(() => getDefaultValues(initialValues), [initialValues])

  const form = useForm<PracticeFormValues>({
    resolver: zodResolver(practiceFormSchema) as Resolver<PracticeFormValues>,
    defaultValues,
  })

  useEffect(() => {
    form.reset(defaultValues)
  }, [defaultValues, form])

  const watchedValues = useWatch({ control: form.control }) as PracticeFormValues
  const watchedExamTypeId = watchedValues.examTypeId ?? ""
  const watchedSubjectId = watchedValues.subjectId ?? ""
  const watchedQuestions = watchedValues.questions
  const questions = useMemo(() => watchedQuestions ?? [], [watchedQuestions])
  const rootError = form.formState.errors.root?.message
  const selectedExamTypeId = Number(watchedExamTypeId || 0)
  const selectedSubjectId = Number(watchedSubjectId || 0)
  const selectedExamType = lookups.examTypes.find((examType) => examType.id === selectedExamTypeId)
  const selectedSubject = lookups.subjects.find((subject) => subject.id === selectedSubjectId)
  const selectedTopic = lookups.topics.find((topic) => String(topic.id) === watchedValues.topicId)
  const filteredSubjects = lookups.subjects.filter(
    (subject) => subject.examTypeId === selectedExamTypeId,
  )
  const filteredTopics = lookups.topics.filter((topic) => topic.subjectId === selectedSubjectId)
  const pickerQuestions = useMemo(() => {
    const selectedQuestionIds = new Set(questions.map((question) => question.questionId))

    return lookups.questions.filter(
      (question) =>
        question.status === "published" &&
        question.examTypeId === selectedExamTypeId &&
        question.subjectId === selectedSubjectId &&
        !selectedQuestionIds.has(String(question.id)),
    )
  }, [lookups.questions, questions, selectedExamTypeId, selectedSubjectId])

  function setQuestions(nextQuestions: PracticeFormValues["questions"]) {
    form.setValue("questions", nextQuestions, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  function addQuestionsFromPicker(selectedQuestions: PracticeQuestionLookupOption[]) {
    setQuestions([
      ...questions,
      ...selectedQuestions.map((question, index) => ({
        id: "",
        questionId: String(question.id),
        orderIndex: String(questions.length + index + 1),
        points: String(question.points),
      })),
    ])
    setIsPickerOpen(false)
    toast.success(`${selectedQuestions.length} question(s) added.`)
  }

  function removeQuestion(questionIndex: number) {
    setQuestions(
      questions
        .filter((_, index) => index !== questionIndex)
        .map((question, index) => ({
          ...question,
          orderIndex: String(index + 1),
        })),
    )
  }

  function reorderQuestion(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) {
      return
    }

    const nextQuestions = [...questions]
    const [movedQuestion] = nextQuestions.splice(fromIndex, 1)

    if (!movedQuestion) {
      return
    }

    nextQuestions.splice(toIndex, 0, movedQuestion)
    setQuestions(
      nextQuestions.map((question, index) => ({
        ...question,
        orderIndex: String(index + 1),
      })),
    )
  }

  function applyMassPoints() {
    const value = massPoints.trim()
    const points = Number(value)

    if (!value || !Number.isFinite(points) || points <= 0) {
      toast.error("Enter a point value greater than 0.")
      return
    }

    if (questions.length === 0) {
      toast.error("Add questions before overriding points.")
      return
    }

    setQuestions(
      questions.map((question) => ({
        ...question,
        points: value,
      })),
    )
    toast.success("Points overridden for all selected questions.")
  }

  function applyActionError(result: {
    message?: string
    fieldErrors?: Partial<Record<keyof PracticeFormValues, string[]>>
  }) {
    if (result.fieldErrors) {
      const fieldNames = Object.keys(result.fieldErrors) as Array<keyof PracticeFormValues>

      fieldNames.forEach((fieldName) => {
        const message = result.fieldErrors?.[fieldName]?.[0]

        if (message) {
          form.setError(fieldName, {
            type: "server",
            message,
          })
        }
      })
    }

    if (result.message) {
      form.setError("root", {
        type: "server",
        message: result.message,
      })
      toast.error(result.message)
    }
  }

  async function saveDraft(values: PracticeFormValues) {
    if (isLocked) {
      toast.error("Published or archived practices cannot be edited.")
      return null
    }

    const result =
      mode === "create"
        ? await createPracticeAction(values)
        : await updatePracticeAction(practiceId ?? 0, values)

    if (!result.success) {
      applyActionError(result)
      return null
    }

    return result.data
  }

  function handleInvalidSubmit(errors: FieldErrors<PracticeFormValues>) {
    setStep(getStepForErrors(errors))
    toast.error("Complete the required fields before saving.")
  }

  const handleDraftSubmit = form.handleSubmit(
    async (values) => {
      setSubmitIntent("draft")

      try {
        const draft = await saveDraft(values)

        if (!draft) {
          return
        }

        toast.success("Practice draft saved.")

        if (mode === "create") {
          router.replace(`/admin/practices/${draft.id}/edit`)
          return
        }

        router.refresh()
      } finally {
        setSubmitIntent(null)
      }
    },
    handleInvalidSubmit,
  )

  const handlePublishSubmit = form.handleSubmit(
    async (values) => {
      setSubmitIntent("publish")

      try {
        const draft = await saveDraft(values)

        if (!draft) {
          return
        }

        const result = await publishPracticeAction(draft.id)

        if (!result.success) {
          form.setError("root", {
            type: "server",
            message: result.message,
          })
          toast.error(result.message)
          return
        }

        toast.success("Practice published.")
        setIsPublishDialogOpen(false)
        router.replace(`/admin/practices/${draft.id}`)
      } finally {
        setSubmitIntent(null)
      }
    },
    handleInvalidSubmit,
  )

  return (
    <AdminFormPage
      title={title}
      subtitle={description}
      backHref={backHref}
      backLabel="Back to Practices"
      footer={
        <div className="flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={step === "details"}
            onClick={() => setStep(previousStep(step))}
          >
            <ArrowLeftIcon data-icon="inline-start" />
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={step === "review"}
            onClick={() => setStep(nextStep(step))}
          >
            Next
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
        </div>
      }
    >
      {isLocked ? (
        <Card>
          <CardHeader>
            <CardTitle>Practice is locked</CardTitle>
            <CardDescription>
              Published and archived practices are immutable. Archive it and create a new practice for major revisions.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <form id={formId} onSubmit={(event) => event.preventDefault()}>
        <Tabs value={step} onValueChange={(value) => setStep(value as WizardStep)}>
          <TabsList className="mb-4 flex w-full flex-wrap justify-start">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="questions">Questions</TabsTrigger>
            <TabsTrigger value="review">Review</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>Practice Details</CardTitle>
                <CardDescription>Define bank-soal filtering metadata and access.</CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  {rootError ? (
                    <p className="text-sm text-destructive" aria-live="polite">
                      {rootError}
                    </p>
                  ) : null}

                  <div className="grid gap-4 md:grid-cols-2">
                    <Field data-invalid={Boolean(form.formState.errors.examTypeId)}>
                      <FieldContent>
                        <FieldLabel htmlFor={`${formId}-exam-type`} className="required">
                          Exam Type
                        </FieldLabel>
                      </FieldContent>
                      <Select
                        value={watchedExamTypeId || ""}
                        disabled={isLocked}
                        onValueChange={(value) => {
                          form.setValue("examTypeId", value, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                          form.setValue("subjectId", "", {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                          form.setValue("topicId", "", {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                          form.setValue("questions", [], {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }}
                      >
                        <SelectTrigger id={`${formId}-exam-type`}>
                          <SelectValue placeholder="Select exam type" />
                        </SelectTrigger>
                        <SelectContent>
                          {lookups.examTypes.map((examType) => (
                            <SelectItem key={examType.id} value={String(examType.id)}>
                              {examType.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError>{form.formState.errors.examTypeId?.message}</FieldError>
                    </Field>

                    <Field data-invalid={Boolean(form.formState.errors.subjectId)}>
                      <FieldContent>
                        <FieldLabel htmlFor={`${formId}-subject`} className="required">
                          Subject
                        </FieldLabel>
                      </FieldContent>
                      <Select
                        value={watchedSubjectId || ""}
                        disabled={isLocked || !selectedExamTypeId}
                        onValueChange={(value) => {
                          form.setValue("subjectId", value, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                          form.setValue("topicId", "", {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                          form.setValue("questions", [], {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }}
                      >
                        <SelectTrigger id={`${formId}-subject`}>
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredSubjects.map((subject) => (
                            <SelectItem key={subject.id} value={String(subject.id)}>
                              {subject.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError>{form.formState.errors.subjectId?.message}</FieldError>
                    </Field>
                  </div>

                  <Field>
                    <FieldContent>
                      <FieldLabel htmlFor={`${formId}-topic`}>Topic</FieldLabel>
                      <FieldDescription>Optional metadata for bank-soal filtering.</FieldDescription>
                    </FieldContent>
                    <Select
                      value={watchedValues.topicId || "none"}
                      disabled={isLocked || !selectedSubjectId}
                      onValueChange={(value) =>
                        form.setValue("topicId", value === "none" ? "" : value, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                    >
                      <SelectTrigger id={`${formId}-topic`}>
                        <SelectValue placeholder="Select topic" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No topic</SelectItem>
                        {filteredTopics.map((topic) => (
                          <SelectItem key={topic.id} value={String(topic.id)}>
                            {topic.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field data-invalid={Boolean(form.formState.errors.title)}>
                    <FieldContent>
                      <FieldLabel htmlFor={`${formId}-title`} className="required">
                        Title
                      </FieldLabel>
                    </FieldContent>
                    <Input
                      id={`${formId}-title`}
                      placeholder="Latihan TPS Penalaran Umum"
                      disabled={isLocked}
                      aria-invalid={Boolean(form.formState.errors.title)}
                      {...form.register("title")}
                    />
                    <FieldError>{form.formState.errors.title?.message}</FieldError>
                  </Field>

                  <Field>
                    <FieldContent>
                      <FieldLabel htmlFor={`${formId}-description`}>Description</FieldLabel>
                    </FieldContent>
                    <Textarea
                      id={`${formId}-description`}
                      rows={4}
                      disabled={isLocked}
                      {...form.register("description")}
                    />
                  </Field>

                  <FieldSwitch
                    id={`${formId}-free`}
                    label="Free Access"
                    description="When disabled, only paid plans can access this practice."
                    checked={Boolean(watchedValues.isFree)}
                    disabled={isLocked}
                    onCheckedChange={(checked) =>
                      form.setValue("isFree", checked, { shouldDirty: true })
                    }
                  />
                </FieldGroup>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <div className="flex flex-col gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Modes</CardTitle>
                  <CardDescription>Enable practice mode, quiz mode, or both.</CardDescription>
                </CardHeader>
                <CardContent>
                  <FieldGroup>
                    <div className="grid gap-4 md:grid-cols-2">
                      <FieldSwitch
                        id={`${formId}-practice-mode`}
                        label="Practice Mode"
                        description="No timer and suitable for learning."
                        checked={Boolean(watchedValues.hasPracticeMode)}
                        disabled={isLocked}
                        onCheckedChange={(checked) =>
                          form.setValue("hasPracticeMode", checked, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                      />
                      <FieldSwitch
                        id={`${formId}-quiz-mode`}
                        label="Quiz Mode"
                        description="Timed session with result after submit."
                        checked={Boolean(watchedValues.hasQuizMode)}
                        disabled={isLocked}
                        onCheckedChange={(checked) =>
                          form.setValue("hasQuizMode", checked, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                      />
                    </div>

                    <Field data-invalid={Boolean(form.formState.errors.quizDurationMinutes)}>
                      <FieldContent>
                        <FieldLabel htmlFor={`${formId}-quiz-duration`}>
                          Quiz Duration Minutes
                        </FieldLabel>
                      </FieldContent>
                      <Input
                        id={`${formId}-quiz-duration`}
                        inputMode="numeric"
                        placeholder="30"
                        disabled={isLocked || !watchedValues.hasQuizMode}
                        aria-invalid={Boolean(form.formState.errors.quizDurationMinutes)}
                        {...form.register("quizDurationMinutes")}
                      />
                      <FieldError>{form.formState.errors.quizDurationMinutes?.message}</FieldError>
                    </Field>
                  </FieldGroup>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Behavior</CardTitle>
                  <CardDescription>
                    Mode Latihan selalu berurutan dengan feedback instan. Mode Quiz selalu bertimer,
                    navigasi bebas, dan menampilkan pembahasan setelah submit.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="questions">
            <Card>
              <CardHeader>
                <CardTitle>Objective Questions</CardTitle>
                <CardDescription>
                  Only multiple choice, multiple answer, and true/false questions are available.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FieldSet>
                  <FieldLegend>Questions</FieldLegend>
                  <div className="flex flex-col gap-3 rounded-lg border border-border/60 p-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{questions.length} questions</Badge>
                        <span className="text-sm text-muted-foreground">
                          Available: {pickerQuestions.length}
                        </span>
                      </div>
                      {!isLocked ? (
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Input
                            inputMode="decimal"
                            placeholder="Mass points"
                            value={massPoints}
                            onChange={(event) => setMassPoints(event.target.value)}
                            className="sm:w-32"
                            aria-label="Mass override points"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={applyMassPoints}
                          >
                            <RotateCcwIcon data-icon="inline-start" />
                            Override
                          </Button>
                          <Button
                            type="button"
                            disabled={!selectedSubjectId}
                            onClick={() => setIsPickerOpen(true)}
                          >
                            <PlusIcon data-icon="inline-start" />
                            Add Question
                          </Button>
                        </div>
                      ) : null}
                    </div>

                    {questions.length > 0 ? (
                      <div className="overflow-hidden rounded-2xl border border-border/60">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10">
                            <span className="sr-only">Order</span>
                          </TableHead>
                          <TableHead className="min-w-[22rem]">
                            Question
                          </TableHead>
                          <TableHead>
                            Topic
                          </TableHead>
                          <TableHead>
                            Type
                          </TableHead>
                          <TableHead>
                            Difficulty
                          </TableHead>
                          <TableHead className="w-28">
                            Point
                          </TableHead>
                          <TableHead>
                            Year
                          </TableHead>
                          {!isLocked ? (
                            <TableHead className="w-12 text-right">
                              <span className="sr-only">Actions</span>
                            </TableHead>
                          ) : null}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {questions.map((question, questionIndex) => {
                          const selectedQuestion = lookups.questions.find(
                            (item) => String(item.id) === question.questionId,
                          )
                          const questionBadge = selectedQuestion
                            ? getModelEnumBadgeMeta("questionType", selectedQuestion.type)
                            : null
                          const difficultyBadge = selectedQuestion
                            ? getModelEnumBadgeMeta("questionDifficulty", selectedQuestion.difficulty)
                            : null
                          const isDragging = draggedQuestion?.questionIndex === questionIndex

                          return (
                            <TableRow
                              key={`${question.id || "new"}-${question.questionId}-${questionIndex}`}
                              data-state={isDragging ? "selected" : undefined}
                              className={cn(isDragging && "opacity-60")}
                              onDragOver={(event) => {
                                if (!isLocked && draggedQuestion) {
                                  event.preventDefault()
                                  event.dataTransfer.dropEffect = "move"
                                }
                              }}
                              onDrop={(event) => {
                                event.preventDefault()

                                if (!isLocked && draggedQuestion) {
                                  reorderQuestion(draggedQuestion.questionIndex, questionIndex)
                                }

                                setDraggedQuestion(null)
                              }}
                            >
                              <TableCell>
                                <input
                                  type="hidden"
                                  {...form.register(`questions.${questionIndex}.questionId` as const)}
                                />
                                <input
                                  type="hidden"
                                  {...form.register(`questions.${questionIndex}.orderIndex` as const)}
                                />
                                {!isLocked ? (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    className="cursor-grab active:cursor-grabbing"
                                    draggable
                                    onDragStart={(event) => {
                                      event.dataTransfer.effectAllowed = "move"
                                      event.dataTransfer.setData("text/plain", `${questionIndex}`)
                                      setDraggedQuestion({ questionIndex })
                                    }}
                                    onDragEnd={() => setDraggedQuestion(null)}
                                    aria-label={`Reorder question ${questionIndex + 1}`}
                                  >
                                    <GripVerticalIcon />
                                  </Button>
                                ) : (
                                  <span className="text-sm text-muted-foreground tabular-nums">
                                    {questionIndex + 1}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="whitespace-normal">
                                <div className="flex min-w-[22rem] max-w-[36rem] flex-col gap-1">
                                  <div className="font-medium">
                                    {selectedQuestion
                                      ? previewText(selectedQuestion.title, `Question ${selectedQuestion.id}`)
                                      : `Question ${question.questionId || "-"}`}
                                  </div>
                                  <p className="line-clamp-2 text-sm text-muted-foreground">
                                    {selectedQuestion
                                      ? previewText(selectedQuestion.content)
                                      : "This question is no longer available in the lookup."}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="whitespace-normal">
                                <span className="text-sm">{selectedQuestion?.topicName ?? "-"}</span>
                              </TableCell>
                              <TableCell>
                                {questionBadge ? (
                                  <Badge variant="soft" className={questionBadge.className}>
                                    {questionBadge.label}
                                  </Badge>
                                ) : (
                                  <span className="text-sm text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {difficultyBadge ? (
                                  <Badge variant="soft" className={difficultyBadge.className}>
                                    {difficultyBadge.label}
                                  </Badge>
                                ) : (
                                  <span className="text-sm text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Input
                                  inputMode="decimal"
                                  disabled={isLocked}
                                  className="w-24"
                                  {...form.register(`questions.${questionIndex}.points` as const)}
                                />
                              </TableCell>
                              <TableCell>
                                <span className="tabular-nums text-muted-foreground">
                                  {selectedQuestion?.year ?? "-"}
                                </span>
                              </TableCell>
                              {!isLocked ? (
                                <TableCell className="text-right">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                    onClick={() => removeQuestion(questionIndex)}
                                    aria-label="Remove question"
                                  >
                                    <Trash2Icon />
                                  </Button>
                                </TableCell>
                              ) : null}
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                        No objective questions added to this practice.
                      </div>
                    )}
                  </div>
                </FieldSet>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="review">
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Review Practice</CardTitle>
                  <CardDescription>Confirm the package before saving or publishing.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border border-border/60 p-3">
                      <p className="text-sm text-muted-foreground">Questions</p>
                      <p className="text-lg font-semibold tabular-nums">{questions.length}</p>
                    </div>
                    <div className="rounded-lg border border-border/60 p-3">
                      <p className="text-sm text-muted-foreground">Modes</p>
                      <p className="font-medium">
                        {[watchedValues.hasPracticeMode ? "Practice" : null, watchedValues.hasQuizMode ? "Quiz" : null]
                          .filter(Boolean)
                          .join(" + ") || "-"}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border/60 p-3">
                      <p className="text-sm text-muted-foreground">Access</p>
                      <Badge variant={watchedValues.isFree ? "secondary" : "outline"}>
                        {watchedValues.isFree ? "Free" : "Paid"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Details</CardTitle>
                  <CardDescription>Bank-soal metadata and settings.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 text-sm md:grid-cols-2">
                    <div className="rounded-lg border border-border/60 p-3">
                      <span className="text-muted-foreground">Exam type</span>
                      <p className="font-medium">{selectedExamType?.name ?? "-"}</p>
                    </div>
                    <div className="rounded-lg border border-border/60 p-3">
                      <span className="text-muted-foreground">Subject</span>
                      <p className="font-medium">{selectedSubject?.name ?? "-"}</p>
                    </div>
                    <div className="rounded-lg border border-border/60 p-3">
                      <span className="text-muted-foreground">Topic</span>
                      <p className="font-medium">{selectedTopic?.name ?? "-"}</p>
                    </div>
                    <div className="rounded-lg border border-border/60 p-3 md:col-span-2">
                      <span className="text-muted-foreground">Title</span>
                      <p className="font-medium">{watchedValues.title || "-"}</p>
                    </div>
                    <div className="rounded-lg border border-border/60 p-3 md:col-span-2">
                      <span className="text-muted-foreground">Description</span>
                      <p className="whitespace-pre-wrap font-medium">
                        {formatReviewText(watchedValues.description)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Settings</CardTitle>
                  <CardDescription>Modes and quiz timing.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <div className="grid gap-3 text-sm md:grid-cols-3">
                      <div className="rounded-lg border border-border/60 p-3">
                        <span className="text-muted-foreground">Practice mode</span>
                        <p className="font-medium">{getEnabledLabel(watchedValues.hasPracticeMode)}</p>
                      </div>
                      <div className="rounded-lg border border-border/60 p-3">
                        <span className="text-muted-foreground">Quiz mode</span>
                        <p className="font-medium">{getEnabledLabel(watchedValues.hasQuizMode)}</p>
                      </div>
                      <div className="rounded-lg border border-border/60 p-3">
                        <span className="text-muted-foreground">Quiz duration</span>
                        <p className="font-medium tabular-nums">
                          {watchedValues.hasQuizMode
                            ? `${formatReviewText(watchedValues.quizDurationMinutes)} minutes`
                            : "-"}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Questions</CardTitle>
                  <CardDescription>Selected objective questions and point overrides.</CardDescription>
                </CardHeader>
                <CardContent>
                  {questions.length > 0 ? (
                    <div className="overflow-hidden rounded-lg border border-border/60">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">
                              #
                            </TableHead>
                            <TableHead className="min-w-[22rem]">
                              Question
                            </TableHead>
                            <TableHead>
                              Topic
                            </TableHead>
                            <TableHead>
                              Type
                            </TableHead>
                            <TableHead>
                              Difficulty
                            </TableHead>
                            <TableHead className="text-right">
                              Point
                            </TableHead>
                            <TableHead className="text-right">
                              Year
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {questions.map((question, questionIndex) => {
                            const selectedQuestion = lookups.questions.find(
                              (item) => String(item.id) === question.questionId,
                            )
                            const questionBadge = selectedQuestion
                              ? getModelEnumBadgeMeta("questionType", selectedQuestion.type)
                              : null
                            const difficultyBadge = selectedQuestion
                              ? getModelEnumBadgeMeta("questionDifficulty", selectedQuestion.difficulty)
                              : null

                            return (
                              <TableRow key={`review-${question.questionId}-${questionIndex}`}>
                                <TableCell className="tabular-nums text-muted-foreground">
                                  {questionIndex + 1}
                                </TableCell>
                                <TableCell className="whitespace-normal">
                                  <div className="flex min-w-[22rem] max-w-[36rem] flex-col gap-1">
                                    <span className="font-medium">
                                      {selectedQuestion
                                        ? previewText(selectedQuestion.title, `Question ${selectedQuestion.id}`)
                                        : `Question ${question.questionId || "-"}`}
                                    </span>
                                    <span className="line-clamp-2 text-sm text-muted-foreground">
                                      {selectedQuestion
                                        ? previewText(selectedQuestion.content)
                                        : "This question is no longer available in the lookup."}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>{selectedQuestion?.topicName ?? "-"}</TableCell>
                                <TableCell>
                                  {questionBadge ? (
                                    <Badge variant="soft" className={questionBadge.className}>
                                      {questionBadge.label}
                                    </Badge>
                                  ) : (
                                    <span className="text-sm text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {difficultyBadge ? (
                                    <Badge variant="soft" className={difficultyBadge.className}>
                                      {difficultyBadge.label}
                                    </Badge>
                                  ) : (
                                    <span className="text-sm text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right tabular-nums">
                                  {formatReviewText(question.points)}
                                </TableCell>
                                <TableCell className="text-right tabular-nums text-muted-foreground">
                                  {selectedQuestion?.year ?? "-"}
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                      No objective questions added to this practice.
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Final Action</CardTitle>
                  <CardDescription>Save this practice as draft or publish it now.</CardDescription>
                </CardHeader>
                {rootError ? (
                  <CardContent>
                    <p className="text-sm text-destructive" aria-live="polite">
                      {rootError}
                    </p>
                  </CardContent>
                ) : null}
                <CardFooter className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <Button type="button" variant="outline" asChild>
                    <Link href={backHref}>
                      <ArrowLeftIcon data-icon="inline-start" />
                      Cancel
                    </Link>
                  </Button>
                  {!isLocked ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={form.formState.isSubmitting}
                        onClick={() => void handleDraftSubmit()}
                      >
                        <SaveIcon data-icon="inline-start" />
                        {submitIntent === "draft" ? "Saving..." : "Draft"}
                      </Button>
                      <Button
                        type="button"
                        disabled={form.formState.isSubmitting}
                        onClick={() => setIsPublishDialogOpen(true)}
                      >
                        <RocketIcon data-icon="inline-start" />
                        {submitIntent === "publish" ? "Publishing..." : "Publish"}
                      </Button>
                    </>
                  ) : null}
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </form>

      <PracticeQuestionPickerDialog
        open={isPickerOpen}
        questions={pickerQuestions}
        practiceTitle={watchedValues.title || "this practice"}
        onOpenChange={setIsPickerOpen}
        onAddQuestions={addQuestionsFromPicker}
      />

      <AlertDialog open={isPublishDialogOpen} onOpenChange={setIsPublishDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish practice?</AlertDialogTitle>
            <AlertDialogDescription>
              This will save the current draft and publish it immediately. After publishing,
              the practice can no longer be edited.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button type="button" variant="outline" disabled={form.formState.isSubmitting}>
                Cancel
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                type="button"
                disabled={form.formState.isSubmitting}
                onClick={() => void handlePublishSubmit()}
              >
                <RocketIcon data-icon="inline-start" />
                {submitIntent === "publish" ? "Publishing..." : "Publish"}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminFormPage>
  )
}
