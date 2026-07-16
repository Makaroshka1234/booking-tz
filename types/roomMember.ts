import { Timestamp } from "firebase/firestore"

export type MemberRole = "admin" | "user"

export interface RoomMember {
  id: string
  roomId: string
  uid: string
  email: string
  role: MemberRole
  addedAt: Timestamp
}
