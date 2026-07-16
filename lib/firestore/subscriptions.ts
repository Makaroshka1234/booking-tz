import {
  onSnapshot,
  query,
  Query,
  QueryDocumentSnapshot,
  FirestoreError,
  Timestamp,
} from "firebase/firestore"
import type { Room, Booking, RoomMember } from "@/types"

export function createSubscription<T>(
  buildQuery: () => Query,
  mapDoc: (doc: QueryDocumentSnapshot) => T,
  onError?: (error: FirestoreError) => void
) {
  return (onChange: (items: T[]) => void) => {
    return onSnapshot(
      buildQuery(),
      (snapshot) => {
        const items = snapshot.docs.map(mapDoc)
        onChange(items)
      },
      onError
    )
  }
}

export function mapRoomDoc(doc: QueryDocumentSnapshot): Room & { id: string } {
  const data = doc.data()
  return {
    id: doc.id,
    name: data.name,
    description: data.description,
    createdBy: data.createdBy,
    createdAt: data.createdAt,
  }
}

export function mapBookingDoc(doc: QueryDocumentSnapshot): Booking & { id: string } {
  const data = doc.data()
  return {
    id: doc.id,
    roomId: data.roomId,
    title: data.title,
    description: data.description,
    startTime: data.startTime,
    endTime: data.endTime,
    createdBy: data.createdBy,
    participants: data.participants || [data.createdBy],
    createdAt: data.createdAt,
  }
}

export function mapMemberDoc(doc: QueryDocumentSnapshot): RoomMember {
  const data = doc.data()
  return {
    id: data.id,
    roomId: data.roomId,
    uid: data.uid,
    email: data.email,
    role: data.role,
    addedAt: data.addedAt,
  }
}
