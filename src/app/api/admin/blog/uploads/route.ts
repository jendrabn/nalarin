import { mkdir, writeFile } from "node:fs/promises"
import { extname, join } from "node:path"
import { randomUUID } from "node:crypto"

import { NextResponse } from "next/server"

import { getCurrentUser } from "@/features/auth/services/session"

const IMAGE_MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
  "image/svg+xml": ".svg",
}

const MAX_UPLOAD_SIZE = 8 * 1024 * 1024

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

  if (!file.type.startsWith("image/")) {
    return NextResponse.json(
      { message: "Only image files are allowed." },
      { status: 400 },
    )
  }

  if (file.size > MAX_UPLOAD_SIZE) {
    return NextResponse.json(
      { message: "Image size must be 8 MB or smaller." },
      { status: 400 },
    )
  }

  const extension = IMAGE_MIME_EXTENSIONS[file.type] ?? extname(file.name) ?? ""

  if (!extension) {
    return NextResponse.json(
      { message: "Unsupported image type." },
      { status: 400 },
    )
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const filename = `blog-${randomUUID()}${extension}`
  const uploadDirectory = join(process.cwd(), "public", "uploads", "blog")
  const uploadPath = join(uploadDirectory, filename)

  await mkdir(uploadDirectory, { recursive: true })
  await writeFile(uploadPath, buffer)

  return NextResponse.json({
    url: `/uploads/blog/${filename}`,
    filename,
  })
}

