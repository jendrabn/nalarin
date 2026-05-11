import { z } from "zod"

export const topicFormSchema = z.object({
  subjectId: z.string().trim().min(1, "Select a subject."),
  name: z.string().trim().min(2, "Topic name is required.").max(150, "Topic name is too long."),
  description: z.string().trim().max(1000, "Description is too long.").default(""),
})

export type TopicFormValues = z.infer<typeof topicFormSchema>
