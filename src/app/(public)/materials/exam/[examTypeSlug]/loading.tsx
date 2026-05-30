export default function Loading() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="flex flex-col">
        <section className="mx-auto w-full max-w-7xl px-4 pt-6 pb-1 sm:px-6 lg:px-8">
          <div className="space-y-3">
            <div className="h-4 w-32 animate-pulse rounded-full bg-muted" />
            <div className="h-10 w-full max-w-xl animate-pulse rounded-xl bg-muted/80" />
            <div className="h-5 w-full max-w-2xl animate-pulse rounded-full bg-muted/70" />
          </div>
        </section>

        <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pt-4 pb-8 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-10 w-28 animate-pulse rounded-full bg-muted/70"
              />
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start">
            <aside className="flex flex-col gap-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-12 animate-pulse rounded-full bg-muted/70" />
              ))}
            </aside>
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-60 animate-pulse rounded-lg border border-border/70 bg-card"
                />
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
