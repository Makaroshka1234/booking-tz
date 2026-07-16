"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { logoutUser } from "@/lib/auth"
import type { User } from "@/types"

interface HeaderAuthProps {
  user: User | null
  loading: boolean
}

export function HeaderAuth({ user, loading }: HeaderAuthProps) {
  const router = useRouter()

  if (loading) {
    return <div className="h-10 w-20 bg-muted rounded animate-pulse" />
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/login">
          <Button variant="ghost" size="sm">
            Вхід
          </Button>
        </Link>
        <Link href="/register">
          <Button size="sm">Реєстрація</Button>
        </Link>
      </div>
    )
  }

  const handleLogout = async () => {
    try {
      await logoutUser()
      toast.success("✓ Ви успішно вийшли з аккаунту")
      router.push("/login")
    } catch (error) {
      toast.error("✕ Помилка при виході")
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
            {user.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <span className="hidden sm:inline max-w-[100px] truncate">
            {user.name || user.email}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-white">
        <div className="px-2 py-1.5 text-sm">
          <div className="font-semibold">{user.name}</div>
          <div className="text-xs text-muted-foreground">{user.email}</div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/rooms">Мої кімнати</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <span className="text-red-600">Вийти</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
