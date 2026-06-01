import Image from "next/image"
import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type ExamTypeCardProps = {
  href: string
  logoUrl: string | null
  name: string
  description: string | null
  descriptionFallback: string
  count: number
  countLabel: string
  actionLabel: string
}

const EXAM_TYPE_PLACEHOLDER_IMAGE = "/images/placeholders/exam-type-logo.svg"

export function ExamTypeCard({
  href,
  logoUrl,
  name,
  description,
  descriptionFallback,
  count,
  countLabel,
  actionLabel,
}: ExamTypeCardProps) {
  const hasItems = count > 0

  return (
    <Link
      href={href}
      className="group block h-full rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Card className="flex h-full flex-col gap-0 overflow-hidden rounded-xl border border-border bg-card py-0 shadow-md shadow-foreground/5 ring-1 ring-border/50 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-primary/25 group-hover:shadow-lg group-hover:shadow-primary/10 group-hover:ring-primary/15">
        <CardHeader className="gap-4 px-4 pt-4 pb-0 sm:px-5 sm:pt-5">
          <div className="flex items-start justify-between gap-3">
            <ExamTypeLogo src={logoUrl} name={name} />
            <Badge
              variant="outline"
              size="sm"
              className={cn(
                "shrink-0 rounded-full text-[0.78rem] font-semibold tabular-nums",
                hasItems
                  ? "border-primary/20 bg-primary/8 text-primary"
                  : "border-border bg-secondary/70 text-muted-foreground",
              )}
            >
              {count} {countLabel}
            </Badge>
          </div>

          <div className="flex flex-col gap-2">
            <CardTitle className="line-clamp-2 text-[1rem] font-semibold leading-[1.45] text-foreground sm:text-[1.04rem]">
              {name}
            </CardTitle>
            <p className="line-clamp-3 text-[0.86rem] font-normal leading-[1.6] text-muted-foreground sm:text-[0.9rem]">
              {description ?? descriptionFallback}
            </p>
          </div>
        </CardHeader>

        <CardContent className="mt-auto flex flex-col px-4 pt-4 pb-4 sm:px-5 sm:pb-5">
          <Button
            asChild
            variant={hasItems ? "default" : "secondary"}
            size="xl"
            className={cn(
              "w-full font-semibold shadow-sm transition-all duration-200 group-hover:shadow-md",
              hasItems
                ? "group-hover:bg-primary/90"
                : "text-muted-foreground group-hover:bg-secondary/80",
            )}
          >
            <span>
              {actionLabel}
              <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
            </span>
          </Button>
        </CardContent>
      </Card>
    </Link>
  )
}

function ExamTypeLogo({ src, name }: { src: string | null; name: string }) {
  const imageSrc = src ?? EXAM_TYPE_PLACEHOLDER_IMAGE

  return (
    <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/70 bg-secondary/40 p-2 shadow-sm shadow-foreground/5">
      <Image
        src={imageSrc}
        alt={src ? `${name} logo` : ""}
        width={72}
        height={72}
        unoptimized
        className="size-full object-contain"
      />
    </span>
  )
}
