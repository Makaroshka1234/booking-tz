"use client"

import { useAuthStore } from "@/store/useAuthStore"

export function useAuth() {
  const { data, loading } = useAuthStore()
  return { user: data, loading }
}
