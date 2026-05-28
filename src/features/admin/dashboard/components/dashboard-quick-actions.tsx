import Link from "next/link"
import { ArrowUpRightIcon } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type QuickAction = {
  title: string
  description: string
  href: string
  tone: "blue" | "cyan" | "indigo" | "emerald" | "amber" | "violet" | "sky"
}

const ACTIONS: QuickAction[] = [
  {
    title: "Create Question",
    description: "Add a new question with options, scoring, and explanation fields.",
    href: "/admin/questions/create",
    tone: "blue",
  },
  {
    title: "Import Questions Excel",
    description: "Upload a spreadsheet and review the import workspace before publishing.",
    href: "/admin/questions/import",
    tone: "cyan",
  },
  {
    title: "Create Practice",
    description: "Build a practice set with practice and quiz mode controls.",
    href: "/admin/practices/create",
    tone: "indigo",
  },
  {
    title: "Create Tryout",
    description: "Set up a multi-section tryout with schedule, ranking, and results rules.",
    href: "/admin/tryouts/create",
    tone: "violet",
  },
  {
    title: "Approve Pending Payments",
    description: "Review Midtrans and manual payments that are waiting for approval.",
    href: "/admin/payments",
    tone: "amber",
  },
  {
    title: "Manage Exam Packages",
    description: "Update package price, discount, quota, and premium access per exam type.",
    href: "/admin/exam-types",
    tone: "emerald",
  },
  {
    title: "Create Blog Post",
    description: "Publish an operational update, guide, or learning article.",
    href: "/admin/blog/create",
    tone: "sky",
  },
]

const TONE_STYLES: Record<
  QuickAction["tone"],
  {
    strip: string
  }
> = {
  blue: {
    strip: "from-sky-500/60 via-blue-500/50 to-indigo-500/50",
  },
  cyan: {
    strip: "from-cyan-500/60 via-sky-500/50 to-blue-500/50",
  },
  indigo: {
    strip: "from-indigo-500/60 via-blue-500/50 to-sky-500/50",
  },
  emerald: {
    strip: "from-emerald-500/60 via-cyan-500/50 to-sky-500/50",
  },
  amber: {
    strip: "from-amber-500/60 via-orange-500/50 to-rose-500/40",
  },
  violet: {
    strip: "from-violet-500/60 via-indigo-500/50 to-sky-500/50",
  },
  sky: {
    strip: "from-sky-500/60 via-cyan-500/50 to-sky-400/50",
  },
}

export function DashboardQuickActions() {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Quick actions</h2>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          Fast entry points for the most common admin workflows.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {ACTIONS.map((action) => {
          const styles = TONE_STYLES[action.tone]

          return (
            <Card
              key={action.href + action.title}
              className={cn(
                "group relative flex h-full flex-col overflow-hidden border border-border/70 bg-card/95 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg",
              )}
            >
              <div className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", styles.strip)} />
              <CardHeader className="space-y-1 pb-3">
                <CardTitle className="text-base font-semibold tracking-tight text-foreground">
                  {action.title}
                </CardTitle>
                <CardDescription className="text-sm leading-6 text-muted-foreground">
                  {action.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto pt-0">
                <Button asChild variant="outline" className="w-full justify-between">
                  <Link href={action.href}>
                    Open workflow
                    <ArrowUpRightIcon data-icon="inline-end" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
