import { Loader2Icon } from "lucide-react"

export default function Loading() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/35 px-4">
      <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-3 text-sm font-medium shadow-sm">
        <Loader2Icon className="size-4 animate-spin text-primary" />
        Menyiapkan ruang latihan...
      </div>
    </main>
  )
}
