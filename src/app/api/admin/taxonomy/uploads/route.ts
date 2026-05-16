import { randomUUID } from "node:crypto"
import { mkdir, writeFile } from "node:fs/promises"
import { join } from "node:path"

import { NextResponse } from "next/server"

import { getCurrentUser } from "@/features/auth/services/session"

const LOGO_MIME_EXTENSIONS: Record<string, string> = {
  "image/png": ".png",
  "image/svg+xml": ".svg",
}

const MAX_UPLOAD_SIZE = 2 * 1024 * 1024

export async function POST(request: Request) {
  const user = await getCurrentUser()

  if (!user || user.role !== "admin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
  }

  const formData = await request.formData()
  const file = formData.get("file")

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "No file uploaded." }, { status: 400 })
  }

  const extension = LOGO_MIME_EXTENSIONS[file.type]

  if (!extension) {
    return NextResponse.json(
      { message: "Only PNG or SVG logo files are allowed." },
      { status: 400 },
    )
  }

  if (file.size > MAX_UPLOAD_SIZE) {
    return NextResponse.json(
      { message: "Logo size must be 2 MB or smaller." },
      { status: 400 },
    )
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const filename = `taxonomy-${randomUUID()}${extension}`
  const uploadDirectory = join(process.cwd(), "public", "uploads", "taxonomy")
  const uploadPath = join(uploadDirectory, filename)

  await mkdir(uploadDirectory, { recursive: true })
  await writeFile(uploadPath, buffer)

  return NextResponse.json({
    url: `/uploads/taxonomy/${filename}`,
    filename,
  })
}
