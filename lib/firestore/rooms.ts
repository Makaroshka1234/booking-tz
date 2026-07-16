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
import { createSubscription, mapRoomDoc } from "@/lib/firestore/subscriptions"
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
  const roomRef = doc(db, "rooms", roomId)
  await deleteDoc(roomRef)
}

const subscribeAllRooms = createSubscription(
  () => query(roomsCollection, orderBy("createdAt", "desc")),
  mapRoomDoc
)

const subscribeMyRooms = (uid: string) =>
  createSubscription(
    () => query(roomsCollection, where("createdBy", "==", uid), orderBy("createdAt", "desc")),
    mapRoomDoc
  )

export function subscribeToRooms(
  onRoomsChange: (rooms: (Room & { id: string })[]) => void
): () => void {
  return subscribeAllRooms(onRoomsChange)
}

export function subscribeToMyRooms(
  uid: string,
  onRoomsChange: (rooms: (Room & { id: string })[]) => void
): () => void {
  return subscribeMyRooms(uid)(onRoomsChange)
}

export function subscribeToJoinedRooms(
  uid: string,
  onRoomsChange: (rooms: (Room & { id: string })[]) => void
): () => void {
  const q = query(collection(db, "roomMembers"), where("uid", "==", uid))

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
        rooms.push(mapRoomDoc(doc))
      })
    }

    onRoomsChange(rooms)
  })

  return unsubscribe
}
