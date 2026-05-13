export const BLOG_PAGE_SIZE = 10;
export const SITE_URL = "https://nalarin.id";

export function absoluteUrl(path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return new URL(path, SITE_URL).toString();
}

export function formatBlogDate(value: Date | string | number | null | undefined) {
  if (!value) {
    return "Belum dipublikasikan";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Belum dipublikasikan";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function getSingleSearchParam(
  value: string | string[] | undefined,
  fallback = "",
) {
  if (Array.isArray(value)) {
    return value[0]?.trim() ?? fallback;
  }

  return value?.trim() ?? fallback;
}

export function normalizePageParam(value: string | string[] | undefined) {
  const rawPage = getSingleSearchParam(value, "1");
  const page = Number.parseInt(rawPage, 10);

  if (!Number.isFinite(page) || page < 1) {
    return 1;
  }

  return page;
}

export function stripHtml(value: string) {
  return value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1).trim()}...`;
}

export function jsonLdScript(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function isLocalImageUrl(value: string | null | undefined) {
  return Boolean(value?.startsWith("/"));
}
