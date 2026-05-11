"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import { SparklesIcon, ArrowLeftIcon } from "lucide-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/page-header"
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

import { generateQuestionDraftsAction, saveQuestionDraftsAction } from "../actions"
import {
  questionAiGenerateFormSchema,
  type QuestionAiGenerateFormValues,
  type QuestionFormValues,
} from "../schemas"
import {
  questionDifficultyLabels,
  questionDifficultyValues,
  questionStatusLabels,
  questionStatusValues,
  questionTypeLabels,
  questionTypeValues,
} from "../constants"
import type {
  QuestionLookupOption,
  SubjectLookupOption,
  TopicLookupOption,
} from "../queries"

type QuestionAiGeneratePageProps = {
  lookups: {
    examTypes: QuestionLookupOption[]
    subjects: SubjectLookupOption[]
    topics: TopicLookupOption[]
  }
}

function buildDefaultValues(): QuestionAiGenerateFormValues {
  return {
    examTypeId: "",
    subjectId: "",
    topicId: "",
    type: "multiple_choice",
    difficulty: "medium",
    questionCount: "3",
    prompt: "",
    points: "1",
    status: "draft",
  }
}

export function QuestionAiGeneratePage({ lookups }: QuestionAiGeneratePageProps) {
  const router = useRouter()
  const [generatedDrafts, setGeneratedDrafts] = useState<QuestionFormValues[]>([])
  const [isSaving, setIsSaving] = useState(false)

  const form = useForm<QuestionAiGenerateFormValues>({
    resolver: zodResolver(questionAiGenerateFormSchema),
    defaultValues: buildDefaultValues(),
  })

  const watchedExamTypeId = useWatch({
    control: form.control,
    name: "examTypeId",
  })
  const watchedSubjectId = useWatch({
    control: form.control,
    name: "subjectId",
  })
  const watchedTopicId = useWatch({
    control: form.control,
    name: "topicId",
  })
  const watchedStatus = useWatch({
    control: form.control,
    name: "status",
  })
  const watchedType = useWatch({
    control: form.control,
    name: "type",
  })
  const watchedDifficulty = useWatch({
    control: form.control,
    name: "difficulty",
  })

  const selectedExamTypeId = Number(watchedExamTypeId || 0)
  const selectedSubjectId = Number(watchedSubjectId || 0)

  const filteredSubjects = lookups.subjects.filter(
    (subject) => subject.examTypeId === selectedExamTypeId,
  )

  const filteredTopics = lookups.topics.filter(
    (topic) => topic.subjectId === selectedSubjectId,
  )

  const handleGenerate = form.handleSubmit(async (values) => {
    const result = await generateQuestionDraftsAction(values)

    if (!result.success) {
      if (result.fieldErrors) {
        (Object.keys(result.fieldErrors) as Array<keyof QuestionAiGenerateFormValues>).forEach(
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

    setGeneratedDrafts(result.data.drafts)
    toast.success(`Generated ${result.data.drafts.length} draft questions.`)
  })

  async function handleSaveGenerated() {
    if (!generatedDrafts.length) {
      toast.error("No generated drafts to save.")
      return
    }

    setIsSaving(true)

    try {
      const result = await saveQuestionDraftsAction(generatedDrafts)

      if (!result.success) {
        toast.error(result.message)
        return
      }

      toast.success(`Saved ${result.data.importedCount} questions.`)
      setGeneratedDrafts([])
      router.replace("/admin/questions")
      router.refresh()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save generated questions."
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="AI Generate Questions"
        subtitle="Generate draft questions from a prompt, review them, then save to the bank."
        actions={
          <Button asChild variant="outline">
            <Link href="/admin/questions">
              <ArrowLeftIcon data-icon="inline-start" />
              Back to Questions
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Prompt Settings</CardTitle>
            <CardDescription>
              The AI will return JSON drafts that follow the same structure as the question form.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-4" onSubmit={handleGenerate}>
              <FieldGroup>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field data-invalid={Boolean(form.formState.errors.examTypeId)}>
                    <FieldContent>
                      <FieldLabel className="required">Exam Type</FieldLabel>
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
                        <SelectTrigger>
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
                    </div>
                  </Field>

                  <Field data-invalid={Boolean(form.formState.errors.subjectId)}>
                    <FieldContent>
                      <FieldLabel className="required">Subject</FieldLabel>
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
                        <SelectTrigger>
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
                    </div>
                  </Field>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field>
                    <FieldContent>
                      <FieldLabel>Topic</FieldLabel>
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
                        <SelectTrigger>
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
                    </div>
                  </Field>

                  <Field data-invalid={Boolean(form.formState.errors.status)}>
                    <FieldContent>
                      <FieldLabel className="required">Status</FieldLabel>
                    </FieldContent>
                    <div className="flex flex-col gap-1.5">
                      <Select
                        value={watchedStatus}
                        onValueChange={(value) =>
                          form.setValue("status", value as QuestionAiGenerateFormValues["status"], {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                      >
                        <SelectTrigger>
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
                      <FieldError>{form.formState.errors.status?.message}</FieldError>
                    </div>
                  </Field>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <Field data-invalid={Boolean(form.formState.errors.type)}>
                    <FieldContent>
                      <FieldLabel className="required">Type</FieldLabel>
                    </FieldContent>
                    <div className="flex flex-col gap-1.5">
                      <Select
                        value={watchedType}
                        onValueChange={(value) =>
                          form.setValue("type", value as QuestionAiGenerateFormValues["type"], {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                      >
                        <SelectTrigger>
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
                      <FieldError>{form.formState.errors.type?.message}</FieldError>
                    </div>
                  </Field>

                  <Field data-invalid={Boolean(form.formState.errors.difficulty)}>
                    <FieldContent>
                      <FieldLabel className="required">Difficulty</FieldLabel>
                    </FieldContent>
                    <div className="flex flex-col gap-1.5">
                      <Select
                        value={watchedDifficulty}
                        onValueChange={(value) =>
                          form.setValue(
                            "difficulty",
                            value as QuestionAiGenerateFormValues["difficulty"],
                            {
                              shouldDirty: true,
                              shouldValidate: true,
                            },
                          )
                        }
                      >
                        <SelectTrigger>
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

                  <Field data-invalid={Boolean(form.formState.errors.questionCount)}>
                    <FieldContent>
                      <FieldLabel className="required">Count</FieldLabel>
                    </FieldContent>
                    <div className="flex flex-col gap-1.5">
                      <Input
                        type="number"
                        min="1"
                        max="20"
                        {...form.register("questionCount")}
                      />
                      <FieldError>{form.formState.errors.questionCount?.message}</FieldError>
                    </div>
                  </Field>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field data-invalid={Boolean(form.formState.errors.points)}>
                    <FieldContent>
                      <FieldLabel className="required">Points</FieldLabel>
                    </FieldContent>
                    <div className="flex flex-col gap-1.5">
                      <Input type="number" min="0.25" step="0.25" {...form.register("points")} />
                      <FieldError>{form.formState.errors.points?.message}</FieldError>
                    </div>
                  </Field>

                  <div />
                </div>

                <Field data-invalid={Boolean(form.formState.errors.prompt)}>
                  <FieldContent>
                    <FieldLabel className="required">Prompt</FieldLabel>
                  </FieldContent>
                  <div className="flex flex-col gap-1.5">
                    <Textarea
                      rows={6}
                      placeholder="Generate questions about algebraic inequalities with realistic UTBK style."
                      {...form.register("prompt")}
                    />
                    <FieldDescription>
                      Describe the pattern, topic emphasis, and difficulty you want.
                    </FieldDescription>
                    <FieldError>{form.formState.errors.prompt?.message}</FieldError>
                  </div>
                </Field>
              </FieldGroup>

              <Button type="submit" className="w-full">
                <SparklesIcon data-icon="inline-start" />
                Generate Draft Questions
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>
              Generated drafts appear here before saving to the database.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {generatedDrafts.length > 0 ? (
              <div className="flex flex-col gap-4">
                <div className="rounded-xl border border-border/60 p-4">
                  <p className="text-sm text-muted-foreground">Generated drafts</p>
                  <p className="mt-2 text-2xl font-semibold">{generatedDrafts.length}</p>
                </div>

                <div className="space-y-3">
                  {generatedDrafts.map((draft, index) => (
                    <div key={`${index}-${draft.title}`} className="rounded-xl border border-border/60 p-4">
                      <p className="text-sm font-medium text-foreground">
                        {draft.title || `Draft ${index + 1}`}
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {questionTypeLabels[draft.type]} / {questionDifficultyLabels[draft.difficulty]}
                      </p>
                      <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                        {draft.content.replace(/<[^>]+>/g, " ")}
                      </p>
                    </div>
                  ))}
                </div>

                <Button type="button" onClick={() => void handleSaveGenerated()} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Generated Questions"}
                </Button>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
                Generated drafts will appear here.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
