import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  Timestamp,
  query,
  orderBy,
  where,
  getDocs,
  documentId,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Room } from "@/types"

const roomsCollection = collection(db, "rooms")

export async function createRoom(
  name: string,
  description: string,
  userId: string
): Promise<string> {
  const roomData = {
    name,
    description,
    createdBy: userId,
    createdAt: Timestamp.now(),
  }

  const docRef = await addDoc(roomsCollection, roomData)
  return docRef.id
}

export async function updateRoom(
  roomId: string,
  name: string,
  description: string
): Promise<void> {
  const roomRef = doc(db, "rooms", roomId)
  await updateDoc(roomRef, {
    name,
    description,
  })
}

export async function deleteRoom(roomId: string): Promise<void> {
  // TODO: Cascade delete related bookings and roomMembers
  // - Delete all bookings where roomId === this room
  // - Delete all roomMembers where roomId === this room
  const roomRef = doc(db, "rooms", roomId)
  await deleteDoc(roomRef)
}

export function subscribeToRooms(
  onRoomsChange: (rooms: (Room & { id: string })[]) => void
): () => void {
  const q = query(roomsCollection, orderBy("createdAt", "desc"))

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const rooms: (Room & { id: string })[] = []
    snapshot.forEach((doc) => {
      rooms.push({
        id: doc.id,
        ...doc.data(),
      } as Room & { id: string })
    })
    onRoomsChange(rooms)
  })

  return unsubscribe
}

export function subscribeToMyRooms(
  uid: string,
  onRoomsChange: (rooms: (Room & { id: string })[]) => void
): () => void {
  const q = query(roomsCollection, where("createdBy", "==", uid), orderBy("createdAt", "desc"))

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const rooms: (Room & { id: string })[] = []
    snapshot.forEach((doc) => {
      rooms.push({
        id: doc.id,
        ...doc.data(),
      } as Room & { id: string })
    })
    onRoomsChange(rooms)
  })

  return unsubscribe
}

export function subscribeToJoinedRooms(
  uid: string,
  onRoomsChange: (rooms: (Room & { id: string })[]) => void
): () => void {
  const roomMembersCollection = collection(db, "roomMembers")
  const q = query(roomMembersCollection, where("uid", "==", uid))

  const unsubscribe = onSnapshot(q, async (snapshot) => {
    const roomIds = snapshot.docs.map((doc) => doc.data().roomId)

    if (roomIds.length === 0) {
      onRoomsChange([])
      return
    }

    const rooms: (Room & { id: string })[] = []

    for (let i = 0; i < roomIds.length; i += 30) {
      const chunk = roomIds.slice(i, i + 30)
      const roomsQuery = query(roomsCollection, where(documentId(), "in", chunk))
      const roomsSnapshot = await getDocs(roomsQuery)

      roomsSnapshot.forEach((doc) => {
        rooms.push({
          id: doc.id,
          ...doc.data(),
        } as Room & { id: string })
      })
    }

    onRoomsChange(rooms)
  })

  return unsubscribe
}
