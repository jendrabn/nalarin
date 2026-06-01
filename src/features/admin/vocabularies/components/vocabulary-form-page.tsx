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

import { createVocabularyAction, updateVocabularyAction } from "../actions"
import {
  vocabularyDifficultyLabels,
  vocabularyDifficultyValues,
  vocabularyLanguageLabels,
  vocabularyLanguageValues,
  vocabularyStatusLabels,
  vocabularyStatusValues,
  vocabularyTypeLabels,
  vocabularyTypeValues,
} from "../constants"
import type { VocabularyDetails } from "../queries"
import { vocabularyFormSchema, type VocabularyFormValues } from "../schemas"

type VocabularyFormPageProps = {
  mode: "create" | "edit"
  vocabularyId?: number
  title: string
  description: string
  submitLabel: string
  backHref: string
  initialValues?: VocabularyDetails | null
}

function buildDefaultValues(initialValues?: VocabularyDetails | null): VocabularyFormValues {
  return {
    word: initialValues?.word ?? "",
    language: initialValues?.language ?? "id",
    difficulty: initialValues?.difficulty ?? "easy",
    type: initialValues?.type ?? "synonym",
    correctMeaning: initialValues?.correctMeaning ?? "",
    wrongOption: initialValues?.wrongOption ?? "",
    exampleSentence: initialValues?.exampleSentence ?? "",
    status: initialValues?.status ?? "draft",
  }
}

function statusDescription(status: VocabularyFormValues["status"]) {
  if (status === "published") {
    return "Visible in the game and available to all users."
  }

  if (status === "archived") {
    return "Hidden from the game but kept for future reference."
  }

  return "Saved as a draft and hidden from the game."
}

export function VocabularyFormPage({
  mode,
  vocabularyId,
  title,
  description,
  submitLabel,
  backHref,
  initialValues,
}: VocabularyFormPageProps) {
  const router = useRouter()
  const formId = useId()
  const defaultValues = useMemo(() => buildDefaultValues(initialValues), [initialValues])

  const form = useForm<VocabularyFormValues>({
    resolver: zodResolver(vocabularyFormSchema) as Resolver<VocabularyFormValues>,
    defaultValues,
  })

  useEffect(() => {
    form.reset(defaultValues)
  }, [defaultValues, form])

  const watchedLanguage = useWatch({ control: form.control, name: "language" })
  const watchedDifficulty = useWatch({ control: form.control, name: "difficulty" })
  const watchedType = useWatch({ control: form.control, name: "type" })
  const watchedStatus = useWatch({ control: form.control, name: "status" })

  const selectedLanguage = (watchedLanguage ?? "id") as VocabularyFormValues["language"]
  const selectedDifficulty = (watchedDifficulty ?? "easy") as VocabularyFormValues["difficulty"]
  const selectedType = (watchedType ?? "synonym") as VocabularyFormValues["type"]
  const selectedStatus = (watchedStatus ?? "draft") as VocabularyFormValues["status"]

  const isSubmitting = form.formState.isSubmitting
  const rootError = form.formState.errors.root?.message

  const handleSubmit = form.handleSubmit(async (values) => {
    const result =
      mode === "create"
        ? await createVocabularyAction(values)
        : await updateVocabularyAction(vocabularyId ?? 0, values)

    if (!result.success) {
      if (result.fieldErrors) {
        (Object.keys(result.fieldErrors) as Array<keyof VocabularyFormValues>).forEach(
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

    toast.success(mode === "create" ? "Vocabulary created." : "Vocabulary updated.")

    if (mode === "create") {
      router.replace(`/admin/vocabularies/${result.data.id}/edit`)
      return
    }

    router.refresh()
  })

  return (
    <AdminFormPage
      title={title}
      subtitle={description}
      backHref={backHref}
      backLabel="Back to Vocabulary"
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
              <CardTitle>Vocabulary Details</CardTitle>
              <CardDescription>
                Configure the vocabulary card, its metadata, and publication status.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Field data-invalid={Boolean(form.formState.errors.word)}>
                <FieldContent>
                  <FieldLabel htmlFor={`${formId}-word`} className="required">
                    Word
                  </FieldLabel>
                </FieldContent>
                <div className="flex flex-col gap-1.5">
                  <Input
                    id={`${formId}-word`}
                    placeholder="abstract"
                    aria-invalid={Boolean(form.formState.errors.word)}
                    {...form.register("word")}
                  />
                  <FieldDescription>
                    Keep the word short and clear for card-based review.
                  </FieldDescription>
                  <FieldError>{form.formState.errors.word?.message}</FieldError>
                </div>
              </Field>

              <div className="grid gap-4 lg:grid-cols-3">
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
                        form.setValue("language", value as VocabularyFormValues["language"], {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                    >
                      <SelectTrigger
                        id={`${formId}-language`}
                        className="w-full"
                        aria-invalid={Boolean(form.formState.errors.language)}
                      >
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        {vocabularyLanguageValues.map((value) => (
                          <SelectItem key={value} value={value}>
                            {vocabularyLanguageLabels[value]}
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
                        form.setValue("difficulty", value as VocabularyFormValues["difficulty"], {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                    >
                      <SelectTrigger
                        id={`${formId}-difficulty`}
                        className="w-full"
                        aria-invalid={Boolean(form.formState.errors.difficulty)}
                      >
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        {vocabularyDifficultyValues.map((value) => (
                          <SelectItem key={value} value={value}>
                            {vocabularyDifficultyLabels[value]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError>{form.formState.errors.difficulty?.message}</FieldError>
                  </div>
                </Field>

                <Field data-invalid={Boolean(form.formState.errors.type)}>
                  <FieldContent>
                    <FieldLabel htmlFor={`${formId}-type`} className="required">
                      Type
                    </FieldLabel>
                  </FieldContent>
                  <div className="flex flex-col gap-1.5">
                    <Select
                      value={selectedType}
                      onValueChange={(value) =>
                        form.setValue("type", value as VocabularyFormValues["type"], {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                    >
                      <SelectTrigger
                        id={`${formId}-type`}
                        className="w-full"
                        aria-invalid={Boolean(form.formState.errors.type)}
                      >
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {vocabularyTypeValues.map((value) => (
                          <SelectItem key={value} value={value}>
                            {vocabularyTypeLabels[value]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError>{form.formState.errors.type?.message}</FieldError>
                  </div>
                </Field>
              </div>

              <Field
                data-invalid={Boolean(form.formState.errors.status)}
                className="w-full lg:w-1/3"
              >
                <FieldContent>
                  <FieldLabel htmlFor={`${formId}-status`} className="required">
                    Status
                  </FieldLabel>
                </FieldContent>
                <div className="flex flex-col gap-1.5">
                  <Select
                    value={selectedStatus}
                    onValueChange={(value) =>
                      form.setValue("status", value as VocabularyFormValues["status"], {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  >
                    <SelectTrigger
                      id={`${formId}-status`}
                      className="w-full"
                      aria-invalid={Boolean(form.formState.errors.status)}
                    >
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {vocabularyStatusValues.map((value) => (
                        <SelectItem key={value} value={value}>
                          {vocabularyStatusLabels[value]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldDescription>{statusDescription(selectedStatus)}</FieldDescription>
                  <FieldError>{form.formState.errors.status?.message}</FieldError>
                </div>
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Correct Option & Wrong Option</CardTitle>
              <CardDescription>
                Add the correct option and one visible wrong option for the game.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 lg:grid-cols-2">
                <Field data-invalid={Boolean(form.formState.errors.correctMeaning)}>
                  <FieldContent>
                    <FieldLabel htmlFor={`${formId}-correctMeaning`} className="required">
                      Correct Option
                    </FieldLabel>
                  </FieldContent>
                  <div className="flex flex-col gap-1.5">
                    <Input
                      id={`${formId}-correctMeaning`}
                      placeholder="something intangible"
                      aria-invalid={Boolean(form.formState.errors.correctMeaning)}
                      {...form.register("correctMeaning")}
                    />
                    <FieldDescription>
                      This is the answer that should be remembered for the card.
                    </FieldDescription>
                    <FieldError>{form.formState.errors.correctMeaning?.message}</FieldError>
                  </div>
                </Field>

                <Field data-invalid={Boolean(form.formState.errors.wrongOption)}>
                  <FieldContent>
                    <FieldLabel htmlFor={`${formId}-wrongOption`} className="required">
                      Wrong Option
                    </FieldLabel>
                  </FieldContent>
                  <div className="flex flex-col gap-1.5">
                    <Input
                      id={`${formId}-wrongOption`}
                      placeholder="wrong meaning"
                      aria-invalid={Boolean(form.formState.errors.wrongOption)}
                      {...form.register("wrongOption")}
                    />
                    <FieldDescription>
                      This is the only wrong answer shown against the correct option.
                    </FieldDescription>
                    <FieldError>{form.formState.errors.wrongOption?.message}</FieldError>
                  </div>
                </Field>
              </div>

              <Field data-invalid={Boolean(form.formState.errors.exampleSentence)}>
                <FieldContent>
                  <FieldLabel htmlFor={`${formId}-exampleSentence`}>Example Sentence</FieldLabel>
                </FieldContent>
                <div className="flex flex-col gap-1.5">
                  <Input
                    id={`${formId}-exampleSentence`}
                    placeholder="Example sentence using the word in context."
                    aria-invalid={Boolean(form.formState.errors.exampleSentence)}
                    {...form.register("exampleSentence")}
                  />
                  <FieldDescription>Optional, but useful for language context.</FieldDescription>
                  <FieldError>{form.formState.errors.exampleSentence?.message}</FieldError>
                </div>
              </Field>
            </CardContent>
          </Card>
        </FieldGroup>
      </form>
    </AdminFormPage>
  )
}
