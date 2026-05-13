export function slugify(value: string) {
  const slug = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

  return slug || "category"
}

const SLUG_SUFFIX_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"

export function generateStrongSlugSuffix(length = 5) {
  if (length <= 0) {
    return ""
  }

  const cryptoApi = globalThis.crypto

  if (!cryptoApi?.getRandomValues) {
    throw new Error("Crypto API is unavailable.")
  }

  const maxValidByte = Math.floor(256 / SLUG_SUFFIX_ALPHABET.length) * SLUG_SUFFIX_ALPHABET.length
  let suffix = ""

  while (suffix.length < length) {
    const bytes = new Uint8Array(length * 2)
    cryptoApi.getRandomValues(bytes)

    for (const byte of bytes) {
      if (byte >= maxValidByte) {
        continue
      }

      suffix += SLUG_SUFFIX_ALPHABET[byte % SLUG_SUFFIX_ALPHABET.length]

      if (suffix.length === length) {
        break
      }
    }
  }

  return suffix
}

export function extractSlugSuffix(slug: string) {
  const normalized = slug.trim()
  const parts = normalized.split("-")
  const suffix = parts.at(-1)

  if (!suffix || suffix.length !== 5 || !/^[A-Za-z0-9]{5}$/.test(suffix)) {
    return null
  }

  return suffix
}
