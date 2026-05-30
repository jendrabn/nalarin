export default function Loading() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main>
        <section className="border-b bg-secondary/35">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
            <div className="h-5 w-40 animate-pulse rounded-full bg-muted/70" />
            <div className="h-12 w-full max-w-3xl animate-pulse rounded-xl bg-muted/80" />
            <div className="h-5 w-full max-w-2xl animate-pulse rounded-full bg-muted/70" />
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start">
            <div className="space-y-6">
              <div className="h-80 animate-pulse rounded-lg border border-border/70 bg-card" />
              <div className="h-96 animate-pulse rounded-lg border border-border/70 bg-card" />
            </div>
            <aside className="space-y-6">
              <div className="h-48 animate-pulse rounded-lg border border-border/70 bg-card" />
              <div className="h-40 animate-pulse rounded-lg border border-border/70 bg-card" />
            </aside>
          </div>
        </section>
      </main>
    </div>
  )
}
