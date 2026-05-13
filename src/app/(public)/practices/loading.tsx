import { SiteFooter } from "@/components/site-footer"
import { SiteNavbar } from "@/components/site-navbar"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNavbar user={null} />
      <main>
        <section className="border-b bg-[linear-gradient(180deg,color-mix(in_oklab,var(--secondary)_62%,transparent),transparent)]">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-1.5 rounded-full" />
              <Skeleton className="h-8 w-44 max-w-full" />
            </div>
            <div className="flex rounded-lg border bg-card p-1 shadow-sm lg:max-w-[68%]">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-9 w-28 rounded-md" />
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[18.5rem_minmax(0,1fr)] lg:px-8">
          <div className="rounded-xl border bg-card p-3 shadow-sm">
            <Skeleton className="mx-2 h-4 w-32" />
            <Skeleton className="mx-2 mt-2 h-6 w-40" />
            <div className="mt-4 flex gap-2 overflow-hidden lg:flex-col">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-14 min-w-48 rounded-lg lg:min-w-0" />
              ))}
            </div>
          </div>

          <div className="min-w-0 space-y-6">
            <Skeleton className="h-5 w-72 max-w-full" />
            <div className="space-y-3">
              <Skeleton className="h-6 w-24" />
              <div className="flex gap-3 overflow-hidden">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-24 min-w-52 rounded-xl" />
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-72 rounded-xl" />
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
