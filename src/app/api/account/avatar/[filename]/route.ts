import { readFile } from "node:fs/promises"
import { extname, join } from "node:path"

import { env } from "@/config/env"

export const runtime = "nodejs"

const AVATAR_CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
}

const AVATAR_FILENAME_PATTERN =
  /^avatar-\d+-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:jpg|jpeg|png)$/i

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params

  if (!AVATAR_FILENAME_PATTERN.test(filename)) {
    return new Response("Not found", { status: 404 })
  }

  const extension = extname(filename).toLowerCase()
  const contentType = AVATAR_CONTENT_TYPES[extension]

  if (!contentType) {
    return new Response("Not found", { status: 404 })
  }

  try {
    const file = await readFile(
      join(process.cwd(), env.FILE_STORAGE_PUBLIC_DIR, "avatars", filename),
    )

    return new Response(new Uint8Array(file), {
      headers: {
        "Cache-Control": "public, max-age=3600",
        "Content-Type": contentType,
      },
    })
  } catch {
    return new Response("Not found", { status: 404 })
  }
}
