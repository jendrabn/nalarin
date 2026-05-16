import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <main className="min-h-svh bg-muted/35">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
        <Card>
          <CardHeader className="flex flex-col gap-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-8 w-full max-w-xl" />
            <Skeleton className="h-4 w-full max-w-2xl" />
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-20 rounded-xl" />
            ))}
          </CardContent>
        </Card>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <Card>
            <CardContent className="flex flex-col gap-3 p-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-24 rounded-xl" />
              ))}
            </CardContent>
          </Card>
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    </main>
  )
}
