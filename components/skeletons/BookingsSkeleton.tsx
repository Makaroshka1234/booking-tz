import { Skeleton } from "@/components/ui/skeleton"

export function BookingsSkeleton() {
  return (
    <div className="grid gap-4">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="space-y-3 p-4 border border-border rounded-lg">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  )
}
