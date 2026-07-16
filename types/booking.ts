import { Timestamp } from "firebase/firestore"

export interface Booking {
  id: string
  roomId: string
  title: string
  description?: string
  startTime: Timestamp
  endTime: Timestamp
  createdBy: string
  participants: string[]
  createdAt: Timestamp
}
