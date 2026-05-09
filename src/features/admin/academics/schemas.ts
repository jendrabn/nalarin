import { z } from "zod"

export const examTypeFormSchema = z.object({
  name: z.string().trim().min(2, "Exam type name is required.").max(100, "Exam type name is too long."),
  description: z.string().trim().max(1000, "Description is too long.").default(""),
})

export type ExamTypeFormValues = z.infer<typeof examTypeFormSchema>

export const subjectFormSchema = z.object({
  examTypeId: z.string().trim().min(1, "Select an exam type."),
  name: z.string().trim().min(2, "Subject name is required.").max(150, "Subject name is too long."),
  description: z.string().trim().max(1000, "Description is too long.").default(""),
})

export type SubjectFormValues = z.infer<typeof subjectFormSchema>

export const topicFormSchema = z.object({
  subjectId: z.string().trim().min(1, "Select a subject."),
  name: z.string().trim().min(2, "Topic name is required.").max(150, "Topic name is too long."),
  description: z.string().trim().max(1000, "Description is too long.").default(""),
})

export type TopicFormValues = z.infer<typeof topicFormSchema>

