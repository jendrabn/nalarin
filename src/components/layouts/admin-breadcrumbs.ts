export type AdminBreadcrumbItem = {
  label: string
  href?: string
}

const adminRouteLabels: Record<string, string> = {
  admin: "Dashboard",
  users: "Users",
  create: "Create",
  edit: "Edit",
  blog: "Blog",
  "blog-categories": "Blog Categories",
  "exam-types": "Exam Types",
  practice: "Practice",
  tryout: "Tryout",
  payments: "Payments",
  practices: "Practices",
  questions: "Questions",
  import: "Import",
  preview: "Preview",
  "practice-sessions": "Practice Sessions",
  subjects: "Subjects",
  subscribers: "Subscribers",
  topics: "Topics",
  tryouts: "Tryouts",
  sections: "Sections",
  sessions: "Sessions",
  results: "Results & Analytics",
  analytics: "Analytics",
}

function isDynamicSegment(segment: string) {
  return /^\d+$/.test(segment) || /^[a-z0-9]{12,}$/i.test(segment)
}

function formatSegmentLabel(segment: string) {
  if (adminRouteLabels[segment]) {
    return adminRouteLabels[segment]
  }

  if (isDynamicSegment(segment)) {
    return "Detail"
  }

  return segment
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export function getAdminBreadcrumbs(pathname: string): AdminBreadcrumbItem[] {
  const segments = pathname.split("/").filter(Boolean)
  const adminIndex = segments.indexOf("admin")
  const relevantSegments =
    adminIndex >= 0 ? segments.slice(adminIndex) : ["admin"]

  if (relevantSegments.length === 0) {
    return [{ label: "Dashboard", href: "/admin" }]
  }

  return relevantSegments.map((segment, index) => {
    const href = `/${relevantSegments.slice(0, index + 1).join("/")}`
    const isLast = index === relevantSegments.length - 1

    return {
      label: formatSegmentLabel(segment),
      href: index === 0 ? "/admin" : isLast ? undefined : href,
    }
  })
}
