import type { Room } from "@/types"
import { createDataStore } from "@/store/createDataStore"

export const useRoomStore = createDataStore<(Room & { id: string })[]>([])
