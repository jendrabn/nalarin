import sanitizeHtml from "sanitize-html"

const ALLOWED_TEXT_ALIGN = [/^(left|center|right|justify)$/]

export function sanitizeEmailCampaignHtml(value: string) {
  return sanitizeHtml(value, {
    allowedTags: [
      "a",
      "blockquote",
      "br",
      "code",
      "em",
      "h1",
      "h2",
      "h3",
      "li",
      "mark",
      "ol",
      "p",
      "pre",
      "s",
      "span",
      "strong",
      "u",
      "ul",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      span: ["style"],
      p: ["style"],
      h1: ["style"],
      h2: ["style"],
      h3: ["style"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedStyles: {
      "*": {
        "text-align": ALLOWED_TEXT_ALIGN,
      },
    },
    transformTags: {
      a: (_tagName, attribs) => ({
        tagName: "a",
        attribs: {
          href: attribs.href ?? "",
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
    },
  }).trim()
}

export function emailHtmlToPlainText(html: string) {
  return sanitizeHtml(html, {
    allowedTags: [],
    allowedAttributes: {},
    textFilter: (text) => text.replace(/\s+/g, " "),
  })
    .replace(/\s+/g, " ")
    .trim()
}
