import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  onSnapshot,
  query,
  where,
  Timestamp,
} from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { mapMemberDoc } from "@/lib/firestore/subscriptions"
import type { RoomMember } from "@/types"

const roomMembersCollection = collection(db, "roomMembers")

/**
 * Add a member to a room by uid
 * Only room creator can add members
 */
export async function addMember(
  roomId: string,
  uid: string,
  email: string,
  role: "admin" | "user"
): Promise<void> {
  const currentUser = auth.currentUser
  if (!currentUser) {
    throw new Error("Ви не авторизовані")
  }

  // Verify current user is room creator
  const roomRef = doc(db, "rooms", roomId)
  const roomSnapshot = await getDoc(roomRef)

  if (!roomSnapshot.exists()) {
    throw new Error("Кімната не знайдена")
  }

  if (roomSnapshot.data().createdBy !== currentUser.uid) {
    throw new Error("Тільки творець кімнати може додавати користувачів")
  }

  // Check if already a member
  const memberId = `${roomId}_${uid}`
  const existingMemberRef = doc(db, "roomMembers", memberId)
  const existingMemberSnapshot = await getDoc(existingMemberRef)

  if (existingMemberSnapshot.exists()) {
    throw new Error(`Користувач з email "${email}" вже учасник цієї кімнати`)
  }

  // Add member
  await setDoc(existingMemberRef, {
    id: memberId,
    roomId,
    uid,
    email,
    role,
    addedAt: Timestamp.now(),
  })
}

/**
 * Remove a member from a room
 */
export async function removeMember(
  roomId: string,
  uid: string
): Promise<void> {
  const memberId = `${roomId}_${uid}`
  const memberRef = doc(db, "roomMembers", memberId)
  await deleteDoc(memberRef)
}

/**
 * Get a member's role in a room
 */
export async function getMemberRole(
  roomId: string,
  uid: string
): Promise<"admin" | "user" | null> {
  const memberId = `${roomId}_${uid}`
  const memberRef = doc(db, "roomMembers", memberId)
  const snapshot = await getDoc(memberRef)

  if (!snapshot.exists()) {
    return null
  }

  return snapshot.data().role
}

export function subscribeToMembers(
  roomId: string,
  onMembersChange: (members: RoomMember[]) => void
): () => void {
  const q = query(roomMembersCollection, where("roomId", "==", roomId))

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const members = snapshot.docs.map(mapMemberDoc)
    onMembersChange(members)
  })

  return unsubscribe
}
