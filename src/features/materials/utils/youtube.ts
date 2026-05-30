export function extractYouTubeVideoId(url: string | null | undefined) {
  if (!url) {
    return null
  }

  const normalizedUrl = url.trim()

  if (!normalizedUrl) {
    return null
  }

  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&?/]+)/i,
    /(?:youtube\.com\/embed\/)([^&?/]+)/i,
    /(?:youtu\.be\/)([^&?/]+)/i,
    /(?:youtube\.com\/shorts\/)([^&?/]+)/i,
  ]

  for (const pattern of patterns) {
    const match = normalizedUrl.match(pattern)

    if (match?.[1]) {
      return match[1]
    }
  }

  try {
    const parsedUrl = new URL(normalizedUrl)
    const videoId = parsedUrl.searchParams.get("v")

    if (videoId) {
      return videoId
    }

    const pathParts = parsedUrl.pathname.split("/").filter(Boolean)
    const lastPart = pathParts[pathParts.length - 1]

    if (pathParts[0] === "embed" || pathParts[0] === "shorts" || pathParts[0] === "watch") {
      return lastPart ?? null
    }
  } catch {
    return null
  }

  return null
}

export function getYouTubeEmbedUrl(url: string | null | undefined) {
  const videoId = extractYouTubeVideoId(url)

  return videoId
    ? `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`
    : null
}
