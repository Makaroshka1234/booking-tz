import { create } from "zustand"
import type { Room } from "@/types"

interface RoomStore {
  rooms: (Room & { id: string })[]
  loading: boolean
  setRooms: (rooms: (Room & { id: string })[]) => void
  setLoading: (loading: boolean) => void
}

export const useRoomStore = create<RoomStore>((set) => ({
  rooms: [],
  loading: true,
  setRooms: (rooms) => set({ rooms }),
  setLoading: (loading) => set({ loading }),
}))
