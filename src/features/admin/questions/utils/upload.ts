export async function uploadQuestionImage(file: File) {
  const formData = new FormData()
  formData.append("file", file)

  const response = await fetch("/api/admin/questions/uploads", {
    method: "POST",
    body: formData,
  })

  const payload = (await response.json().catch(() => null)) as
    | { url?: string; message?: string }
    | null

  if (!response.ok) {
    throw new Error(payload?.message ?? "Failed to upload the image.")
  }

  if (!payload?.url) {
    throw new Error("Image upload did not return a URL.")
  }

  return payload.url
}
