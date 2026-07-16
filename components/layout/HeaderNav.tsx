"use client"

import Link from "next/link"

interface HeaderNavProps {
  isAuthenticated: boolean
}

export function HeaderNav({ isAuthenticated }: HeaderNavProps) {
  if (!isAuthenticated) return null

  return (
    <nav className="hidden sm:flex items-center gap-6">
      <Link
        href="/rooms"
        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        Кімнати
      </Link>
    </nav>
  )
}
