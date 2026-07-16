import { create } from "zustand"
import type { Booking } from "@/types"

interface BookingStore {
  bookings: (Booking & { id: string })[]
  loading: boolean
  setBookings: (bookings: (Booking & { id: string })[]) => void
  setLoading: (loading: boolean) => void
}

export const useBookingStore = create<BookingStore>((set) => ({
  bookings: [],
  loading: true,
  setBookings: (bookings) => set({ bookings }),
  setLoading: (loading) => set({ loading }),
}))
