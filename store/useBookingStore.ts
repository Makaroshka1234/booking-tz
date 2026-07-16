import type { Booking } from "@/types"
import { createDataStore } from "@/store/createDataStore"

export const useBookingStore = createDataStore<(Booking & { id: string })[]>([])
