import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <main className="min-h-svh bg-muted/35">
      <header className="border-b bg-background">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-2 w-full" />
        </div>
      </header>
      <div className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[18rem_minmax(0,1fr)] lg:px-8">
        <Card>
          <CardContent className="grid grid-cols-5 gap-2 p-6">
            {Array.from({ length: 15 }).map((_, index) => (
              <Skeleton key={index} className="size-10 rounded-md" />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-col gap-3">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-6 w-64" />
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
