import { randomUUID } from "node:crypto"
import { mkdir, writeFile } from "node:fs/promises"
import { join } from "node:path"

import { NextResponse } from "next/server"

import { getCurrentUser } from "@/features/auth/services/session"

const AVATAR_MIME_EXTENSIONS: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
}

const MAX_UPLOAD_SIZE = 2 * 1024 * 1024

export async function POST(request: Request) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get("file")

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Tidak ada file." }, { status: 400 })
  }

  const extension = AVATAR_MIME_EXTENSIONS[file.type]

  if (!extension) {
    return NextResponse.json(
      { message: "Format gambar harus PNG, JPG, atau JPEG." },
      { status: 400 },
    )
  }

  if (file.size > MAX_UPLOAD_SIZE) {
    return NextResponse.json(
      { message: "Ukuran gambar maksimal 2 MB." },
      { status: 400 },
    )
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const filename = `avatar-${user.id}-${randomUUID()}${extension}`
  const uploadDirectory = join(process.cwd(), "public", "uploads", "avatars")
  const uploadPath = join(uploadDirectory, filename)

  await mkdir(uploadDirectory, { recursive: true })
  await writeFile(uploadPath, buffer)

  return NextResponse.json({
    url: `/uploads/avatars/${filename}`,
    filename,
  })
}
