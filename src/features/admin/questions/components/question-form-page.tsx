"use client"

import { useEffect, useId, useMemo, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Controller,
  useFieldArray,
  useForm,
  useWatch,
} from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { PlusIcon, Trash2Icon, UploadIcon } from "lucide-react"
import { toast } from "sonner"

import { AdminFormPage } from "@/components/admin-form-page"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

import { createQuestionAction, updateQuestionAction } from "../actions"
import {
  questionDifficultyLabels,
  questionDifficultyValues,
  questionScoringRuleLabels,
  questionScoringRuleValues,
  questionOptionMaxCount,
  questionStatusLabels,
  questionStatusValues,
  questionTypeLabels,
  questionTypeValues,
  type QuestionDifficulty,
  type QuestionFormValues,
  type QuestionStatus,
  type QuestionType,
} from "../constants"
import { questionFormSchema } from "../schemas"
import type {
  QuestionDetails,
  QuestionLookupOption,
  SubjectLookupOption,
  TopicLookupOption,
} from "../queries"
import {
  getDefaultQuestionOptions,
  isChoiceQuestionType,
  isSubjectiveQuestionType,
  getNextQuestionOptionLabel,
  normalizeQuestionChoiceOptions,
} from "../utils/question"
import { uploadQuestionImage } from "../utils/upload"
import { QuestionRichTextEditor } from "./question-rich-text-editor"

type QuestionFormPageProps = {
  mode: "create" | "edit"
  questionId?: number
  title: string
  description: string
  submitLabel: string
  backHref: string
  lookups: {
    examTypes: QuestionLookupOption[]
    subjects: SubjectLookupOption[]
    topics: TopicLookupOption[]
  }
  initialValues?: QuestionDetails | null
}

function buildDefaultValues(initialValues?: QuestionDetails | null) {
  const type = initialValues?.type ?? "multiple_choice"
  const options =
    initialValues?.options?.length > 0
      ? type === "multiple_choice" || type === "multiple_answer"
        ? normalizeQuestionChoiceOptions(
            initialValues.options.map((option) => ({
              label: option.label,
              content: option.content,
              imageUrl: option.imageUrl ?? "",
              isCorrect: option.isCorrect,
            })),
          )
        : initialValues.options.map((option) => ({
            label: option.label,
            content: option.content,
            imageUrl: option.imageUrl ?? "",
            isCorrect: option.isCorrect,
          }))
      : getDefaultQuestionOptions(type)

  return {
    examTypeId: initialValues?.examTypeId ? String(initialValues.examTypeId) : "",
    subjectId: initialValues?.subjectId ? String(initialValues.subjectId) : "",
    topicId: initialValues?.topicId ? String(initialValues.topicId) : "",
    type,
    difficulty: initialValues?.difficulty ?? "medium",
    scoringRule: initialValues?.scoringRule ?? "",
    title: initialValues?.title ?? "",
    content: initialValues?.content ?? "<p></p>",
    imageUrl: initialValues?.imageUrl ?? "",
    correctAnswerText: initialValues?.correctAnswerText ?? "",
    gradingRubric: initialValues?.gradingRubric ?? "",
    manualExplanation: initialValues?.manualExplanation ?? "",
    aiExplanation: initialValues?.aiExplanation ?? "",
    year: initialValues?.year ? String(initialValues.year) : "",
    points: String(initialValues?.points ?? 1),
    status: initialValues?.status ?? "draft",
    options,
  }
}

function getQuestionTypeDescription(type: QuestionType) {
  if (type === "multiple_choice") {
    return "One correct answer."
  }

  if (type === "multiple_answer") {
    return "More than one correct answer."
  }

  if (type === "true_false") {
    return "The answer must be true or false."
  }

  if (type === "short_answer") {
    return "Best for concise free-text answers."
  }

  return "Best for short free-text answers."
}

function getStatusDescription(status: QuestionStatus) {
  if (status === "published") {
    return "Visible in the question bank."
  }

  if (status === "archived") {
    return "Kept for reference and hidden from the bank."
  }

  return "Saved as draft and hidden from the bank."
}

export function QuestionFormPage({
  mode,
  questionId,
  title,
  description,
  submitLabel,
  backHref,
  lookups,
  initialValues,
}: QuestionFormPageProps) {
  const router = useRouter()
  const formId = useId()
  const questionImageInputRef = useRef<HTMLInputElement | null>(null)
  const defaultValues = useMemo(() => buildDefaultValues(initialValues), [initialValues])

  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionFormSchema),
    defaultValues,
  })

  const { fields, replace, append } = useFieldArray({
    control: form.control,
    name: "options",
  })

  useEffect(() => {
    form.reset(defaultValues)
    replace(defaultValues.options)
  }, [defaultValues, form, replace])

  const watchedType = useWatch({
    control: form.control,
    name: "type",
  }) as QuestionType

  const watchedExamTypeId = useWatch({
    control: form.control,
    name: "examTypeId",
  })

  const watchedSubjectId = useWatch({
    control: form.control,
    name: "subjectId",
  })

  const watchedStatus = useWatch({
    control: form.control,
    name: "status",
  }) as QuestionStatus

  const watchedDifficulty = useWatch({
    control: form.control,
    name: "difficulty",
  }) as QuestionDifficulty

  const watchedCorrectAnswerText = useWatch({
    control: form.control,
    name: "correctAnswerText",
  })

  const watchedScoringRule = useWatch({
    control: form.control,
    name: "scoringRule",
  })

  const watchedTopicId = useWatch({
    control: form.control,
    name: "topicId",
  })

  const watchedImageUrl = useWatch({
    control: form.control,
    name: "imageUrl",
  })

  const selectedExamTypeId = Number(watchedExamTypeId || 0)
  const selectedSubjectId = Number(watchedSubjectId || 0)

  const filteredSubjects = lookups.subjects.filter(
    (subject) => subject.examTypeId === selectedExamTypeId,
  )

  const filteredTopics = lookups.topics.filter(
    (topic) => topic.subjectId === selectedSubjectId,
  )

  function handleAddChoiceOption() {
    const nextLabel = getNextQuestionOptionLabel(fields.length)

    if (!nextLabel) {
      return
    }

    append({
      label: nextLabel,
      content: "",
      imageUrl: "",
      isCorrect: false,
    })
  }

  function handleRemoveChoiceOption(index: number) {
    if (index < 2) {
      return
    }

    const nextOptions = form.getValues("options").filter((_, optionIndex) => optionIndex !== index)

    replace(normalizeQuestionChoiceOptions(nextOptions))
    form.clearErrors("options")
  }

  useEffect(() => {
    if (watchedType === "multiple_choice" || watchedType === "multiple_answer" || watchedType === "true_false") {
      if (fields.length === 0) {
        replace(getDefaultQuestionOptions(watchedType))
      }
      return
    }

    if (fields.length > 0) {
      replace([])
    }
  }, [fields.length, replace, watchedType])

  const rootError = form.formState.errors.root?.message

  const handleSubmit = form.handleSubmit(async (values) => {
    const result =
      mode === "create"
        ? await createQuestionAction(values)
        : await updateQuestionAction(questionId ?? 0, values)

    if (!result.success) {
      if (result.fieldErrors) {
        (Object.keys(result.fieldErrors) as Array<keyof QuestionFormValues>).forEach(
          (fieldName) => {
            const message = result.fieldErrors?.[fieldName]?.[0]

            if (message) {
              form.setError(fieldName, {
                type: "server",
                message,
              })
            }
          },
        )
      }

      if (result.message) {
        form.setError("root", {
          type: "server",
          message: result.message,
        })
        toast.error(result.message)
      }

      return
    }

    toast.success(mode === "create" ? "Question created." : "Question updated.")

    if (mode === "create") {
      router.replace(`/admin/questions/${result.data.id}/edit`)
      return
    }

    router.refresh()
  })

  return (
    <AdminFormPage
      title={title}
      subtitle={description}
      backHref={backHref}
      backLabel="Back to Questions"
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" asChild>
            <Link href={backHref}>Cancel</Link>
          </Button>
          <Button type="submit" form={formId} disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting
              ? mode === "create"
                ? "Creating..."
                : "Saving..."
              : submitLabel}
          </Button>
        </div>
      }
    >
      <form id={formId} onSubmit={handleSubmit}>
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Question Details</CardTitle>
              <CardDescription>
                Choose the taxonomy scope and publication settings first.
              </CardDescription>
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
                    <div className="flex flex-col gap-1.5">
                      <Select
                        value={watchedExamTypeId || ""}
                        onValueChange={(value) => {
                          form.setValue("examTypeId", value, { shouldDirty: true, shouldValidate: true })
                          form.setValue("subjectId", "", { shouldDirty: true, shouldValidate: true })
                          form.setValue("topicId", "", { shouldDirty: true, shouldValidate: true })
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
                        Select the exam family that owns this question.
                      </FieldDescription>
                      <FieldError>{form.formState.errors.examTypeId?.message}</FieldError>
                    </div>
                  </Field>

                  <Field data-invalid={Boolean(form.formState.errors.subjectId)}>
                    <FieldContent>
                      <FieldLabel htmlFor={`${formId}-subject`} className="required">
                        Subject
                      </FieldLabel>
                    </FieldContent>
                    <div className="flex flex-col gap-1.5">
                      <Select
                        value={watchedSubjectId || ""}
                        onValueChange={(value) => {
                          form.setValue("subjectId", value, { shouldDirty: true, shouldValidate: true })
                          form.setValue("topicId", "", { shouldDirty: true, shouldValidate: true })
                        }}
                        disabled={!selectedExamTypeId}
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
                      <FieldDescription>
                        Subjects are filtered by the selected exam type.
                      </FieldDescription>
                      <FieldError>{form.formState.errors.subjectId?.message}</FieldError>
                    </div>
                  </Field>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field data-invalid={Boolean(form.formState.errors.topicId)}>
                    <FieldContent>
                      <FieldLabel htmlFor={`${formId}-topic`}>
                        Topic
                      </FieldLabel>
                    </FieldContent>
                    <div className="flex flex-col gap-1.5">
                      <Select
                        value={watchedTopicId || "__none__"}
                        onValueChange={(value) =>
                          form.setValue("topicId", value === "__none__" ? "" : value, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                        disabled={!selectedSubjectId}
                      >
                        <SelectTrigger id={`${formId}-topic`}>
                          <SelectValue placeholder="Unassigned topic" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Unassigned topic</SelectItem>
                          {filteredTopics.map((topic) => (
                            <SelectItem key={topic.id} value={String(topic.id)}>
                              {topic.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldDescription>
                        Optional. Filter question lists and practice metadata.
                      </FieldDescription>
                      <FieldError>{form.formState.errors.topicId?.message}</FieldError>
                    </div>
                  </Field>

                  <Field data-invalid={Boolean(form.formState.errors.status)}>
                    <FieldContent>
                      <FieldLabel htmlFor={`${formId}-status`} className="required">
                        Status
                      </FieldLabel>
                    </FieldContent>
                    <div className="flex flex-col gap-1.5">
                      <Select
                        value={watchedStatus}
                        onValueChange={(value) =>
                          form.setValue("status", value as QuestionStatus, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                      >
                        <SelectTrigger id={`${formId}-status`}>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {questionStatusValues.map((status) => (
                            <SelectItem key={status} value={status}>
                              {questionStatusLabels[status]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldDescription>{getStatusDescription(watchedStatus)}</FieldDescription>
                      <FieldError>{form.formState.errors.status?.message}</FieldError>
                    </div>
                  </Field>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <Field data-invalid={Boolean(form.formState.errors.type)}>
                    <FieldContent>
                      <FieldLabel htmlFor={`${formId}-type`} className="required">
                        Question Type
                      </FieldLabel>
                    </FieldContent>
                    <div className="flex flex-col gap-1.5">
                      <Select
                        value={watchedType}
                        onValueChange={(value) => {
                          const nextType = value as QuestionType
                          form.setValue("type", nextType, { shouldDirty: true, shouldValidate: true })
                          form.setValue("options", getDefaultQuestionOptions(nextType), {
                            shouldDirty: true,
                            shouldValidate: true,
                          })

                          if (isSubjectiveQuestionType(nextType)) {
                            form.setValue("scoringRule", "", {
                              shouldDirty: true,
                              shouldValidate: true,
                            })
                          }

                          if (!isChoiceQuestionType(nextType)) {
                            form.setValue("correctAnswerText", "", {
                              shouldDirty: true,
                              shouldValidate: true,
                            })
                          }
                        }}
                      >
                        <SelectTrigger id={`${formId}-type`}>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {questionTypeValues.map((type) => (
                            <SelectItem key={type} value={type}>
                              {questionTypeLabels[type]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldDescription>{getQuestionTypeDescription(watchedType)}</FieldDescription>
                      <FieldError>{form.formState.errors.type?.message}</FieldError>
                    </div>
                  </Field>

                  <Field data-invalid={Boolean(form.formState.errors.difficulty)}>
                    <FieldContent>
                      <FieldLabel htmlFor={`${formId}-difficulty`} className="required">
                        Difficulty
                      </FieldLabel>
                    </FieldContent>
                    <div className="flex flex-col gap-1.5">
                      <Select
                        value={watchedDifficulty}
                        onValueChange={(value) =>
                          form.setValue("difficulty", value as QuestionDifficulty, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                      >
                        <SelectTrigger id={`${formId}-difficulty`}>
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                        <SelectContent>
                          {questionDifficultyValues.map((difficulty) => (
                            <SelectItem key={difficulty} value={difficulty}>
                              {questionDifficultyLabels[difficulty]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError>{form.formState.errors.difficulty?.message}</FieldError>
                    </div>
                  </Field>

                  <Field data-invalid={Boolean(form.formState.errors.points)}>
                    <FieldContent>
                      <FieldLabel htmlFor={`${formId}-points`} className="required">
                        Points
                      </FieldLabel>
                    </FieldContent>
                    <div className="flex flex-col gap-1.5">
                      <Input
                        id={`${formId}-points`}
                        type="number"
                        min="0.25"
                        step="0.25"
                        aria-invalid={Boolean(form.formState.errors.points)}
                        {...form.register("points")}
                      />
                      <FieldError>{form.formState.errors.points?.message}</FieldError>
                    </div>
                  </Field>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field data-invalid={Boolean(form.formState.errors.title)}>
                    <FieldContent>
                      <FieldLabel htmlFor={`${formId}-title`}>
                        Title
                      </FieldLabel>
                    </FieldContent>
                    <div className="flex flex-col gap-1.5">
                      <Input
                        id={`${formId}-title`}
                        placeholder="Question title"
                        aria-invalid={Boolean(form.formState.errors.title)}
                        {...form.register("title")}
                      />
                      <FieldDescription>
                        Optional internal title for admin readability.
                      </FieldDescription>
                      <FieldError>{form.formState.errors.title?.message}</FieldError>
                    </div>
                  </Field>

                  <Field data-invalid={Boolean(form.formState.errors.year)}>
                    <FieldContent>
                      <FieldLabel htmlFor={`${formId}-year`}>
                        Year
                      </FieldLabel>
                    </FieldContent>
                    <div className="flex flex-col gap-1.5">
                      <Input
                        id={`${formId}-year`}
                        placeholder="2025"
                        aria-invalid={Boolean(form.formState.errors.year)}
                        {...form.register("year")}
                      />
                      <FieldError>{form.formState.errors.year?.message}</FieldError>
                    </div>
                  </Field>
                </div>

                <Field data-invalid={Boolean(form.formState.errors.imageUrl)}>
                  <FieldContent>
                    <FieldLabel htmlFor={`${formId}-question-image`}>
                      Question Image
                    </FieldLabel>
                  </FieldContent>
                  <div className="flex flex-col gap-3">
                    <div className="mx-auto w-full max-w-sm">
                      {watchedImageUrl ? (
                        <Image
                          src={watchedImageUrl}
                          alt="Question image preview"
                          width={960}
                          height={540}
                          className="h-auto w-full rounded-xl border border-border/60 object-cover"
                        />
                      ) : (
                        <div className="flex aspect-video items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/30 text-sm text-muted-foreground">
                          No image selected.
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => questionImageInputRef.current?.click()}
                      >
                        <UploadIcon data-icon="inline-start" />
                        Upload Image
                      </Button>
                      {watchedImageUrl ? (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() =>
                            form.setValue("imageUrl", "", {
                              shouldDirty: true,
                              shouldValidate: true,
                            })
                          }
                        >
                          Remove
                        </Button>
                      ) : null}
                    </div>

                    <input
                      ref={questionImageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0]
                        event.target.value = ""

                        if (!file) {
                          return
                        }

                        void (async () => {
                          try {
                            const url = await uploadQuestionImage(file)

                            form.setValue("imageUrl", url, {
                              shouldDirty: true,
                              shouldValidate: true,
                            })
                          } catch (error) {
                            const message =
                              error instanceof Error
                                ? error.message
                                : "Failed to upload the question image."
                            toast.error(message)
                          }
                        })()
                      }}
                    />
                    <FieldDescription>
                      Optional cover image for the question stem.
                    </FieldDescription>
                    <FieldError>{form.formState.errors.imageUrl?.message}</FieldError>
                  </div>
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Question Content</CardTitle>
              <CardDescription>
                Compose the stem with rich text and inline image upload support.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Field data-invalid={Boolean(form.formState.errors.content)}>
                <FieldContent>
                  <FieldLabel htmlFor={`${formId}-content`} className="required">
                    Content
                  </FieldLabel>
                </FieldContent>
                <div className="flex flex-col gap-1.5">
                  <Controller
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <QuestionRichTextEditor value={field.value} onChange={field.onChange} />
                    )}
                  />
                  <FieldError>{form.formState.errors.content?.message}</FieldError>
                </div>
              </Field>
            </CardContent>
          </Card>

          {isChoiceQuestionType(watchedType) ? (
            <Card>
              <CardHeader>
                <CardTitle>Options</CardTitle>
                <CardDescription>
                  Manage the answer choices and mark the correct option(s).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  {watchedType === "true_false" ? (
                    <FieldSet>
                      <FieldLegend>True / False Choices</FieldLegend>
                      <div className="grid gap-4 md:grid-cols-2">
                        {fields.slice(0, 2).map((field, index) => (
                          <Field key={field.id}>
                            <FieldContent>
                              <FieldLabel className="required">{field.label}</FieldLabel>
                            </FieldContent>
                            <div className="flex flex-col gap-1.5">
                              <Input
                                placeholder={field.label}
                                {...form.register(`options.${index}.content` as const)}
                              />
                            </div>
                          </Field>
                        ))}
                      </div>
                      <Field data-invalid={Boolean(form.formState.errors.correctAnswerText)}>
                        <FieldContent>
                          <FieldLabel htmlFor={`${formId}-correct-answer`} className="required">
                            Correct Answer
                          </FieldLabel>
                        </FieldContent>
                        <div className="flex flex-col gap-1.5">
                          <Select
                            value={watchedCorrectAnswerText || ""}
                            onValueChange={(value) =>
                              form.setValue("correctAnswerText", value, {
                                shouldDirty: true,
                                shouldValidate: true,
                              })
                            }
                          >
                            <SelectTrigger id={`${formId}-correct-answer`}>
                              <SelectValue placeholder="Select true or false" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">True</SelectItem>
                              <SelectItem value="false">False</SelectItem>
                            </SelectContent>
                          </Select>
                          <FieldError>{form.formState.errors.correctAnswerText?.message}</FieldError>
                        </div>
                      </Field>
                    </FieldSet>
                  ) : (
                    <FieldSet>
                      <FieldLegend>Answer Choices</FieldLegend>
                      <div className="grid gap-4">
                        {fields.map((field, index) => (
                          <div
                            key={field.id}
                            className="rounded-xl border border-border/60 p-4"
                          >
                            <div className="mb-3 flex items-start justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{field.label}</Badge>
                                <span className="text-sm text-muted-foreground">
                                  Option {index + 1}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <label className="flex items-center gap-2 text-sm text-foreground">
                                  <input
                                    type="checkbox"
                                    className="size-4 rounded border-border text-primary focus:ring-primary"
                                    {...form.register(`options.${index}.isCorrect` as const)}
                                  />
                                  Correct
                                </label>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-sm"
                                  className="text-destructive hover:bg-destructive/10 hover:text-destructive disabled:text-muted-foreground disabled:hover:bg-transparent"
                                  onClick={() => handleRemoveChoiceOption(index)}
                                  disabled={index < 2}
                                  aria-label={`Remove option ${field.label}`}
                                >
                                  <Trash2Icon />
                                </Button>
                              </div>
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                              <Field>
                                <FieldContent>
                                  <FieldLabel className="required">Content</FieldLabel>
                                </FieldContent>
                                <div className="flex flex-col gap-1.5">
                                  <Textarea
                                    rows={4}
                                    placeholder={`Option ${field.label} content`}
                                    {...form.register(`options.${index}.content` as const)}
                                  />
                                </div>
                              </Field>

                              <Field>
                                <FieldContent>
                                  <FieldLabel>Image URL</FieldLabel>
                                </FieldContent>
                                <div className="flex flex-col gap-1.5">
                                  <Input
                                    placeholder="https://..."
                                    {...form.register(`options.${index}.imageUrl` as const)}
                                  />
                                </div>
                              </Field>
                            </div>
                          </div>
                        ))}
                      </div>
                      {fields.length < questionOptionMaxCount ? (
                        <div className="mt-4 flex justify-center">
                          <Button type="button" variant="outline" onClick={handleAddChoiceOption}>
                            <PlusIcon data-icon="inline-start" />
                            Tambah Opsi
                          </Button>
                        </div>
                      ) : null}
                    </FieldSet>
                  )}

                  <Field data-invalid={Boolean(form.formState.errors.scoringRule)}>
                    <FieldContent>
                      <FieldLabel htmlFor={`${formId}-scoring-rule`}>
                        Scoring Rule
                      </FieldLabel>
                    </FieldContent>
                    <div className="flex flex-col gap-1.5">
                      <Select
                        value={watchedScoringRule || "__none__"}
                        onValueChange={(value) =>
                          form.setValue("scoringRule", value === "__none__" ? "" : value, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                        disabled={watchedType !== "multiple_answer"}
                      >
                        <SelectTrigger id={`${formId}-scoring-rule`}>
                          <SelectValue placeholder="Optional" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Optional</SelectItem>
                          {questionScoringRuleValues.map((scoringRule) => (
                            <SelectItem key={scoringRule} value={scoringRule}>
                              {questionScoringRuleLabels[scoringRule]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldDescription>
                        Required only for multiple answer questions.
                      </FieldDescription>
                      <FieldError>{form.formState.errors.scoringRule?.message}</FieldError>
                    </div>
                  </Field>
                </FieldGroup>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Answer and Explanations</CardTitle>
              <CardDescription>
                Store the answer key, rubric, and explanation metadata.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field data-invalid={Boolean(form.formState.errors.correctAnswerText)}>
                  <FieldContent>
                    <FieldLabel htmlFor={`${formId}-correct-answer`}>
                      Correct Answer
                    </FieldLabel>
                  </FieldContent>
                  <div className="flex flex-col gap-1.5">
                    <Textarea
                      id={`${formId}-correct-answer`}
                      rows={4}
                      placeholder="Answer key or reference answer."
                      aria-invalid={Boolean(form.formState.errors.correctAnswerText)}
                      {...form.register("correctAnswerText")}
                    />
                    <FieldDescription>
                      Optional for subjective questions, required for true / false.
                    </FieldDescription>
                    <FieldError>{form.formState.errors.correctAnswerText?.message}</FieldError>
                  </div>
                </Field>

                <Field data-invalid={Boolean(form.formState.errors.gradingRubric)}>
                  <FieldContent>
                    <FieldLabel htmlFor={`${formId}-grading-rubric`}>
                      Grading Rubric
                    </FieldLabel>
                  </FieldContent>
                  <div className="flex flex-col gap-1.5">
                    <Textarea
                      id={`${formId}-grading-rubric`}
                      rows={5}
                      placeholder="Rubric or marking guidance."
                      {...form.register("gradingRubric")}
                    />
                    <FieldDescription>
                      Use this for short answers when subjective grading is needed.
                    </FieldDescription>
                    <FieldError>{form.formState.errors.gradingRubric?.message}</FieldError>
                  </div>
                </Field>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field data-invalid={Boolean(form.formState.errors.manualExplanation)}>
                    <FieldContent>
                      <FieldLabel htmlFor={`${formId}-manual-explanation`}>
                        Manual Explanation
                      </FieldLabel>
                    </FieldContent>
                    <div className="flex flex-col gap-1.5">
                      <Textarea
                        id={`${formId}-manual-explanation`}
                        rows={5}
                        placeholder="Manual explanation for reviewers."
                        {...form.register("manualExplanation")}
                      />
                      <FieldError>{form.formState.errors.manualExplanation?.message}</FieldError>
                    </div>
                  </Field>

                  <Field data-invalid={Boolean(form.formState.errors.aiExplanation)}>
                    <FieldContent>
                      <FieldLabel htmlFor={`${formId}-ai-explanation`}>
                        AI Explanation
                      </FieldLabel>
                    </FieldContent>
                    <div className="flex flex-col gap-1.5">
                      <Textarea
                        id={`${formId}-ai-explanation`}
                        rows={5}
                        placeholder="AI-generated explanation."
                        {...form.register("aiExplanation")}
                      />
                      <FieldError>{form.formState.errors.aiExplanation?.message}</FieldError>
                    </div>
                  </Field>
                </div>
              </FieldGroup>
            </CardContent>
          </Card>

        </div>
      </form>
    </AdminFormPage>
  )
}
