export function getForwardedOrigin(headers: Headers, fallbackOrigin: string) {
  const forwardedHost = getFirstHeaderValue(headers, "x-forwarded-host")
  const host = forwardedHost ?? getFirstHeaderValue(headers, "host")

  if (!host) {
    return fallbackOrigin
  }

  const fallbackProtocol = new URL(fallbackOrigin).protocol.replace(":", "")
  const protocol =
    getFirstHeaderValue(headers, "x-forwarded-proto") ?? fallbackProtocol

  return `${protocol}://${host}`
}

function getFirstHeaderValue(headers: Headers, name: string) {
  return headers.get(name)?.split(",")[0]?.trim() || undefined
}
