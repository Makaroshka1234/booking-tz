import type { User } from "@/types"
import { createDataStore } from "@/store/createDataStore"

export const useAuthStore = createDataStore<User | null>(null)
