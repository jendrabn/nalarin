import { ErrorPageActions } from "@/components/error-page-actions"
import { cn } from "@/lib/utils"

type ErrorPageStateProps = {
  code: string
  title: string
  description: string
  tone?: "primary" | "destructive"
}

export function ErrorPageState({
  code,
  title,
  description,
  tone = "primary",
}: ErrorPageStateProps) {
  const titleId = `error-title-${code}`

  return (
    <main
      aria-labelledby={titleId}
      className="flex min-h-screen items-center justify-center bg-background px-4 py-12 text-center text-foreground sm:px-6 lg:px-8"
    >
      <section className="mx-auto w-full max-w-[42rem]">
        <p
          aria-label={`Kode HTTP ${code}`}
          className="font-heading text-[7.5rem] font-black leading-[0.86] tracking-normal text-primary sm:text-[10rem] lg:text-[11rem]"
        >
          {code}
        </p>
        <div
          aria-hidden="true"
          className={cn(
            "mx-auto mt-7 h-1 w-12 rounded-full",
            tone === "destructive" ? "bg-destructive" : "bg-primary"
          )}
        />
        <h1
          id={titleId}
          className="mx-auto mt-8 max-w-xl text-balance font-heading text-3xl font-black leading-tight sm:text-4xl"
        >
          {title}
        </h1>
        <p className="mx-auto mt-4 max-w-md text-pretty text-base leading-7 text-muted-foreground">
          {description}
        </p>
        <ErrorPageActions />
      </section>
    </main>
  )
}
