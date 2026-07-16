"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface RoomHeaderProps {
  name?: string
  description?: string
  isLoading: boolean
}

export function RoomHeader({ name, description, isLoading }: RoomHeaderProps) {
  if (isLoading) {
    return (
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/rooms">
            <Button variant="ghost">← Назад до кімнат</Button>
          </Link>
          <div className="space-y-2">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
        <Link href="/rooms">
          <Button variant="ghost">← Назад до кімнат</Button>
        </Link>
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold truncate">{name}</h1>
          {description && (
            <p className="text-muted-foreground text-sm mt-1">{description}</p>
          )}
        </div>
      </div>
    </div>
  )
}
