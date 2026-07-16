import { Timestamp } from "firebase/firestore"

export interface User {
  uid: string
  name: string
  email: string
  createdAt: Timestamp
}

export interface Room {
  id: string
  name: string
  description: string
  createdBy: string // uid
  createdAt: Timestamp
}

export type MemberRole = "admin" | "user"

export interface RoomMember {
  id: string // {roomId}_{uid}
  roomId: string
  uid: string
  email: string
  role: MemberRole
  addedAt: Timestamp
}

export interface Booking {
  id: string
  roomId: string
  title: string
  description?: string
  startTime: Timestamp
  endTime: Timestamp
  createdBy: string // uid
  participants: string[] // uid[]
  createdAt: Timestamp
}
