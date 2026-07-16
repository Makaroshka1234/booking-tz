import { Timestamp } from "firebase/firestore"

export interface Room {
  id: string
  name: string
  description: string
  createdBy: string
  createdAt: Timestamp
}
