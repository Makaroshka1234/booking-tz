"use client"

import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"
import { HeaderNav } from "./HeaderNav"
import { HeaderAuth } from "./HeaderAuth"

export function Header() {
  const { user, loading } = useAuth()

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="text-2xl font-bold bg-clip-text text-black bg-gradient-to-r from-primary to-primary/60">
                MeetingRoom
              </div>
            </Link>
            <HeaderNav isAuthenticated={!!user} />
          </div>
          <div className="flex items-center gap-4">
            <HeaderAuth user={user} loading={loading} />
          </div>
        </div>
      </div>
    </header>
  )
}
