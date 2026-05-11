import type { ReactNode } from "react"
import Link from "next/link"

import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"

type AdminFormPageProps = {
  title: string
  subtitle: string
  backHref: string
  backLabel: string
  children: ReactNode
  footer: ReactNode
}

export function AdminFormPage({
  title,
  subtitle,
  backHref,
  backLabel,
  children,
  footer,
}: AdminFormPageProps) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <Button asChild variant="outline">
            <Link href={backHref}>{backLabel}</Link>
          </Button>
        }
      />

      {children}
      {footer}
    </div>
  )
}
