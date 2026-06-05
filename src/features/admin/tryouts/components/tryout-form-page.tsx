"use client"

import { useEffect, useId, useMemo, useState, type ReactNode } from "react"
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
import { Checkbox } from "@/components/ui/checkbox"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldLegend,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
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
import { formatAdminDateTime } from "@/lib/format"
import { cn } from "@/lib/utils"

import { createTryoutAction, publishTryoutAction, updateTryoutAction } from "../actions"
import {
  tryoutNavigationModeLabels,
  tryoutNavigationModeValues,
  tryoutScoringMethodLabels,
  tryoutScoringMethodValues,
  type TryoutNavigationMode,
  type TryoutScoringMethod,
} from "../constants"
import { TryoutQuestionPickerDialog } from "./tryout-question-picker-dialog"
import type {
  TryoutDetails,
  TryoutQuestionLookupOption,
  TryoutLookupOption,
  TryoutSubjectLookupOption,
} from "../queries"
import { tryoutFormSchema, type TryoutFormValues } from "../schemas"
import { previewText, toDateTimeLocalValue } from "../utils/tryout"

const STEPS = ["details", "schedule", "sections", "review"] as const
type WizardStep = (typeof STEPS)[number]
type DraggedQuestion = {
  sectionIndex: number
  questionIndex: number
}
type SubmitIntent = "draft" | "publish"

type TryoutFormPageProps = {
  mode: "create" | "edit"
  tryoutId?: number
  title: string
  description: string
  backHref: string
  lookups: {
    examTypes: TryoutLookupOption[]
    subjects: TryoutSubjectLookupOption[]
    questions: TryoutQuestionLookupOption[]
  }
  initialValues?: TryoutDetails | null
}

function getDefaultValues(initialValues?: TryoutDetails | null): TryoutFormValues {
  return {
    examTypeId: initialValues?.examTypeId ? String(initialValues.examTypeId) : "",
    title: initialValues?.title ?? "",
    description: initialValues?.description ?? "",
    isFree: initialValues?.isFree ?? true,
    startsAt: toDateTimeLocalValue(initialValues?.startsAt),
    endsAt: toDateTimeLocalValue(initialValues?.endsAt),
    shuffleQuestions: initialValues?.shuffleQuestions ?? false,
    shuffleOptions: initialValues?.shuffleOptions ?? false,
    allowReviewBeforeSubmit: initialValues?.allowReviewBeforeSubmit ?? true,
    showResultAfterSubmit: initialValues?.showResultAfterSubmit ?? true,
    resultReleaseAt: toDateTimeLocalValue(initialValues?.resultReleaseAt),
    showRankingAfterSubmit: initialValues?.showRankingAfterSubmit ?? true,
    rankingReleaseAt: toDateTimeLocalValue(initialValues?.rankingReleaseAt),
    showExplanationAfterSubmit: initialValues?.showExplanationAfterSubmit ?? true,
    explanationReleaseAt: toDateTimeLocalValue(initialValues?.explanationReleaseAt),
    navigationMode: initialValues?.navigationMode ?? "free",
    scoringMethod: initialValues?.scoringMethod ?? "raw_score",
    enforceEndTime: initialValues?.enforceEndTime ?? false,
    wrongAnswerPenalty: String(initialValues?.wrongAnswerPenalty ?? 0),
    sections:
      initialValues?.sections.map((section) => ({
        id: String(section.id),
        subjectId: String(section.subjectId),
        title: section.title,
        description: section.description ?? "",
        durationMinutes: String(section.durationMinutes),
        orderIndex: String(section.orderIndex),
        wrongAnswerPenalty:
          section.wrongAnswerPenalty === null ? "" : String(section.wrongAnswerPenalty),
        questions: section.questions.map((question) => ({
          id: String(question.id),
          questionId: String(question.questionId),
          orderIndex: String(question.orderIndex),
          points: String(question.points ?? question.basePoints),
        })),
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

function formatReviewDateTime(value: string | null | undefined) {
  const trimmed = value?.trim()

  if (!trimmed) {
    return "-"
  }

  const parsed = new Date(trimmed)

  if (Number.isNaN(parsed.getTime())) {
    return trimmed
  }

  return formatAdminDateTime(parsed)
}

function formatReviewText(value: string | null | undefined, fallback = "-") {
  const trimmed = value?.trim()
  return trimmed ? trimmed : fallback
}

function getEnabledLabel(value: boolean | null | undefined) {
  return value ? "Enabled" : "Disabled"
}

function getStepForErrors(errors: FieldErrors<TryoutFormValues>): WizardStep {
  if (
    errors.examTypeId ||
    errors.title ||
    errors.description ||
    errors.isFree ||
    errors.scoringMethod ||
    errors.wrongAnswerPenalty
  ) {
    return "details"
  }

  if (
    errors.startsAt ||
    errors.endsAt ||
    errors.allowReviewBeforeSubmit ||
    errors.showResultAfterSubmit ||
    errors.resultReleaseAt ||
    errors.showRankingAfterSubmit ||
    errors.rankingReleaseAt ||
    errors.showExplanationAfterSubmit ||
    errors.explanationReleaseAt ||
    errors.navigationMode ||
    errors.enforceEndTime ||
    errors.shuffleQuestions ||
    errors.shuffleOptions
  ) {
    return "schedule"
  }

  return "sections"
}

function ReviewField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border/60 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="text-sm font-medium sm:text-right">{children}</div>
    </div>
  )
}

export function TryoutFormPage({
  mode,
  tryoutId,
  title,
  description,
  backHref,
  lookups,
  initialValues,
}: TryoutFormPageProps) {
  const router = useRouter()
  const formId = useId()
  const [step, setStep] = useState<WizardStep>("details")
  const [massPoints, setMassPoints] = useState<Record<number, string>>({})
  const [selectedQuestionIdsBySection, setSelectedQuestionIdsBySection] = useState<string[][]>([])
  const [pickerSectionIndex, setPickerSectionIndex] = useState<number | null>(null)
  const [draggedQuestion, setDraggedQuestion] = useState<DraggedQuestion | null>(null)
  const [submitIntent, setSubmitIntent] = useState<SubmitIntent | null>(null)
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false)
  const isLocked = Boolean(initialValues && initialValues.status !== "draft")
  const defaultValues = useMemo(() => getDefaultValues(initialValues), [initialValues])

  const form = useForm<TryoutFormValues>({
    resolver: zodResolver(tryoutFormSchema) as Resolver<TryoutFormValues>,
    defaultValues,
  })

  useEffect(() => {
    form.reset(defaultValues)
  }, [defaultValues, form])

  const watchedValues = useWatch({ control: form.control }) as TryoutFormValues
  const watchedExamTypeId = watchedValues.examTypeId ?? ""
  const sections = watchedValues.sections ?? []
  const rootError = form.formState.errors.root?.message
  const totalQuestions = sections.reduce(
    (total, section) => total + (section.questions?.length ?? 0),
    0,
  )
  const totalDurationMinutes = sections.reduce((total, section) => {
    const duration = Number(section.durationMinutes || 0)
    return total + (Number.isFinite(duration) ? duration : 0)
  }, 0)

  const selectedExamTypeId = Number(watchedExamTypeId || 0)
  const selectedExamType = lookups.examTypes.find(
    (examType) => examType.id === selectedExamTypeId,
  )
  const filteredSubjects = lookups.subjects.filter(
    (subject) => subject.examTypeId === selectedExamTypeId,
  )
  const pickerSection =
    pickerSectionIndex === null ? null : sections[pickerSectionIndex] ?? null
  const pickerQuestions = useMemo(() => {
    if (!pickerSection) {
      return []
    }

    const selectedQuestionIds = new Set(
      pickerSection.questions.map((question) => question.questionId),
    )
    const subjectId = Number(pickerSection.subjectId || 0)

    return lookups.questions.filter(
      (question) =>
        question.status === "published" &&
        question.examTypeId === selectedExamTypeId &&
        question.subjectId === subjectId &&
        !selectedQuestionIds.has(String(question.id)),
    )
  }, [lookups.questions, pickerSection, selectedExamTypeId])

  function setSections(nextSections: TryoutFormValues["sections"]) {
    form.setValue("sections", nextSections, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  function addSection() {
    const nextIndex = sections.length + 1
    setSections([
      ...sections,
      {
        id: "",
        subjectId: "",
        title: `Section ${nextIndex}`,
        description: "",
        durationMinutes: "30",
        orderIndex: String(nextIndex),
        wrongAnswerPenalty: "",
        questions: [],
      },
    ])
    setSelectedQuestionIdsBySection((current) => [...current, []])
  }

  function removeSection(sectionIndex: number) {
    if (pickerSectionIndex === sectionIndex) {
      setPickerSectionIndex(null)
    }

    setSections(
      sections
        .filter((_, index) => index !== sectionIndex)
      .map((section, index) => ({
          ...section,
          orderIndex: String(index + 1),
        })),
    )
    setSelectedQuestionIdsBySection((current) => current.filter((_, index) => index !== sectionIndex))
  }

  function updateSectionQuestions(
    sectionIndex: number,
    questions: TryoutFormValues["sections"][number]["questions"],
  ) {
    const nextSections = sections.map((section, index) =>
      index === sectionIndex ? { ...section, questions } : section,
    )

    setSections(nextSections)
  }

  function openQuestionPicker(sectionIndex: number) {
    const section = sections[sectionIndex]
    if (!section) {
      return
    }

    if (!section.subjectId) {
      toast.error("Select a subject before adding questions.")
      return
    }

    setPickerSectionIndex(sectionIndex)
  }

  function addQuestionsFromPicker(selectedQuestions: TryoutQuestionLookupOption[]) {
    if (pickerSectionIndex === null) {
      return
    }

    const section = sections[pickerSectionIndex]
    if (!section) {
      return
    }

    updateSectionQuestions(pickerSectionIndex, [
      ...section.questions,
      ...selectedQuestions.map((question, index) => ({
        id: "",
        questionId: String(question.id),
        orderIndex: String(section.questions.length + index + 1),
        points: String(question.points),
      })),
    ])
    setPickerSectionIndex(null)
    toast.success(`${selectedQuestions.length} question(s) added.`)
  }

  function toggleQuestionSelection(
    sectionIndex: number,
    questionId: string,
    checked: boolean,
  ) {
    setSelectedQuestionIdsBySection((current) => {
      const next = [...current]
      const sectionSelection = next[sectionIndex] ?? []

      next[sectionIndex] = checked
        ? sectionSelection.includes(questionId)
          ? sectionSelection
          : [...sectionSelection, questionId]
        : sectionSelection.filter((id) => id !== questionId)

      return next
    })
  }

  function toggleAllQuestionSelection(
    sectionIndex: number,
    questionIds: string[],
    checked: boolean,
  ) {
    setSelectedQuestionIdsBySection((current) => {
      const next = [...current]
      next[sectionIndex] = checked ? questionIds : []
      return next
    })
  }

  function removeQuestion(sectionIndex: number, questionIndex: number) {
    const section = sections[sectionIndex]
    if (!section) {
      return
    }

    const removedQuestion = section.questions[questionIndex]

    updateSectionQuestions(
      sectionIndex,
      section.questions
        .filter((_, index) => index !== questionIndex)
        .map((question, index) => ({
          ...question,
          orderIndex: String(index + 1),
        })),
    )

    if (removedQuestion) {
      setSelectedQuestionIdsBySection((current) => {
        const next = [...current]
        const sectionSelection = next[sectionIndex] ?? []
        next[sectionIndex] = sectionSelection.filter((questionId) => questionId !== removedQuestion.questionId)
        return next
      })
    }
  }

  function reorderQuestion(sectionIndex: number, fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) {
      return
    }

    const section = sections[sectionIndex]
    if (!section) {
      return
    }

    const nextQuestions = [...section.questions]
    const [movedQuestion] = nextQuestions.splice(fromIndex, 1)

    if (!movedQuestion) {
      return
    }

    nextQuestions.splice(toIndex, 0, movedQuestion)

    updateSectionQuestions(
      sectionIndex,
      nextQuestions.map((question, index) => ({
        ...question,
        orderIndex: String(index + 1),
      })),
    )
  }

  function applyMassPoints(sectionIndex: number) {
    const value = massPoints[sectionIndex]?.trim()
    const points = Number(value)

    if (!value || !Number.isFinite(points) || points <= 0) {
      toast.error("Enter a point value greater than 0.")
      return
    }

    const section = sections[sectionIndex]
    if (!section) {
      return
    }

    const selectedQuestionIds = selectedQuestionIdsBySection[sectionIndex] ?? []
    const selectedQuestionIdSet = new Set(selectedQuestionIds)
    const selectedQuestions = section.questions.filter((question) =>
      selectedQuestionIdSet.has(question.questionId),
    )

    if (selectedQuestions.length === 0) {
      toast.error("Select questions before overriding points.")
      return
    }

    updateSectionQuestions(
      sectionIndex,
      section.questions.map((question) =>
        selectedQuestionIdSet.has(question.questionId)
          ? {
              ...question,
              points: value,
            }
          : question,
      ),
    )
    toast.success("Points overridden for selected questions.")
  }

  function applyActionError(result: {
    message?: string
    fieldErrors?: Partial<Record<keyof TryoutFormValues, string[]>>
  }) {
    if (result.fieldErrors) {
      const fieldNames = Object.keys(result.fieldErrors) as Array<keyof TryoutFormValues>

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

  async function saveDraft(values: TryoutFormValues) {
    if (isLocked) {
      toast.error("Published or archived tryouts cannot be edited.")
      return null
    }

    const result =
      mode === "create"
        ? await createTryoutAction(values)
        : await updateTryoutAction(tryoutId ?? 0, values)

    if (!result.success) {
      applyActionError(result)
      return null
    }

    return result.data
  }

  function handleInvalidSubmit(errors: FieldErrors<TryoutFormValues>) {
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

        toast.success("Tryout draft saved.")

        if (mode === "create") {
          router.replace(`/admin/tryouts/${draft.id}/edit`)
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

        const result = await publishTryoutAction(draft.id)

        if (!result.success) {
          form.setError("root", {
            type: "server",
            message: result.message,
          })
          toast.error(result.message)
          return
        }

        toast.success("Tryout published.")
        setIsPublishDialogOpen(false)
        router.replace(`/admin/tryouts/${draft.id}`)
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
      backLabel="Back to Tryouts"
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
            <CardTitle>Tryout is locked</CardTitle>
            <CardDescription>
              Published and archived tryouts are immutable. Use the detail page to archive
              a published tryout when it needs to be retired.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <form id={formId} onSubmit={(event) => event.preventDefault()}>
        <Tabs value={step} onValueChange={(value) => setStep(value as WizardStep)}>
          <TabsList className="mb-4 flex w-full flex-wrap justify-start">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="sections">Sections</TabsTrigger>
            <TabsTrigger value="review">Review</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>Tryout Details</CardTitle>
                <CardDescription>
                  Define the exam family, access level, title, and scoring baseline.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  {rootError ? (
                    <p className="text-sm text-destructive" aria-live="polite">
                      {rootError}
                    </p>
                  ) : null}

                  <div className="grid gap-4 md:grid-cols-3">
                    <Field data-invalid={Boolean(form.formState.errors.examTypeId)}>
                      <FieldContent>
                        <FieldLabel htmlFor={`${formId}-exam-type`} className="required">
                          Exam Type
                        </FieldLabel>
                      </FieldContent>
                      <div className="flex flex-col gap-1.5">
                        <Select
                          value={watchedExamTypeId || ""}
                          disabled={isLocked}
                          onValueChange={(value) => {
                            form.setValue("examTypeId", value, {
                              shouldDirty: true,
                              shouldValidate: true,
                            })
                            form.setValue("sections", [], {
                              shouldDirty: true,
                              shouldValidate: true,
                            })
                            setSelectedQuestionIdsBySection([])
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
                        <FieldDescription>
                          Sections and questions are scoped to this exam family.
                        </FieldDescription>
                        <FieldError>{form.formState.errors.examTypeId?.message}</FieldError>
                      </div>
                    </Field>

                    <Field data-invalid={Boolean(form.formState.errors.scoringMethod)}>
                      <FieldContent>
                        <FieldLabel htmlFor={`${formId}-scoring-method`} className="required">
                          Scoring Method
                        </FieldLabel>
                      </FieldContent>
                      <div className="flex flex-col gap-1.5">
                        <Select
                          value={(watchedValues.scoringMethod ?? "raw_score") as TryoutScoringMethod}
                          disabled={isLocked}
                          onValueChange={(value) =>
                            form.setValue("scoringMethod", value as TryoutScoringMethod, {
                              shouldDirty: true,
                              shouldValidate: true,
                            })
                          }
                        >
                          <SelectTrigger id={`${formId}-scoring-method`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {tryoutScoringMethodValues.map((value) => (
                              <SelectItem key={value} value={value}>
                                {tryoutScoringMethodLabels[value]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FieldDescription>
                          IRT calibrates item parameters from graded responses and returns scaled scores.
                        </FieldDescription>
                        <FieldError>{form.formState.errors.scoringMethod?.message}</FieldError>
                      </div>
                    </Field>

                    <Field data-invalid={Boolean(form.formState.errors.wrongAnswerPenalty)}>
                      <FieldContent>
                        <FieldLabel htmlFor={`${formId}-penalty`} className="required">
                          Default Wrong Answer Penalty
                        </FieldLabel>
                      </FieldContent>
                      <div className="flex flex-col gap-1.5">
                        <Input
                          id={`${formId}-penalty`}
                          placeholder="0 or -1"
                          disabled={isLocked}
                          aria-invalid={Boolean(form.formState.errors.wrongAnswerPenalty)}
                          {...form.register("wrongAnswerPenalty")}
                        />
                        <FieldDescription>
                          {watchedValues.scoringMethod === "irt_3pl"
                            ? "Ignored when Scoring Method is IRT."
                            : "Use 0 for no penalty or a negative value such as -0.25."}
                        </FieldDescription>
                        <FieldError>{form.formState.errors.wrongAnswerPenalty?.message}</FieldError>
                      </div>
                    </Field>
                  </div>

                  <Field data-invalid={Boolean(form.formState.errors.title)}>
                    <FieldContent>
                      <FieldLabel htmlFor={`${formId}-title`} className="required">
                        Title
                      </FieldLabel>
                    </FieldContent>
                    <div className="flex flex-col gap-1.5">
                      <Input
                        id={`${formId}-title`}
                        placeholder="Tryout UTBK Intensif Mei"
                        disabled={isLocked}
                        aria-invalid={Boolean(form.formState.errors.title)}
                        {...form.register("title")}
                      />
                      <FieldError>{form.formState.errors.title?.message}</FieldError>
                    </div>
                  </Field>

                  <Field data-invalid={Boolean(form.formState.errors.description)}>
                    <FieldContent>
                      <FieldLabel htmlFor={`${formId}-description`}>
                        Description
                      </FieldLabel>
                    </FieldContent>
                    <div className="flex flex-col gap-1.5">
                      <Textarea
                        id={`${formId}-description`}
                        rows={5}
                        placeholder="Short admin-facing summary."
                        disabled={isLocked}
                        aria-invalid={Boolean(form.formState.errors.description)}
                        {...form.register("description")}
                      />
                      <FieldError>{form.formState.errors.description?.message}</FieldError>
                    </div>
                  </Field>

                  <FieldSwitch
                    id={`${formId}-free`}
                    label="Free Access"
                    description="When disabled, only paid plans can access this tryout."
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

          <TabsContent value="schedule">
            <div className="flex flex-col gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Schedule and Release</CardTitle>
                  <CardDescription>
                    Configure availability and delayed result, ranking, and explanation release.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FieldGroup>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field data-invalid={Boolean(form.formState.errors.startsAt)}>
                        <FieldContent>
                          <FieldLabel htmlFor={`${formId}-starts-at`}>Starts At</FieldLabel>
                        </FieldContent>
                        <div className="flex flex-col gap-1.5">
                          <Input
                            id={`${formId}-starts-at`}
                            type="datetime-local"
                            disabled={isLocked}
                            {...form.register("startsAt")}
                          />
                          <FieldError>{form.formState.errors.startsAt?.message}</FieldError>
                        </div>
                      </Field>

                      <Field data-invalid={Boolean(form.formState.errors.endsAt)}>
                        <FieldContent>
                          <FieldLabel htmlFor={`${formId}-ends-at`}>Ends At</FieldLabel>
                        </FieldContent>
                        <div className="flex flex-col gap-1.5">
                          <Input
                            id={`${formId}-ends-at`}
                            type="datetime-local"
                            disabled={isLocked}
                            {...form.register("endsAt")}
                          />
                          <FieldError>{form.formState.errors.endsAt?.message}</FieldError>
                        </div>
                      </Field>
                    </div>

                    <FieldSwitch
                      id={`${formId}-enforce-end-time`}
                      label="Enforce End Time"
                      description="Auto-submit active or unopened sections when the tryout period ends."
                      checked={Boolean(watchedValues.enforceEndTime)}
                      disabled={isLocked}
                      onCheckedChange={(checked) =>
                        form.setValue("enforceEndTime", checked, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                    />

                    <div className="grid gap-4 md:grid-cols-3">
                      <Field>
                        <FieldContent>
                          <FieldLabel htmlFor={`${formId}-result-release`}>Result Release</FieldLabel>
                        </FieldContent>
                        <Input
                          id={`${formId}-result-release`}
                          type="datetime-local"
                          disabled={isLocked || !watchedValues.showResultAfterSubmit}
                          {...form.register("resultReleaseAt")}
                        />
                      </Field>
                      <Field>
                        <FieldContent>
                          <FieldLabel htmlFor={`${formId}-ranking-release`}>Ranking Release</FieldLabel>
                        </FieldContent>
                        <Input
                          id={`${formId}-ranking-release`}
                          type="datetime-local"
                          disabled={isLocked || !watchedValues.showRankingAfterSubmit}
                          {...form.register("rankingReleaseAt")}
                        />
                      </Field>
                      <Field>
                        <FieldContent>
                          <FieldLabel htmlFor={`${formId}-explanation-release`}>Explanation Release</FieldLabel>
                        </FieldContent>
                        <Input
                          id={`${formId}-explanation-release`}
                          type="datetime-local"
                          disabled={isLocked || !watchedValues.showExplanationAfterSubmit}
                          {...form.register("explanationReleaseAt")}
                        />
                      </Field>
                    </div>
                  </FieldGroup>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Attempt Settings</CardTitle>
                  <CardDescription>
                    Global behavior for navigation, randomization, and post-submit visibility.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FieldGroup>
                    <Field>
                      <FieldContent>
                        <FieldLabel htmlFor={`${formId}-navigation-mode`} className="required">
                          Navigation Mode
                        </FieldLabel>
                        <FieldDescription>
                          Free navigation allows users to jump between questions.
                        </FieldDescription>
                      </FieldContent>
                      <Select
                        value={(watchedValues.navigationMode ?? "free") as TryoutNavigationMode}
                        disabled={isLocked}
                        onValueChange={(value) =>
                          form.setValue("navigationMode", value as TryoutNavigationMode, {
                            shouldDirty: true,
                          })
                        }
                      >
                        <SelectTrigger id={`${formId}-navigation-mode`} className="sm:w-52">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {tryoutNavigationModeValues.map((value) => (
                            <SelectItem key={value} value={value}>
                              {tryoutNavigationModeLabels[value]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>

                    <div className="grid gap-4 md:grid-cols-2">
                      <FieldSwitch
                        id={`${formId}-shuffle-questions`}
                        label="Shuffle Questions"
                        description="Randomize question order inside each section snapshot."
                        checked={Boolean(watchedValues.shuffleQuestions)}
                        disabled={isLocked}
                        onCheckedChange={(checked) =>
                          form.setValue("shuffleQuestions", checked, { shouldDirty: true })
                        }
                      />
                      <FieldSwitch
                        id={`${formId}-shuffle-options`}
                        label="Shuffle Options"
                        description="Randomize answer options for questions that support answer choices."
                        checked={Boolean(watchedValues.shuffleOptions)}
                        disabled={isLocked}
                        onCheckedChange={(checked) =>
                          form.setValue("shuffleOptions", checked, { shouldDirty: true })
                        }
                      />
                      <FieldSwitch
                        id={`${formId}-review-before-submit`}
                        label="Review Before Submit"
                        description="Allow users to review marked and unanswered questions before final submit."
                        checked={Boolean(watchedValues.allowReviewBeforeSubmit)}
                        disabled={isLocked}
                        onCheckedChange={(checked) =>
                          form.setValue("allowReviewBeforeSubmit", checked, { shouldDirty: true })
                        }
                      />
                      <FieldSwitch
                        id={`${formId}-show-result`}
                        label="Show Result"
                        description="Result also respects the release schedule above."
                        checked={Boolean(watchedValues.showResultAfterSubmit)}
                        disabled={isLocked}
                        onCheckedChange={(checked) =>
                          form.setValue("showResultAfterSubmit", checked, { shouldDirty: true })
                        }
                      />
                      <FieldSwitch
                        id={`${formId}-show-ranking`}
                        label="Show Ranking"
                        description="Ranking visibility still depends on the user's plan."
                        checked={Boolean(watchedValues.showRankingAfterSubmit)}
                        disabled={isLocked}
                        onCheckedChange={(checked) =>
                          form.setValue("showRankingAfterSubmit", checked, { shouldDirty: true })
                        }
                      />
                      <FieldSwitch
                        id={`${formId}-show-explanation`}
                        label="Show Explanation"
                        description="Explanation visibility still depends on release and plan access."
                        checked={Boolean(watchedValues.showExplanationAfterSubmit)}
                        disabled={isLocked}
                        onCheckedChange={(checked) =>
                          form.setValue("showExplanationAfterSubmit", checked, { shouldDirty: true })
                        }
                      />
                    </div>
                  </FieldGroup>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sections">
            <div className="flex flex-col gap-4">
              {sections.map((section, sectionIndex) => {
                const subjectId = Number(section.subjectId || 0)
                const sectionQuestions = section.questions ?? []
                const selectedQuestionIds = new Set(
                  sectionQuestions.map((question) => question.questionId),
                )
                const sectionSelectedQuestionIds = selectedQuestionIdsBySection[sectionIndex] ?? []
                const sectionSelectedQuestionIdSet = new Set(sectionSelectedQuestionIds)
                const selectedSectionQuestions = sectionQuestions.filter((question) =>
                  sectionSelectedQuestionIdSet.has(question.questionId),
                )
                const areAllSectionQuestionsSelected =
                  sectionQuestions.length > 0 &&
                  selectedSectionQuestions.length === sectionQuestions.length
                const areSomeSectionQuestionsSelected =
                  selectedSectionQuestions.length > 0 && !areAllSectionQuestionsSelected
                const availableQuestions = lookups.questions.filter(
                  (question) =>
                    question.status === "published" &&
                    question.examTypeId === selectedExamTypeId &&
                    question.subjectId === subjectId,
                )
                const addableQuestionCount = availableQuestions.filter(
                  (question) => !selectedQuestionIds.has(String(question.id)),
                ).length

                return (
                  <Card key={`${section.id || "new"}-${sectionIndex}`}>
                    <CardHeader>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <CardTitle>{section.title || `Section ${sectionIndex + 1}`}</CardTitle>
                          <CardDescription>
                            Configure section duration, subject scope, penalty override, and questions.
                          </CardDescription>
                        </div>
                        {!isLocked ? (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removeSection(sectionIndex)}
                          >
                            <Trash2Icon data-icon="inline-start" />
                            Remove
                          </Button>
                        ) : null}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <FieldGroup>
                        <div className="grid gap-4 md:grid-cols-2">
                          <Field>
                            <FieldContent>
                              <FieldLabel htmlFor={`${formId}-section-${sectionIndex}-title`} className="required">
                                Section Title
                              </FieldLabel>
                            </FieldContent>
                            <Input
                              id={`${formId}-section-${sectionIndex}-title`}
                              disabled={isLocked}
                              {...form.register(`sections.${sectionIndex}.title` as const)}
                            />
                          </Field>

                          <Field>
                            <FieldContent>
                              <FieldLabel htmlFor={`${formId}-section-${sectionIndex}-subject`} className="required">
                                Subject
                              </FieldLabel>
                            </FieldContent>
                            <Select
                              value={section.subjectId || ""}
                              disabled={isLocked || !selectedExamTypeId}
                              onValueChange={(value) => {
                                const nextSections = sections.map((item, index) =>
                                  index === sectionIndex
                                    ? { ...item, subjectId: value, questions: [] }
                                    : item,
                                )
                                setSections(nextSections)
                                setSelectedQuestionIdsBySection((current) => {
                                  const next = [...current]
                                  next[sectionIndex] = []
                                  return next
                                })
                              }}
                            >
                              <SelectTrigger id={`${formId}-section-${sectionIndex}-subject`}>
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
                          </Field>
                        </div>

                        <input
                          type="hidden"
                          {...form.register(`sections.${sectionIndex}.orderIndex` as const)}
                        />

                        <div className="grid gap-4 md:grid-cols-2">
                          <Field>
                            <FieldContent>
                              <FieldLabel className="required">Duration Minutes</FieldLabel>
                            </FieldContent>
                            <Input
                              inputMode="numeric"
                              disabled={isLocked}
                              {...form.register(`sections.${sectionIndex}.durationMinutes` as const)}
                            />
                          </Field>

                          <Field>
                            <FieldContent>
                              <FieldLabel>Penalty Override</FieldLabel>
                            </FieldContent>
                            <Input
                              placeholder="Use default"
                              disabled={isLocked}
                              {...form.register(`sections.${sectionIndex}.wrongAnswerPenalty` as const)}
                            />
                          </Field>
                        </div>

                        <Field>
                          <FieldContent>
                            <FieldLabel>Description</FieldLabel>
                          </FieldContent>
                          <Textarea
                            rows={3}
                            disabled={isLocked}
                            {...form.register(`sections.${sectionIndex}.description` as const)}
                          />
                        </Field>

                        <FieldSet>
                          <FieldLegend>Questions</FieldLegend>
                          <div className="flex flex-col gap-3 rounded-lg border border-border/60 p-3">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{sectionQuestions.length} questions</Badge>
                                <span className="text-sm text-muted-foreground">
                                  Available: {addableQuestionCount}
                                </span>
                              </div>
                              {!isLocked ? (
                                <div className="flex flex-col gap-2 sm:flex-row">
                                  <Input
                                    value={massPoints[sectionIndex] ?? ""}
                                    onChange={(event) =>
                                      setMassPoints((current) => ({
                                        ...current,
                                        [sectionIndex]: event.target.value,
                                      }))
                                    }
                                    placeholder="Mass points"
                                    className="sm:w-32"
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    disabled={(selectedQuestionIdsBySection[sectionIndex] ?? []).length === 0}
                                    onClick={() => applyMassPoints(sectionIndex)}
                                  >
                                    <RotateCcwIcon data-icon="inline-start" />
                                    Override
                                  </Button>
                                  <Button
                                    type="button"
                                    disabled={!subjectId}
                                    onClick={() => openQuestionPicker(sectionIndex)}
                                  >
                                    <PlusIcon data-icon="inline-start" />
                                    Add Question
                                  </Button>
                                </div>
                              ) : null}
                            </div>

                            {sectionQuestions.length > 0 ? (
                              <div className="overflow-hidden rounded-2xl border border-border/60">
                                  <Table>
                                  <TableHeader>
                                    <TableRow>
                                      {!isLocked ? (
                                        <TableHead className="w-12">
                                          <Checkbox
                                            checked={
                                              areAllSectionQuestionsSelected
                                                ? true
                                                : areSomeSectionQuestionsSelected
                                                  ? "indeterminate"
                                                  : false
                                            }
                                            onCheckedChange={(checked) =>
                                              toggleAllQuestionSelection(
                                                sectionIndex,
                                                sectionQuestions.map((question) => question.questionId),
                                                checked === true,
                                              )
                                            }
                                            aria-label="Select all questions"
                                          />
                                        </TableHead>
                                      ) : null}
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
                                      <TableHead className="w-24">
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
                                    {sectionQuestions.map((question, questionIndex) => {
                                      const selectedQuestion = lookups.questions.find(
                                        (item) => String(item.id) === question.questionId,
                                      )
                                      const questionBadge = selectedQuestion
                                        ? getModelEnumBadgeMeta("questionType", selectedQuestion.type)
                                        : null
                                      const difficultyBadge = selectedQuestion
                                        ? getModelEnumBadgeMeta(
                                            "questionDifficulty",
                                            selectedQuestion.difficulty,
                                          )
                                        : null
                                      const isDragging =
                                        draggedQuestion?.sectionIndex === sectionIndex &&
                                        draggedQuestion.questionIndex === questionIndex

                                      return (
                                        <TableRow
                                          key={`${question.id || "new"}-${question.questionId}-${questionIndex}`}
                                          data-state={isDragging ? "selected" : undefined}
                                          className={cn(isDragging && "opacity-60")}
                                          onDragOver={(event) => {
                                            if (
                                              !isLocked &&
                                              draggedQuestion?.sectionIndex === sectionIndex
                                            ) {
                                              event.preventDefault()
                                              event.dataTransfer.dropEffect = "move"
                                            }
                                          }}
                                          onDrop={(event) => {
                                            event.preventDefault()

                                            if (
                                              !isLocked &&
                                              draggedQuestion?.sectionIndex === sectionIndex
                                            ) {
                                              reorderQuestion(
                                                sectionIndex,
                                                draggedQuestion.questionIndex,
                                                questionIndex,
                                              )
                                            }

                                            setDraggedQuestion(null)
                                          }}
                                        >
                                          {!isLocked ? (
                                            <TableCell>
                                              <Checkbox
                                                checked={sectionSelectedQuestionIdSet.has(question.questionId)}
                                                onCheckedChange={(checked) =>
                                                  toggleQuestionSelection(
                                                    sectionIndex,
                                                    question.questionId,
                                                    checked === true,
                                                  )
                                                }
                                                aria-label={`Select question ${questionIndex + 1}`}
                                              />
                                            </TableCell>
                                          ) : null}
                                          <TableCell>
                                            <input
                                              type="hidden"
                                              {...form.register(
                                                `sections.${sectionIndex}.questions.${questionIndex}.questionId` as const,
                                              )}
                                            />
                                            <input
                                              type="hidden"
                                              {...form.register(
                                                `sections.${sectionIndex}.questions.${questionIndex}.orderIndex` as const,
                                              )}
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
                                                  event.dataTransfer.setData(
                                                    "text/plain",
                                                    `${sectionIndex}:${questionIndex}`,
                                                  )
                                                  setDraggedQuestion({
                                                    sectionIndex,
                                                    questionIndex,
                                                  })
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
                                                  ? previewText(
                                                      selectedQuestion.title,
                                                      `Question ${selectedQuestion.id}`,
                                                    )
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
                                            <span className="text-sm">
                                              {selectedQuestion?.topicName ?? "-"}
                                            </span>
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
                                              {...form.register(
                                                `sections.${sectionIndex}.questions.${questionIndex}.points` as const,
                                              )}
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
                                                onClick={() => removeQuestion(sectionIndex, questionIndex)}
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
                                No questions added to this section.
                              </div>
                            )}
                          </div>
                        </FieldSet>
                      </FieldGroup>
                    </CardContent>
                  </Card>
                )
              })}

              {!isLocked ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={addSection}
                  disabled={!selectedExamTypeId}
                >
                  <PlusIcon data-icon="inline-start" />
                  Add Section
                </Button>
              ) : null}
            </div>
          </TabsContent>

          <TabsContent value="review">
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Review Draft</CardTitle>
                  <CardDescription>
                    Confirm all tryout data before saving or publishing.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <ReviewField label="Sections">
                      <span className="tabular-nums">{sections.length}</span>
                    </ReviewField>
                    <ReviewField label="Questions">
                      <span className="tabular-nums">{totalQuestions}</span>
                    </ReviewField>
                    <ReviewField label="Total duration">
                      <span className="tabular-nums">{totalDurationMinutes} minutes</span>
                    </ReviewField>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Details</CardTitle>
                  <CardDescription>Exam family, access, title, and scoring baseline.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2">
                    <ReviewField label="Exam type">{selectedExamType?.name ?? "-"}</ReviewField>
                    <ReviewField label="Access">
                      <Badge variant={watchedValues.isFree ? "secondary" : "outline"}>
                        {watchedValues.isFree ? "Free" : "Paid"}
                      </Badge>
                    </ReviewField>
                    <ReviewField label="Title">{formatReviewText(watchedValues.title)}</ReviewField>
                    <ReviewField label="Default penalty">
                      <span className="tabular-nums">
                        {formatReviewText(watchedValues.wrongAnswerPenalty)}
                      </span>
                    </ReviewField>
                    <ReviewField label="Scoring Method">
                      {
                        tryoutScoringMethodLabels[
                          (watchedValues.scoringMethod ?? "raw_score") as TryoutScoringMethod
                        ]
                      }
                    </ReviewField>
                    <div className="md:col-span-2">
                      <ReviewField label="Description">
                        <span className="whitespace-pre-wrap text-left sm:text-right">
                          {formatReviewText(watchedValues.description)}
                        </span>
                      </ReviewField>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Schedule</CardTitle>
                  <CardDescription>
                    Availability, release visibility, navigation, and randomization.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      <ReviewField label="Starts at">
                        {formatReviewDateTime(watchedValues.startsAt)}
                      </ReviewField>
                      <ReviewField label="Ends at">
                        {formatReviewDateTime(watchedValues.endsAt)}
                      </ReviewField>
                      <ReviewField label="Enforce end time">
                        {getEnabledLabel(watchedValues.enforceEndTime)}
                      </ReviewField>
                      <ReviewField label="Navigation mode">
                        {
                          tryoutNavigationModeLabels[
                            (watchedValues.navigationMode ?? "free") as TryoutNavigationMode
                          ]
                        }
                      </ReviewField>
                    </div>

                    <Separator />

                    <div className="grid gap-3 md:grid-cols-3">
                      <ReviewField label="Result">
                        <div className="flex flex-col gap-1">
                          <Badge
                            variant={
                              watchedValues.showResultAfterSubmit ? "secondary" : "outline"
                            }
                          >
                            {getEnabledLabel(watchedValues.showResultAfterSubmit)}
                          </Badge>
                          <span className="text-muted-foreground">
                            {formatReviewDateTime(watchedValues.resultReleaseAt)}
                          </span>
                        </div>
                      </ReviewField>
                      <ReviewField label="Ranking">
                        <div className="flex flex-col gap-1">
                          <Badge
                            variant={
                              watchedValues.showRankingAfterSubmit ? "secondary" : "outline"
                            }
                          >
                            {getEnabledLabel(watchedValues.showRankingAfterSubmit)}
                          </Badge>
                          <span className="text-muted-foreground">
                            {formatReviewDateTime(watchedValues.rankingReleaseAt)}
                          </span>
                        </div>
                      </ReviewField>
                      <ReviewField label="Explanation">
                        <div className="flex flex-col gap-1">
                          <Badge
                            variant={
                              watchedValues.showExplanationAfterSubmit ? "secondary" : "outline"
                            }
                          >
                            {getEnabledLabel(watchedValues.showExplanationAfterSubmit)}
                          </Badge>
                          <span className="text-muted-foreground">
                            {formatReviewDateTime(watchedValues.explanationReleaseAt)}
                          </span>
                        </div>
                      </ReviewField>
                    </div>

                    <Separator />

                    <div className="grid gap-3 md:grid-cols-3">
                      <ReviewField label="Shuffle questions">
                        {getEnabledLabel(watchedValues.shuffleQuestions)}
                      </ReviewField>
                      <ReviewField label="Shuffle options">
                        {getEnabledLabel(watchedValues.shuffleOptions)}
                      </ReviewField>
                      <ReviewField label="Review before submit">
                        {getEnabledLabel(watchedValues.allowReviewBeforeSubmit)}
                      </ReviewField>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sections</CardTitle>
                  <CardDescription>
                    Section subject, timing, penalty, and question count.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {sections.length > 0 ? (
                    <div className="overflow-hidden rounded-lg border border-border/60">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[18rem]">
                              Section
                            </TableHead>
                            <TableHead>
                              Subject
                            </TableHead>
                            <TableHead>
                              Duration
                            </TableHead>
                            <TableHead>
                              Penalty
                            </TableHead>
                            <TableHead className="text-right">
                              Questions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sections.map((section, sectionIndex) => {
                            const subject = lookups.subjects.find(
                              (item) => String(item.id) === section.subjectId,
                            )
                            const sectionQuestionCount = section.questions?.length ?? 0

                            return (
                              <TableRow key={`${section.id || "new"}-${sectionIndex}`}>
                                <TableCell className="whitespace-normal">
                                  <div className="flex min-w-[18rem] flex-col gap-1">
                                    <span className="font-medium">
                                      {formatReviewText(section.title, `Section ${sectionIndex + 1}`)}
                                    </span>
                                    <span className="line-clamp-2 text-sm text-muted-foreground">
                                      {formatReviewText(section.description, "No description")}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>{subject?.name ?? "-"}</TableCell>
                                <TableCell>
                                  <span className="tabular-nums">
                                    {formatReviewText(section.durationMinutes)} minutes
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <span className="tabular-nums">
                                    {formatReviewText(
                                      section.wrongAnswerPenalty,
                                      watchedValues.wrongAnswerPenalty || "-",
                                    )}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Badge variant="secondary">
                                    <span className="tabular-nums">{sectionQuestionCount}</span>
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                      No sections configured.
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Final Action</CardTitle>
                  <CardDescription>Save this tryout as draft or publish it now.</CardDescription>
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
      <TryoutQuestionPickerDialog
        open={pickerSectionIndex !== null}
        questions={pickerQuestions}
        sectionTitle={pickerSection?.title || "this section"}
        onOpenChange={(open) => {
          if (!open) {
            setPickerSectionIndex(null)
          }
        }}
        onAddQuestions={addQuestionsFromPicker}
      />
      <AlertDialog open={isPublishDialogOpen} onOpenChange={setIsPublishDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish tryout?</AlertDialogTitle>
            <AlertDialogDescription>
              This will save the current draft and publish it immediately. After publishing,
              the tryout can no longer be edited.
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
