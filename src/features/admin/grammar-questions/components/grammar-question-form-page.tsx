"use client"

import Link from "next/link"
import { useEffect, useId, useMemo } from "react"
import { useRouter } from "next/navigation"
import { type Resolver, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { AdminFormPage } from "@/components/admin-form-page"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

import { createGrammarQuestionAction, updateGrammarQuestionAction } from "../actions"
import {
  grammarQuestionDifficultyLabels,
  grammarQuestionDifficultyValues,
  grammarQuestionLanguageLabels,
  grammarQuestionLanguageValues,
  grammarQuestionStatusLabels,
  grammarQuestionStatusValues,
} from "../constants"
import type { GrammarQuestionDetails } from "../queries"
import { grammarQuestionFormSchema, type GrammarQuestionFormValues } from "../schemas"
import { parseGrammarSentenceTemplate } from "@/features/grammar-game/utils"

type GrammarQuestionFormPageProps = {
  mode: "create" | "edit"
  questionId?: number
  title: string
  description: string
  submitLabel: string
  backHref: string
  initialValues?: GrammarQuestionDetails | null
}

const answerFieldNames = ["answer1", "answer2", "answer3", "answer4", "answer5"] as const

function buildDefaultValues(initialValues?: GrammarQuestionDetails | null): GrammarQuestionFormValues {
  return {
    sentenceTemplate: initialValues?.sentenceTemplate ?? "",
    language: initialValues?.language ?? "id",
    difficulty: initialValues?.difficulty ?? "easy",
    category: initialValues?.category ?? "",
    answer1: initialValues?.answers.find((entry) => entry.order === 1)?.answer ?? "",
    answer2: initialValues?.answers.find((entry) => entry.order === 2)?.answer ?? "",
    answer3: initialValues?.answers.find((entry) => entry.order === 3)?.answer ?? "",
    answer4: initialValues?.answers.find((entry) => entry.order === 4)?.answer ?? "",
    answer5: initialValues?.answers.find((entry) => entry.order === 5)?.answer ?? "",
    distractor1: initialValues?.distractors[0] ?? "",
    distractor2: initialValues?.distractors[1] ?? "",
    distractor3: initialValues?.distractors[2] ?? "",
    status: initialValues?.status ?? "draft",
  }
}

export function GrammarQuestionFormPage({
  mode,
  questionId,
  title,
  description,
  submitLabel,
  backHref,
  initialValues,
}: GrammarQuestionFormPageProps) {
  const router = useRouter()
  const formId = useId()
  const defaultValues = useMemo(() => buildDefaultValues(initialValues), [initialValues])

  const form = useForm<GrammarQuestionFormValues>({
    resolver: zodResolver(grammarQuestionFormSchema) as Resolver<GrammarQuestionFormValues>,
    defaultValues,
  })

  useEffect(() => {
    form.reset(defaultValues)
  }, [defaultValues, form])

  const watchedSentenceTemplate = useWatch({
    control: form.control,
    name: "sentenceTemplate",
  })
  const watchedLanguage = useWatch({
    control: form.control,
    name: "language",
  })
  const watchedDifficulty = useWatch({
    control: form.control,
    name: "difficulty",
  })
  const watchedStatus = useWatch({
    control: form.control,
    name: "status",
  })

  const parsedTemplate = useMemo(
    () => parseGrammarSentenceTemplate(watchedSentenceTemplate ?? ""),
    [watchedSentenceTemplate],
  )

  useEffect(() => {
    const activeOrders = new Set(parsedTemplate.placeholderOrders)

    answerFieldNames.forEach((fieldName, index) => {
      const order = index + 1
      const currentValue = form.getValues(fieldName)

      if (!activeOrders.has(order) && currentValue.trim().length > 0) {
        form.setValue(fieldName, "", {
          shouldDirty: true,
          shouldValidate: true,
        })
      }
    })
  }, [form, parsedTemplate.placeholderOrders])

  const selectedLanguage = (watchedLanguage ?? "id") as GrammarQuestionFormValues["language"]
  const selectedDifficulty = (watchedDifficulty ?? "easy") as GrammarQuestionFormValues["difficulty"]
  const selectedStatus = (watchedStatus ?? "draft") as GrammarQuestionFormValues["status"]

  const isSubmitting = form.formState.isSubmitting
  const rootError = form.formState.errors.root?.message

  const handleSubmit = form.handleSubmit(async (values) => {
    const result =
      mode === "create"
        ? await createGrammarQuestionAction(values)
        : await updateGrammarQuestionAction(questionId ?? 0, values)

    if (!result.success) {
      if (result.fieldErrors) {
        (Object.keys(result.fieldErrors) as Array<keyof GrammarQuestionFormValues>).forEach(
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

    toast.success(mode === "create" ? "Grammar question created." : "Grammar question updated.")

    if (mode === "create") {
      router.replace(`/admin/grammar/${result.data.id}/edit`)
      return
    }

    router.refresh()
  })

  return (
    <AdminFormPage
      title={title}
      subtitle={description}
      backHref={backHref}
      backLabel="Back to Grammar"
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" asChild>
            <Link href={backHref}>Cancel</Link>
          </Button>
          <Button type="submit" form={formId} disabled={isSubmitting}>
            {isSubmitting ? (mode === "create" ? "Creating..." : "Saving...") : submitLabel}
          </Button>
        </div>
      }
    >
      <form id={formId} onSubmit={handleSubmit}>
        <FieldGroup className="gap-6">
          {rootError ? (
            <p className="text-sm text-destructive" aria-live="polite">
              {rootError}
            </p>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Question Setup</CardTitle>
              <CardDescription>
                Type a sentence with placeholders like <span className="font-medium">{"{{ 1 }}"}</span> and fill the answers below.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Field data-invalid={Boolean(form.formState.errors.sentenceTemplate)}>
                <FieldContent>
                  <FieldLabel htmlFor={`${formId}-sentence-template`} className="required">
                    Sentence Template
                  </FieldLabel>
                </FieldContent>
                <div className="flex flex-col gap-1.5">
                  <Textarea
                    id={`${formId}-sentence-template`}
                    rows={6}
                    placeholder="She {{ 1 }} to school every day and {{ 2 }} her homework at night."
                    aria-invalid={Boolean(form.formState.errors.sentenceTemplate)}
                    {...form.register("sentenceTemplate")}
                  />
                  <FieldDescription>
                    Use consecutive placeholders starting from {"{{ 1 }}"}.
                    Maximum five blanks.
                  </FieldDescription>
                  <FieldError>{form.formState.errors.sentenceTemplate?.message}</FieldError>
                </div>
              </Field>

              <div className="grid gap-4 md:grid-cols-3">
                <Field data-invalid={Boolean(form.formState.errors.language)}>
                  <FieldContent>
                    <FieldLabel htmlFor={`${formId}-language`} className="required">
                      Language
                    </FieldLabel>
                  </FieldContent>
                  <div className="flex flex-col gap-1.5">
                    <Select
                      value={selectedLanguage}
                      onValueChange={(value) =>
                        form.setValue("language", value as GrammarQuestionFormValues["language"], {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                    >
                      <SelectTrigger
                        id={`${formId}-language`}
                        aria-invalid={Boolean(form.formState.errors.language)}
                      >
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        {grammarQuestionLanguageValues.map((value) => (
                          <SelectItem key={value} value={value}>
                            {grammarQuestionLanguageLabels[value]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError>{form.formState.errors.language?.message}</FieldError>
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
                      value={selectedDifficulty}
                      onValueChange={(value) =>
                        form.setValue("difficulty", value as GrammarQuestionFormValues["difficulty"], {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                    >
                      <SelectTrigger
                        id={`${formId}-difficulty`}
                        aria-invalid={Boolean(form.formState.errors.difficulty)}
                      >
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        {grammarQuestionDifficultyValues.map((value) => (
                          <SelectItem key={value} value={value}>
                            {grammarQuestionDifficultyLabels[value]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError>{form.formState.errors.difficulty?.message}</FieldError>
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
                      value={selectedStatus}
                      onValueChange={(value) =>
                        form.setValue("status", value as GrammarQuestionFormValues["status"], {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                    >
                      <SelectTrigger
                        id={`${formId}-status`}
                        aria-invalid={Boolean(form.formState.errors.status)}
                      >
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {grammarQuestionStatusValues.map((value) => (
                          <SelectItem key={value} value={value}>
                            {grammarQuestionStatusLabels[value]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError>{form.formState.errors.status?.message}</FieldError>
                  </div>
                </Field>
              </div>

              <Field
                data-invalid={Boolean(form.formState.errors.category)}
                className="md:max-w-md"
              >
                <FieldContent>
                  <FieldLabel htmlFor={`${formId}-category`}>Category</FieldLabel>
                </FieldContent>
                <div className="flex flex-col gap-1.5">
                  <Input
                    id={`${formId}-category`}
                    placeholder="Simple Present"
                    aria-invalid={Boolean(form.formState.errors.category)}
                    {...form.register("category")}
                  />
                  <FieldDescription>
                    Optional free text used as a filter in the public game.
                  </FieldDescription>
                  <FieldError>{form.formState.errors.category?.message}</FieldError>
                </div>
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Answers</CardTitle>
              <CardDescription>
                Fill the answers in the same order as the placeholders in the sentence template.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {parsedTemplate.placeholderOrders.length > 0 ? (
                parsedTemplate.placeholderOrders.map((order) => {
                  const fieldName = answerFieldNames[(order - 1) as 0 | 1 | 2 | 3 | 4]

                  return (
                    <Field key={order} data-invalid={Boolean(form.formState.errors[fieldName])}>
                      <FieldContent>
                        <FieldLabel htmlFor={`${formId}-answer-${order}`} className="required">
                          {`Jawaban blank {{ ${order} }}`}
                        </FieldLabel>
                      </FieldContent>
                      <div className="flex flex-col gap-1.5">
                        <Input
                          id={`${formId}-answer-${order}`}
                          placeholder={`Answer for blank {{ ${order} }}`}
                          aria-invalid={Boolean(form.formState.errors[fieldName])}
                          {...form.register(fieldName)}
                        />
                        <FieldError>{form.formState.errors[fieldName]?.message}</FieldError>
                      </div>
                    </Field>
                  )
                })
              ) : (
                <p className="text-sm text-muted-foreground">
                  Add placeholders in the sentence template to reveal answer fields.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distractors</CardTitle>
              <CardDescription>
                Add at least one wrong option so the game pool has plausible distractors.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {([1, 2, 3] as const).map((index) => (
                <Field
                  key={index}
                  data-invalid={Boolean(
                    form.formState.errors[`distractor${index}` as keyof GrammarQuestionFormValues],
                  )}
                >
                  <FieldContent>
                    <FieldLabel htmlFor={`${formId}-distractor-${index}`}>
                      Distractor {index}
                    </FieldLabel>
                  </FieldContent>
                  <div className="flex flex-col gap-1.5">
                    <Input
                      id={`${formId}-distractor-${index}`}
                      placeholder={`Wrong option ${index}`}
                      aria-invalid={Boolean(
                        form.formState.errors[`distractor${index}` as keyof GrammarQuestionFormValues],
                      )}
                      {...form.register(`distractor${index}` as const)}
                    />
                    <FieldError>
                      {
                        form.formState.errors[`distractor${index}` as keyof GrammarQuestionFormValues]
                          ?.message
                      }
                    </FieldError>
                  </div>
                </Field>
              ))}
            </CardContent>
          </Card>

        </FieldGroup>
      </form>
    </AdminFormPage>
  )
}
