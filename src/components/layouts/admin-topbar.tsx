"use client"

import { Fragment } from "react"
import Link from "next/link"

import type { AdminBreadcrumbItem } from "@/components/layouts/admin-breadcrumbs"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

type AdminTopbarProps = {
  breadcrumbs: AdminBreadcrumbItem[]
}

export function AdminTopbar({ breadcrumbs }: AdminTopbarProps) {
  return (
    <header className="sticky top-0 flex h-14 shrink-0 items-center justify-between border-b border-border/80 bg-background/86 px-4 backdrop-blur-xl supports-[backdrop-filter]:bg-background/72">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger aria-label="Toggle sidebar admin" />
        <Separator
          orientation="vertical"
          className="mx-2 data-vertical:h-4 data-vertical:self-center"
        />
        <Breadcrumb>
          <BreadcrumbList className="flex-nowrap gap-1 text-xs sm:text-sm">
            {breadcrumbs.map((item, index) => {
              const isLast = index === breadcrumbs.length - 1

              return (
                <Fragment key={`${item.label}-${index}`}>
                  <BreadcrumbItem>
                    {item.href && !isLast ? (
                      <BreadcrumbLink asChild>
                        <Link href={item.href}>{item.label}</Link>
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage className="max-w-38 truncate sm:max-w-none">
                        {item.label}
                      </BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                  {!isLast ? <BreadcrumbSeparator /> : null}
                </Fragment>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <ThemeToggle />
    </header>
  )
}
