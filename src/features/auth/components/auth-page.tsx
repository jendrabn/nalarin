import { Suspense } from "react"

import { AuthEntryCard } from "@/features/auth/components/auth-entry-card"
import { AuthErrorToast } from "@/features/auth/components/auth-error-toast"

export function AuthPage() {
  return (
    <section className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-12">
      <div className="absolute inset-0 -z-10 bg-background" />
      <div className="absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(ellipse_at_top,var(--accent),transparent_64%)] opacity-45" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-72 bg-[linear-gradient(0deg,var(--secondary),transparent)] opacity-55" />
      <div className="absolute left-1/2 top-14 -z-10 h-32 w-[34rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      <AuthEntryCard />
      <Suspense fallback={null}>
        <AuthErrorToast />
      </Suspense>
    </section>
  )
}
