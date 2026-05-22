import { z } from "zod"

import { getCurrentUser } from "@/features/auth/services/session"
import { generateAiExplanation } from "@/features/ai-explanations/services"

const aiExplanationRequestSchema = z.object({
  sessionType: z.enum(["practice", "tryout"]),
  sessionId: z.number().int().positive(),
  sessionQuestionId: z.number().int().positive(),
})

export async function POST(request: Request) {
  const user = await getCurrentUser()

  if (!user) {
    return Response.json({ message: "Silakan login ulang." }, { status: 401 })
  }

  let payload: unknown

  try {
    payload = await request.json()
  } catch {
    return Response.json({ message: "Payload tidak valid." }, { status: 400 })
  }

  const parsed = aiExplanationRequestSchema.safeParse(payload)

  if (!parsed.success) {
    return Response.json({ message: "Payload tidak valid." }, { status: 400 })
  }

  try {
    const result = await generateAiExplanation({
      userId: user.id,
      ...parsed.data,
    })

    if (!result.success) {
      return Response.json({ message: result.message }, { status: result.status })
    }

    return Response.json({ html: result.html })
  } catch (error) {
    console.error("AI explanation failed:", error)

    return Response.json(
      { message: "Pembahasan AI belum bisa dibuat. Coba lagi sebentar lagi." },
      { status: 502 },
    )
  }
}
